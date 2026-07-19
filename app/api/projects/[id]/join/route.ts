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
      .from('projects')
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

    // 닉네임 자동 할당 (A, B, C, ...)
    const { count } = await supabase
      .from('project_matches')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)

    const idx = (count ?? 0) % 26
    const nickname = `Reviewer_${String.fromCharCode(65 + idx)}`

    await supabase.from('project_matches').insert({
      project_id: id,
      reviewer_id: user.id,
      nickname,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      shipping_status: project.access_method === 'physical_shipping' ? 'pending' : 'not_required',
    })

    return NextResponse.json({ redirectTo: `/projects/${id}/review`, nickname })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
