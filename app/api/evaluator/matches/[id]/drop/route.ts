import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// H-5: 리뷰어 자진 하차 — 수락된 매칭을 리뷰어 스스로 취소.
// project_matches RLS(reviewer_id=auth.uid())가 이미 본인 row만 UPDATE
// 가능하게 해주므로 서비스 롤 없이 일반 인증 클라이언트로 충분하다.
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { data: match } = await supabase
      .from('project_matches')
      .select('id, reviewer_id, status, submitted_at')
      .eq('id', id)
      .single()

    if (!match || match.reviewer_id !== user.id) {
      return NextResponse.json({ error: '참여 정보를 찾을 수 없습니다' }, { status: 404 })
    }
    if (match.submitted_at || match.status === 'completed') {
      return NextResponse.json({ error: '이미 제출된 리뷰는 취소할 수 없습니다' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_matches')
      .update({ status: 'dropped' })
      .eq('id', id)
      .eq('reviewer_id', user.id)

    if (error) {
      console.error('[matches/drop]', error)
      return NextResponse.json({ error: '취소 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[matches/drop]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
