import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 스크랩 토글 — 이 유저가 스크랩한 글은 insight_scraps에 (insight_id, user_id)로
// 저장되고, /api/insights/scraps에서 본인 것만 조회해 "스크랩한 글" 목록으로
// 보여준다(마이페이지/스크랩 탭).
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: insightId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: existing } = await supabase
    .from('insight_scraps')
    .select('insight_id')
    .eq('insight_id', insightId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('insight_scraps').delete().eq('insight_id', insightId).eq('user_id', user.id)
    return NextResponse.json({ scrapped: false })
  }
  await supabase.from('insight_scraps').insert({ insight_id: insightId, user_id: user.id })
  return NextResponse.json({ scrapped: true })
}
