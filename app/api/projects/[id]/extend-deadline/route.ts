import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EXTEND_DAYS = 3

// 모집 마감일이 지났는데 목표 인원을 못 채운 경우, 크리에이터가 "며칠 더
// 기다리며 추가 모집"을 선택할 수 있게 하는 API — 지금 시각 기준으로
// deadline을 EXTEND_DAYS일 뒤로 미룬다. status는 그대로 'active' 유지
// (계속 모집 중이라는 뜻이라 close-recruitment와 달리 상태 전이가 없다).
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, creator_id, status')
    .eq('id', id)
    .single()
  if (!project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  if (project.creator_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (project.status !== 'active') {
    return NextResponse.json({ error: '모집 중인 프로젝트만 기간을 연장할 수 있습니다' }, { status: 400 })
  }

  const newDeadline = new Date(Date.now() + EXTEND_DAYS * 86400000).toISOString()
  const { error } = await supabase.from('projects').update({ deadline: newDeadline }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deadline: newDeadline })
}
