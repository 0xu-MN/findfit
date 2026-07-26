import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자용 인사이트(구 "피드") 글 목록 — published 여부와 무관하게 전체를
// 보여준다(공개 조회용 /api/insights는 published=true만).
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('insight_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const body = await req.json()
  const { type, title, category, tag, cover_image_url, body: content, author, published } = body as {
    type?: string
    title?: string
    category?: string
    tag?: string
    cover_image_url?: string
    body?: string
    author?: string
    published?: boolean
  }

  if (!type || (type !== 'feed' && type !== 'newsroom')) {
    return NextResponse.json({ error: 'type은 feed 또는 newsroom이어야 합니다' }, { status: 400 })
  }
  if (!title || !content) {
    return NextResponse.json({ error: 'title, body는 필수입니다' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('insight_posts')
    .insert({
      type,
      title,
      category: category ?? null,
      tag: tag ?? null,
      cover_image_url: cover_image_url ?? null,
      body: content,
      author: author ?? 'FindFit',
      published: published ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
