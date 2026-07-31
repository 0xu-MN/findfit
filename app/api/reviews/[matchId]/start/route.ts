import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 리뷰어가 문항을 처음 연 시점을 기록한다 — 이미 값이 있으면 건드리지
// 않는다(폼을 열었다 닫았다 반복해도 최초 시작 시각이 유지되도록).
// RLS(project_matches_reviewer_own)가 이미 본인 매칭 row만 허용하므로
// 별도 소유권 체크 없이 update를 태워도 안전하다.
export async function POST(_req: Request, context: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: match } = await supabase
    .from('project_matches')
    .select('id, reviewer_id, review_started_at')
    .eq('id', matchId)
    .single()
  if (!match || match.reviewer_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }
  if (match.review_started_at) {
    return NextResponse.json({ ok: true, alreadyStarted: true })
  }

  const { error } = await supabase
    .from('project_matches')
    .update({ review_started_at: new Date().toISOString() })
    .eq('id', matchId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
