import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Supabase 환경변수 미설정 시 인증 건너뜀
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /admin 라우트 보호 (로그인 페이지 제외) — 통과 조건은 둘 중 하나:
  // ① 기존 공유 비밀번호 쿠키(findfit-admin-token === ADMIN_SECRET_KEY)
  // ② 로그인한 Supabase 유저의 users.is_admin = true (migration 031).
  // 예전엔 ①만 확인해서, is_admin 계정으로 로그인해도 여기서 무조건
  // /admin/login으로 튕겨나가는 버그가 있었다 — lib/auth/checkAdmin.ts의
  // 판정 기준과 반드시 동일하게 맞춰야 한다.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const legacyToken = request.cookies.get('findfit-admin-token')?.value
    const legacyOk = !!legacyToken && legacyToken === process.env.ADMIN_SECRET_KEY

    let accountAdminOk = false
    if (!legacyOk && user) {
      const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).maybeSingle()
      accountAdminOk = Boolean(data?.is_admin)
    }

    if (!legacyOk && !accountAdminOk) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
