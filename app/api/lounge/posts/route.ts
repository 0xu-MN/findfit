import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 라운지 글 목록 + 작성 — 예전엔 정적 목데이터에 세션 로컬로만 추가돼서
// 새로고침하면 사라졌다. 실제 lounge_posts 테이블에 영속화한다.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts, error } = await supabase
    .from('lounge_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const postIds = (posts ?? []).map((p) => p.id)
  const [{ data: likes }, { data: comments }] = await Promise.all([
    postIds.length ? supabase.from('lounge_likes').select('post_id, user_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from('lounge_comments').select('post_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
  ])

  const likeCountByPost = new Map<string, number>()
  const likedByMe = new Set<string>()
  for (const l of likes ?? []) {
    likeCountByPost.set(l.post_id, (likeCountByPost.get(l.post_id) ?? 0) + 1)
    if (user && l.user_id === user.id) likedByMe.add(l.post_id)
  }
  const commentCountByPost = new Map<string, number>()
  for (const c of comments ?? []) {
    commentCountByPost.set(c.post_id, (commentCountByPost.get(c.post_id) ?? 0) + 1)
  }

  const rows = (posts ?? []).map((p) => ({
    ...p,
    like_count: likeCountByPost.get(p.id) ?? 0,
    comment_count: commentCountByPost.get(p.id) ?? 0,
    liked_by_me: likedByMe.has(p.id),
  }))

  return NextResponse.json({ posts: rows })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { body } = (await req.json()) as { body?: string }
  const trimmed = (body ?? '').trim()
  if (!trimmed) return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })

  const { data: profile } = await supabase.from('users').select('nickname, email').eq('id', user.id).maybeSingle()
  const nickname = profile?.nickname ?? profile?.email?.split('@')[0] ?? '게스트'

  const { data: inserted, error } = await supabase
    .from('lounge_posts')
    .insert({ author_id: user.id, author_nickname: nickname, body: trimmed })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: { ...inserted, like_count: 0, comment_count: 0, liked_by_me: false } })
}
