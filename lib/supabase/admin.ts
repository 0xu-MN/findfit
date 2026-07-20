import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 서비스 롤(service_role) 키로 만든 서버 전용 클라이언트 — RLS를 완전히
// 우회한다. 절대 클라이언트 컴포넌트나 API 응답에 이 키/클라이언트를
// 노출하면 안 되며, `/admin/*` API 라우트처럼 이미 별도로 관리자 인증을
// 통과한 서버 코드에서만 사용한다 (관리자 인증은 middleware/각 라우트의
// ADMIN_SECRET_KEY 쿠키 체크가 담당 — 이 클라이언트 자체는 권한 검사를
// 하지 않으므로 호출부에서 반드시 먼저 인증을 확인해야 한다).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다 (.env.local 확인)')
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
