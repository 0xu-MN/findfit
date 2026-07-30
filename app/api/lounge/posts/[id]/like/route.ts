import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 좋아요 토글 — 이미 눌렀으면 취소, 아니면 추가.
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: postId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: existing } = await supabase
    .from('lounge_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('lounge_likes').delete().eq('post_id', postId).eq('user_id', user.id)
    return NextResponse.json({ liked: false })
  }
  await supabase.from('lounge_likes').insert({ post_id: postId, user_id: user.id })
  return NextResponse.json({ liked: true })
}
