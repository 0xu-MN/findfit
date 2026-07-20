import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserStatus } from '@/types/database'

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

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
  const { error } = await admin.from('users').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
