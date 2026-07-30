import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 크리에이터/리뷰어 대시보드가 그 역할의 온보딩 코치마크를 실제로 띄운
// 시점에 호출 — 이 계정이 해당 역할을 처음 써봤다는 걸 서버에 기록해서,
// 다음부터는(다른 브라우저에서도) 다시 안 뜨게 한다.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { role } = (await req.json()) as { role?: string }
  if (role !== 'creator' && role !== 'reviewer') {
    return NextResponse.json({ error: '잘못된 값입니다' }, { status: 400 })
  }

  const now = new Date().toISOString()
  if (role === 'creator') {
    await supabase.from('users').update({ creator_onboarded_at: now }).eq('id', user.id)
  } else {
    await supabase.from('users').update({ reviewer_onboarded_at: now }).eq('id', user.id)
  }
  return NextResponse.json({ ok: true })
}
