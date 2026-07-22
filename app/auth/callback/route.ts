import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 구글/카카오 소셜 로그인 콜백 — signInWithOAuth의 redirectTo가 여기로 온다.
// code를 세션으로 교환한 뒤, /auth/login의 routeByRole과 동일한 규칙으로
// role 있으면 대시보드, 없으면(첫 소셜 로그인) role-select로 보낸다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: userRow } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', data.user.id)
        .single()

      if (userRow?.status === 'suspended' || userRow?.status === 'withdrawn') {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth/login?error=account_blocked`)
      }

      if (userRow?.role === 'builder') return NextResponse.redirect(`${origin}/builder/dashboard`)
      if (userRow?.role === 'evaluator') return NextResponse.redirect(`${origin}/evaluator/dashboard`)
      return NextResponse.redirect(`${origin}/auth/role-select`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
}
