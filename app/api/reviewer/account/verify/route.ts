import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: '입금자명 코드를 입력해주세요' }, { status: 400 })

    const admin = createAdminClient()
    const { data: pending } = await admin
      .from('account_verifications')
      .select('id, deposit_code, expires_at, verified_at')
      .eq('user_id', user.id)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!pending) return NextResponse.json({ error: '계좌 인증을 먼저 요청해주세요' }, { status: 400 })
    if (new Date(pending.expires_at) < new Date()) {
      return NextResponse.json({ error: '인증 시간이 만료됐어요. 계좌를 다시 등록해주세요' }, { status: 400 })
    }
    if (pending.deposit_code !== String(code).trim()) {
      return NextResponse.json({ error: '입금자명이 일치하지 않아요' }, { status: 400 })
    }

    await admin.from('account_verifications').update({ verified_at: new Date().toISOString() }).eq('id', pending.id)

    const { error } = await supabase
      .from('reviewer_profiles')
      .update({ is_account_verified: true, account_verified_at: new Date().toISOString() })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: '인증 처리에 실패했습니다' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reviewer/account/verify]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
