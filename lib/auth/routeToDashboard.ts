'use client'

import { createClient } from '@/lib/supabase/client'

// Shared by every "시작하기"/CTA button on the marketing pages
// (Header.tsx, HeroSection.tsx, ReviewerLanding.tsx) — these all used to
// link straight to /builder/dashboard or /evaluator/dashboard, which have
// no auth guard of their own, so a logged-out visitor landed on a blank/
// broken dashboard instead of ever seeing a login screen. This checks the
// session first and routes to login (or role-select, for a session with no
// role yet) instead.
export async function routeToDashboardOrLogin(router: { push: (path: string) => void }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    router.push('/auth/login')
    return
  }

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role === 'builder') router.push('/builder/dashboard')
  else if (data?.role === 'evaluator') router.push('/evaluator/dashboard')
  else router.push('/auth/role-select')
}
