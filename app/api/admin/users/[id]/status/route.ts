import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserStatus } from '@/types/database'

// 유저 정지/재활성/탈퇴 처리. users.status는 authenticated 롤의 UPDATE
// 권한이 DB에서 REVOKE되어 있어(migration 009, 본인 스스로 정지 해제
// 방지) 서비스 롤로만 바꿀 수 있다 — 이 라우트가 그 유일한 경로다.
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const { id } = await context.params
  const { status } = (await req.json()) as { status: UserStatus }
  if (!['active', 'suspended', 'withdrawn'].includes(status)) {
    return NextResponse.json({ error: '잘못된 상태값입니다' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 프론트 가드(is_admin 클릭 자체를 막음)와 별개로, API를 직접 호출해도
  // 관리자 계정은 정지/탈퇴 처리되지 않도록 서버에서도 막는다.
  if (status !== 'active') {
    const { data: target } = await admin.from('users').select('is_admin').eq('id', id).maybeSingle()
    if (target?.is_admin) {
      return NextResponse.json({ error: '관리자 계정은 정지/탈퇴 처리할 수 없습니다' }, { status: 403 })
    }
  }

  const { error } = await admin.from('users').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
