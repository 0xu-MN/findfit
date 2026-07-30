import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 공개 조회 — 로그인한 크리에이터/리뷰어 모두 접근하는 인사이트(구 "피드")
// 목록. published=true인 글만 노출된다(RLS insight_posts_select_published,
// supabase/migrations/030_insight_posts.sql).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const supabase = await createClient()
  let query = supabase
    .from('insight_posts')
    .select('id, type, title, category, tag, cover_image_url, body, author, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (type === 'feed' || type === 'newsroom') {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 좋아요/스크랩/댓글 수 + 내가 좋아요/스크랩했는지 — 예전엔 이 반응
  // 버튼들이 실제 데이터 없이 장식으로만 있어서 눌러도 아무 일도 안
  // 일어났다. 목록 단계에서 카운트/내 상태까지 같이 내려준다.
  const { data: { user } } = await supabase.auth.getUser()
  const postIds = (data ?? []).map((p) => p.id)
  const [{ data: likes }, { data: scraps }, { data: comments }] = postIds.length
    ? await Promise.all([
        supabase.from('insight_likes').select('insight_id, user_id').in('insight_id', postIds),
        user ? supabase.from('insight_scraps').select('insight_id').eq('user_id', user.id).in('insight_id', postIds) : Promise.resolve({ data: [] }),
        supabase.from('insight_comments').select('insight_id').in('insight_id', postIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const likeCountById = new Map<string, number>()
  const likedByMe = new Set<string>()
  for (const l of likes ?? []) {
    likeCountById.set(l.insight_id, (likeCountById.get(l.insight_id) ?? 0) + 1)
    if (user && l.user_id === user.id) likedByMe.add(l.insight_id)
  }
  const scrappedByMe = new Set((scraps ?? []).map((s) => s.insight_id))
  const commentCountById = new Map<string, number>()
  for (const c of comments ?? []) {
    commentCountById.set(c.insight_id, (commentCountById.get(c.insight_id) ?? 0) + 1)
  }

  const posts = (data ?? []).map((p) => ({
    ...p,
    like_count: likeCountById.get(p.id) ?? 0,
    comment_count: commentCountById.get(p.id) ?? 0,
    liked_by_me: likedByMe.has(p.id),
    scrapped_by_me: scrappedByMe.has(p.id),
  }))

  return NextResponse.json({ posts })
}
