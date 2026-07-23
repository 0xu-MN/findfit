import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDepositCode, sendVerificationDeposit } from '@/lib/bank/verify'

const CODE_TTL_MINUTES = 30

// 계좌 등록 + 1원(랜덤 4자리 코드 입금자명) 발송 — 등록 시점엔 아직 미인증
// 상태로 저장하고, /verify에서 코드가 맞으면 그때 is_account_verified=true.
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { bankName, accountNumber, accountHolder } = await req.json()
    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: '계좌 정보를 모두 입력해주세요' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('reviewer_profiles')
      .update({
        bank_name: bankName,
        account_number: accountNumber, // TODO: pgcrypto 암호화 적용
        account_holder: accountHolder,
        is_account_verified: false,
        account_verified_at: null,
      })
      .eq('user_id', user.id)
    if (updateError) return NextResponse.json({ error: '계좌 저장에 실패했습니다' }, { status: 500 })

    const depositCode = generateDepositCode()
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    // account_verifications는 RLS만 켜져 있고 정책이 없어(서비스 롤 전용)
    // admin 클라이언트로만 쓸 수 있다
    const admin = createAdminClient()
    const { error } = await admin
      .from('account_verifications')
      .insert({ user_id: user.id, bank_name: bankName, account_number: accountNumber, deposit_code: depositCode, expires_at: expiresAt })
    if (error) return NextResponse.json({ error: '인증 코드 발급에 실패했습니다' }, { status: 500 })

    await sendVerificationDeposit(bankName, accountNumber)
    // mock 단계에서는 실제 입금이 없으니, 개발/QA 편의를 위해 응답에도 코드를
    // 실어준다. TODO: 실연동 시 이 필드는 제거할 것(입금자명은 본인 은행
    // 앱에서만 확인해야 함).
    const devCode = process.env.PORTONE_ACCOUNT_VERIFY_KEY ? undefined : depositCode

    return NextResponse.json({ success: true, devCode })
  } catch (err) {
    console.error('[reviewer/account/send]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
