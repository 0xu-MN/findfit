import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자용 라운지 글 목록 — 부적절/부정적인 글을 찾아서 삭제할 수 있게
// 좋아요/댓글 수까지 함께 집계해서 내려준다.
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: posts, error } = await admin
    .from('lounge_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const postIds = (posts ?? []).map((p) => p.id)
  const [{ data: likes }, { data: comments }] = await Promise.all([
    postIds.length ? admin.from('lounge_likes').select('post_id') .in('post_id', postIds) : Promise.resolve({ data: [] }),
    postIds.length ? admin.from('lounge_comments').select('post_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
  ])

  const likeCountByPost = new Map<string, number>()
  for (const l of likes ?? []) likeCountByPost.set(l.post_id, (likeCountByPost.get(l.post_id) ?? 0) + 1)
  const commentCountByPost = new Map<string, number>()
  for (const c of comments ?? []) commentCountByPost.set(c.post_id, (commentCountByPost.get(c.post_id) ?? 0) + 1)

  const rows = (posts ?? []).map((p) => ({
    ...p,
    like_count: likeCountByPost.get(p.id) ?? 0,
    comment_count: commentCountByPost.get(p.id) ?? 0,
  }))

  return NextResponse.json({ posts: rows })
}
