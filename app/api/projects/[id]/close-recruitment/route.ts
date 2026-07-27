import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 크리에이터가 모집을 계속할지 여부를 직접 선택하는 API — "모집인원 미달이어도
// 진행" 또는 "예상보다 일찍 다 찼으니 조기 마감하고 바로 리뷰 시작" 둘 다
// 프로젝트를 리뷰 단계로 넘기는 동일한 상태 전이(active → reviewing)다.
// mode는 의미 구분/향후 통계용으로만 저장하지 않고 응답에만 반영한다 —
// projects 테이블에 별도 컬럼을 추가할 만큼 이번 범위에서 중요하지 않다.
//
// 이 전이는 지금까지 앱 어디에도 없던 유일한 진입점이다 — distribute
// 라우트(app/api/projects/[id]/distribute/route.ts)가 이미 project.status
// === 'reviewing'을 전제로 하고 있었는데, 그 상태로 넘기는 코드가 지금껏
// 하나도 없어서 크리에이터가 사례금 배분 단계 자체에 도달할 방법이 없었다.
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { mode } = (await req.json()) as { mode?: 'proceed_short' | 'early_close' }
  if (mode !== 'proceed_short' && mode !== 'early_close') {
    return NextResponse.json({ error: 'mode는 proceed_short 또는 early_close여야 합니다' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, creator_id, status, target_count, completed_count')
    .eq('id', id)
    .single()
  if (!project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  if (project.creator_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (project.status !== 'active') {
    return NextResponse.json({ error: '모집 중인 프로젝트만 마감할 수 있습니다' }, { status: 400 })
  }

  const { error } = await supabase.from('projects').update({ status: 'reviewing' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, mode })
}
