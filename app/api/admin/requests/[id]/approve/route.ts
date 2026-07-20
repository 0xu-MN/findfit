import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

// 검수 대기(pending_review) 프로젝트를 active로 전환 — 이 순간부터
// projects_public 뷰(리뷰어 피드)에 노출된다.
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }
  const { id } = await context.params
  const admin = createAdminClient()

  const { error } = await admin.from('projects').update({ status: 'active' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
