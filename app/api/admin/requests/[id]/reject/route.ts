import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }
  const { id } = await context.params
  const admin = createAdminClient()

  const { error } = await admin.from('projects').update({ status: 'rejected' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
