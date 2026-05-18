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

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // 역할 미설정 → role-select로
    if (!role && pathname !== '/auth/role-select') {
      return NextResponse.redirect(new URL('/auth/role-select', request.url))
    }

    // 잘못된 역할 경로 접근 차단
    if (role && pathname.startsWith('/builder') && role !== 'builder' && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_REDIRECT[role] ?? '/', request.url))
    }
    if (role && pathname.startsWith('/evaluator') && role !== 'evaluator' && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_REDIRECT[role] ?? '/', request.url))
    }
    if (role && pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_REDIRECT[role] ?? '/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
