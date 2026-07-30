import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: insightId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: existing } = await supabase
    .from('insight_likes')
    .select('insight_id')
    .eq('insight_id', insightId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('insight_likes').delete().eq('insight_id', insightId).eq('user_id', user.id)
    return NextResponse.json({ liked: false })
  }
  await supabase.from('insight_likes').insert({ insight_id: insightId, user_id: user.id })
  return NextResponse.json({ liked: true })
}
