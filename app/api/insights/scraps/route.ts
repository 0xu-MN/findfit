import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 내가 스크랩한 인사이트 글 목록 — 스크랩 버튼을 눌렀을 때 그 결과를
// 실제로 확인할 수 있는 곳. insight_scraps(user_id, insight_id)에 저장된
// 것과 insight_posts를 join해서 돌려준다.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: scraps } = await supabase
    .from('insight_scraps')
    .select('insight_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const ids = (scraps ?? []).map((s) => s.insight_id)
  if (ids.length === 0) return NextResponse.json({ posts: [] })

  const { data: posts, error } = await supabase
    .from('insight_posts')
    .select('id, type, title, category, tag, cover_image_url, body, author, created_at')
    .in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 스크랩한 순서 유지
  const byId = new Map((posts ?? []).map((p) => [p.id, p]))
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean)

  return NextResponse.json({ posts: ordered })
}
