import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// 네이버 로그인 시작 — Supabase Auth엔 네이버가 기본 제공 provider로 없어서
// (구글/카카오와 달리) 직접 OAuth2 인가 코드 플로우를 구현한다.
// 1) CSRF 방지용 state를 만들어 httpOnly 쿠키에 저장
// 2) 네이버 인증 페이지로 리다이렉트 — 사용자가 동의하면 콜백으로 code가 옴
export async function GET(request: Request) {
  const { origin } = new URL(request.url)

  const clientId = process.env.NAVER_LOGIN_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_not_configured`)
  }

  const state = crypto.randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('naver_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })

  const redirectUri = `${origin}/api/auth/naver/callback`
  const authUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
