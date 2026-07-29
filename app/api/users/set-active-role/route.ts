import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 크리에이터/리뷰어 레이아웃 마운트 시 호출 — "지금 이 유저가 어느 모드를
// 쓰고 있는지"를 기록해서 관리자 패널에서 실시간으로 보여줄 수 있게 한다.
// users.role(가입 시 고정)과는 별개의 값이다.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { role } = (await req.json()) as { role?: string }
  if (role !== 'builder' && role !== 'evaluator') {
    return NextResponse.json({ error: '잘못된 값입니다' }, { status: 400 })
  }

  await supabase.from('users').update({ last_active_role: role }).eq('id', user.id)
  return NextResponse.json({ ok: true })
}
