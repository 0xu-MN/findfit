import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export type RequireUserResult =
  | { ok: true; user: { id: string; email: string; role: UserRole | null } }
  | { ok: false; reason: 'unauthenticated' | 'suspended' | 'withdrawn' | 'wrong_role' }

// 세션 + 계정 상태(status) + (선택) 역할을 한 곳에서 검증하는 서버 전용
// 헬퍼. 지금까지 페이지/라우트마다 `supabase.auth.getUser()`만 부르고
// status/role은 아예 확인하지 않던 걸 통일한다.
export async function requireUser(allowedRoles?: UserRole[]): Promise<RequireUserResult> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { ok: false, reason: 'unauthenticated' }

  const { data: row } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', authUser.id)
    .single()
  if (!row) return { ok: false, reason: 'unauthenticated' }

  if (row.status === 'suspended') return { ok: false, reason: 'suspended' }
  if (row.status === 'withdrawn') return { ok: false, reason: 'withdrawn' }
  if (allowedRoles && (!row.role || !allowedRoles.includes(row.role))) {
    return { ok: false, reason: 'wrong_role' }
  }

  return { ok: true, user: { id: row.id, email: row.email, role: row.role } }
}
