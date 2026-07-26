import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }
  const { id } = await params
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

  const patch: {
    type?: string
    title?: string
    category?: string | null
    tag?: string | null
    cover_image_url?: string | null
    body?: string
    author?: string
    published?: boolean
  } = {}
  if (type !== undefined) patch.type = type
  if (title !== undefined) patch.title = title
  if (category !== undefined) patch.category = category
  if (tag !== undefined) patch.tag = tag
  if (cover_image_url !== undefined) patch.cover_image_url = cover_image_url
  if (content !== undefined) patch.body = content
  if (author !== undefined) patch.author = author
  if (published !== undefined) patch.published = published

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('insight_posts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('insight_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
