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
  return NextResponse.json({ posts: data ?? [] })
}
