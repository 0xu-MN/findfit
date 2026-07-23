import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: 공개 공유 페이지(app/r/[slug])에서 이메일을 남기는 방문자용 — 로그인
// 불필요. 공개 페이지에서만 호출되므로 서비스 롤로 직접 처리(RLS는 크리에이터
// 조회 전용이라 익명 사용자는 어차피 report_share_events를 못 씀).
export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { email } = await req.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: '올바른 이메일을 입력해주세요' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: share } = await admin
      .from('report_shares')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!share) return NextResponse.json({ error: '존재하지 않는 링크입니다' }, { status: 404 })

    const { error } = await admin
      .from('report_share_events')
      .insert({ share_id: share.id, event_type: 'email_capture', email: email.trim() })
    if (error) return NextResponse.json({ error: '저장 중 오류가 발생했습니다' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reports/share/capture:POST]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
