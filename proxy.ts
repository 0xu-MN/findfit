import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_REDIRECT: Record<string, string> = {
  builder: '/builder/dashboard',
  evaluator: '/evaluator/dashboard',
  admin: '/admin/requests',
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Supabase 환경변수 미설정 시 인증 건너뜀 (랜딩페이지 등 정상 렌더링)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
  const { pathname } = request.nextUrl

  // 인증 없이 접근 가능한 경로
  const publicPaths = ['/', '/auth/login', '/auth/signup']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/auth'))

  // TODO: 로그인 로직 완성 후 아래 주석 해제
  // if (!user && !isPublic) {
  //   return NextResponse.redirect(new URL('/auth/login', request.url))
  // }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
