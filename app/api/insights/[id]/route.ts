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
  return NextResponse.json({ post: data })
}
