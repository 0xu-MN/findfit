import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자가 부적절/부정적인 라운지 글을 강제 삭제한다. 일반 삭제 API
// (app/api/lounge/posts/[id])는 RLS로 본인 글만 지울 수 있게 막혀 있어서
// 이 용도로 쓸 수 없다 — service role을 쓰는 별도 관리자 라우트가 필요하다.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('lounge_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
