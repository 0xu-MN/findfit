import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: insightId } = await context.params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('insight_comments')
    .select('*')
    .eq('insight_id', insightId)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: insightId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { body } = (await req.json()) as { body?: string }
  const trimmed = (body ?? '').trim()
  if (!trimmed) return NextResponse.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 })

  const { data: profile } = await supabase.from('users').select('nickname, email').eq('id', user.id).maybeSingle()
  const nickname = profile?.nickname ?? profile?.email?.split('@')[0] ?? '게스트'

  const { data: inserted, error } = await supabase
    .from('insight_comments')
    .insert({ insight_id: insightId, author_id: user.id, author_nickname: nickname, body: trimmed })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: inserted })
}
