import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자 판정 — 두 경로 중 하나만 맞으면 통과:
// ① 기존 공유 비밀번호 쿠키(findfit-admin-token === ADMIN_SECRET_KEY)
// ② 로그인한 Supabase 유저의 users.is_admin = true (haloforge 계정처럼
//    실제 로그인 계정에 관리자 권한을 심은 경우 — migration 031)
// 어느 한쪽이라도 유효하면 관리자 API를 계속 그대로 쓸 수 있다(하위호환).
export async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  if (token && token === process.env.ADMIN_SECRET_KEY) return true

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const admin = createAdminClient()
  const { data } = await admin.from('users').select('is_admin').eq('id', user.id).maybeSingle()
  return Boolean(data?.is_admin)
}
