import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateVerificationCode, sendVerificationSms } from '@/lib/sms/solapi'

const CODE_TTL_MINUTES = 5

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { phone } = await req.json()
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: '휴대폰 번호를 입력해주세요' }, { status: 400 })
    }
    const normalized = phone.replace(/[^0-9]/g, '')

    const admin = createAdminClient()

    // 이미 다른 계정이 인증 완료한 번호면 SMS 낭비 없이 여기서 먼저 막는다
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('phone', normalized)
      .not('phone_verified_at', 'is', null)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: '이미 가입된 번호입니다' }, { status: 409 })

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    // phone_verifications는 RLS가 켜져 있고 정책이 없어(서비스 롤 전용) admin
    // 클라이언트로만 쓸 수 있다
    const { error } = await admin
      .from('phone_verifications')
      .insert({ user_id: user.id, phone: normalized, code, expires_at: expiresAt })
    if (error) return NextResponse.json({ error: '인증코드 발급에 실패했습니다' }, { status: 500 })

    await sendVerificationSms(normalized, code)

    // 개발 환경 + SOLAPI 키 미발급(mock 발송) 상태에서는 서버 터미널
    // console.log로만 코드가 남아서, 브라우저에서 테스트하는 사람은 실제로
    // 인증할 방법이 없었다 — 로컬 개발 편의를 위해 이 조건에서만 코드를
    // 응답에 함께 실어 화면에 보여준다. 운영 환경(NODE_ENV=production)
    // 또는 실제 SOLAPI 키가 있으면 절대 노출하지 않는다.
    const devCode = process.env.NODE_ENV !== 'production' && !process.env.SOLAPI_API_KEY ? code : undefined

    return NextResponse.json({ success: true, devCode })
  } catch (err) {
    console.error('[auth/phone/send]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
