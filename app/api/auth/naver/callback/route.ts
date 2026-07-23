import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// 네이버 로그인 콜백 — Supabase가 네이버를 모르기 때문에, 여기서 직접:
//   1) 인가 코드를 네이버 액세스 토큰으로 교환
//   2) 그 토큰으로 네이버 프로필(이메일) 조회
//   3) 그 이메일로 Supabase 유저를 찾거나 새로 만듦(서비스 롤)
//   4) 매직링크를 "발급만" 하고 실제 이메일 발송 없이 서버에서 바로
//      검증(verifyOtp)해서 세션 쿠키를 확립 — 사용자가 메일함을 열 필요 없음
// 이후 라우팅 규칙은 app/auth/callback/route.ts(구글/카카오)와 동일하게 맞춤.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const savedState = cookieStore.get('naver_oauth_state')?.value

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_state_mismatch`)
  }

  // 데이터랩 API와 같은 네이버 앱 키(NAVER_CLIENT_ID/SECRET)를 그대로 재사용 —
  // 그 앱에 "네이버 로그인" API가 함께 활성화되어 있으면 키 하나로 충분하다.
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_not_configured`)
  }

  // 1) 코드 → 액세스 토큰
  const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token')
  tokenUrl.searchParams.set('grant_type', 'authorization_code')
  tokenUrl.searchParams.set('client_id', clientId)
  tokenUrl.searchParams.set('client_secret', clientSecret)
  tokenUrl.searchParams.set('code', code)
  tokenUrl.searchParams.set('state', state)

  const tokenRes = await fetch(tokenUrl.toString())
  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  if (!tokenJson.access_token) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_token_failed`)
  }

  // 2) 프로필 조회
  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  const profileJson = (await profileRes.json()) as {
    response?: { id: string; email?: string; nickname?: string }
  }
  const naverProfile = profileJson.response
  if (!naverProfile?.email) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_email_required`)
  }

  const admin = createAdminClient()

  // 3) 유저 없으면 생성 (이미 있으면 "already registered" 에러 → 무시하고 계속)
  const { error: createErr } = await admin.auth.admin.createUser({
    email: naverProfile.email,
    email_confirm: true,
    user_metadata: { provider: 'naver', naver_id: naverProfile.id },
  })
  if (createErr && !createErr.message?.toLowerCase().includes('already registered')) {
    console.error('[naver callback] createUser failed', createErr)
    return NextResponse.redirect(`${origin}/auth/login?error=naver_create_failed`)
  }

  // 4) 매직링크 발급 → 서버에서 바로 검증해 세션 확립 (이메일 발송 없음)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: naverProfile.email,
  })
  const tokenHash = linkData?.properties?.hashed_token
  if (linkErr || !tokenHash) {
    console.error('[naver callback] generateLink failed', linkErr)
    return NextResponse.redirect(`${origin}/auth/login?error=naver_link_failed`)
  }

  const supabase = await createClient()
  const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })
  if (verifyErr || !verifyData.user) {
    console.error('[naver callback] verifyOtp failed', verifyErr)
    return NextResponse.redirect(`${origin}/auth/login?error=naver_session_failed`)
  }

  cookieStore.delete('naver_oauth_state')

  // 이후 라우팅 규칙은 구글/카카오 콜백과 동일
  const { data: userRow } = await supabase
    .from('users')
    .select('role, status, nickname')
    .eq('id', verifyData.user.id)
    .single()

  if (userRow?.status === 'suspended' || userRow?.status === 'withdrawn') {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/auth/login?error=account_blocked`)
  }

  if (!userRow?.nickname) return NextResponse.redirect(`${origin}/auth/complete-profile`)
  if (userRow?.role === 'builder') return NextResponse.redirect(`${origin}/builder/dashboard`)
  if (userRow?.role === 'evaluator') return NextResponse.redirect(`${origin}/evaluator/dashboard`)
  return NextResponse.redirect(`${origin}/auth/role-select`)
}
