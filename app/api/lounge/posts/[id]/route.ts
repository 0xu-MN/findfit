import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 라운지 "내가 쓴 글" 관리에서 삭제할 수 있게 하는 라우트. RLS
// (lounge_posts_delete: auth.uid() = author_id)가 이미 본인 글만 지울 수
// 있게 막아주므로, 서버에서 별도 소유권 체크 없이 그대로 delete를 태워도
// 안전하다 — 다만 명확한 에러 메시지를 위해 한 번 더 확인한다.
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: post } = await supabase.from('lounge_posts').select('author_id').eq('id', id).single()
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다' }, { status: 404 })
  if (post.author_id !== user.id) return NextResponse.json({ error: '본인 글만 삭제할 수 있습니다' }, { status: 403 })

  const { error } = await supabase.from('lounge_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
