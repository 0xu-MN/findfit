import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { phone, code } = await req.json()
    if (!phone || !code) return NextResponse.json({ error: '인증코드를 입력해주세요' }, { status: 400 })
    const normalized = String(phone).replace(/[^0-9]/g, '')

    const admin = createAdminClient()

    const { data: pending } = await admin
      .from('phone_verifications')
      .select('id, code, expires_at, verified_at')
      .eq('user_id', user.id)
      .eq('phone', normalized)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!pending) return NextResponse.json({ error: '인증을 먼저 요청해주세요' }, { status: 400 })
    if (new Date(pending.expires_at) < new Date()) {
      return NextResponse.json({ error: '인증코드가 만료됐어요. 다시 요청해주세요' }, { status: 400 })
    }
    if (pending.code !== String(code).trim()) {
      return NextResponse.json({ error: '인증코드가 일치하지 않아요' }, { status: 400 })
    }

    await admin.from('phone_verifications').update({ verified_at: new Date().toISOString() }).eq('id', pending.id)

    const { error: updateError } = await admin
      .from('users')
      .update({ phone: normalized, phone_verified_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      // users.phone UNIQUE 제약 — 인증 대기 중 다른 계정이 먼저 같은 번호를
      // 가져간 드문 경쟁 상황
      if (updateError.code === '23505') {
        return NextResponse.json({ error: '이미 가입된 번호입니다' }, { status: 409 })
      }
      return NextResponse.json({ error: '인증 처리에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/phone/verify]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
