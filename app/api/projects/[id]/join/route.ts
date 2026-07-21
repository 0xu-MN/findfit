import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase: AnySupabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('로그인이 필요합니다', 401)

    const { data: project } = await supabase
      .from('projects_public')
      .select('status, completed_count, target_count, access_method')
      .eq('id', id)
      .single()

    if (!project) return jsonError('프로젝트를 찾을 수 없습니다', 404)
    if (project.status !== 'active') return jsonError('현재 참여할 수 없는 프로젝트입니다', 400)
    if (project.completed_count >= project.target_count) return jsonError('모집이 마감된 프로젝트입니다', 400)

    // 이미 참여 중인지 확인
    const { data: existing } = await supabase
      .from('project_matches')
      .select('id')
      .eq('project_id', id)
      .eq('reviewer_id', user.id)
      .single()

    if (existing) return jsonError('이미 참여 중인 프로젝트입니다', 400)

    // 닉네임 자동 할당 — 프로젝트별 원자적 시퀀스(RPC, SECURITY DEFINER)로
    // 발급. count 기반 방식은 26명을 넘으면 겹치고 동시 요청 시 레이스
    // 컨디션이 있어 폐기 (migration 009).
    const { data: nickname, error: nicknameError } = await supabase.rpc('assign_reviewer_nickname', {
      p_project_id: id,
    })
    if (nicknameError || !nickname) return jsonError('닉네임 발급에 실패했습니다', 500)

    await supabase.from('project_matches').insert({
      project_id: id,
      reviewer_id: user.id,
      nickname,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      shipping_status: project.access_method === 'physical_shipping' ? 'pending' : 'not_required',
    })

    return NextResponse.json({ redirectTo: `/evaluator/review/${id}`, nickname })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
