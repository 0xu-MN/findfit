import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 등록 마법사에서만 입력받던 재무 정보(예상 판매가/원가/마케팅 예산)를
// 이미 등록된 프로젝트에도 나중에 추가/수정할 수 있게 하는 라우트 —
// 등록 시점에 안 채웠거나 나중에 값이 바뀐 경우를 위함. extra_data의
// 다른 키(occupations 등)를 덮어쓰지 않도록 기존 값과 merge한다.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const body = (await req.json()) as {
    expectedPrice?: number
    expectedCost?: number
    marketingBudget?: number
  }
  const expectedPrice = Number(body.expectedPrice) || 0
  const expectedCost = Number(body.expectedCost) || 0
  const marketingBudget = Number(body.marketingBudget) || 0

  const { data: project } = await supabase
    .from('projects')
    .select('creator_id, extra_data')
    .eq('id', id)
    .single()
  if (!project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  if (project.creator_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

  const financials =
    expectedPrice > 0 || expectedCost > 0 || marketingBudget > 0
      ? { expectedPrice, expectedCost, marketingBudget }
      : null

  const nextExtraData = { ...(project.extra_data ?? {}), financials }

  const { error } = await supabase.from('projects').update({ extra_data: nextExtraData }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, financials })
}
