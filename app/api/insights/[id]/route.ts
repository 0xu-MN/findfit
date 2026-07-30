import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('insight_posts')
    .select('id, type, title, category, tag, cover_image_url, body, author, created_at')
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error || !data) return NextResponse.json({ error: '찾을 수 없습니다' }, { status: 404 })

  const { data: { user } } = await supabase.auth.getUser()
  const [{ count: likeCount }, { data: myLike }, { data: myScrap }, { count: commentCount }] = await Promise.all([
    supabase.from('insight_likes').select('insight_id', { count: 'exact', head: true }).eq('insight_id', id),
    user ? supabase.from('insight_likes').select('insight_id').eq('insight_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from('insight_scraps').select('insight_id').eq('insight_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('insight_comments').select('id', { count: 'exact', head: true }).eq('insight_id', id),
  ])

  return NextResponse.json({
    post: {
      ...data,
      like_count: likeCount ?? 0,
      comment_count: commentCount ?? 0,
      liked_by_me: Boolean(myLike),
      scrapped_by_me: Boolean(myScrap),
    },
  })
}
