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

    // apply/route.ts와 동일한 이유 — 성별 미입력 상태로 참여가 되면 타겟
    // 성별 기반 매칭 정확도가 깨진다.
    const { data: profile } = await supabase.from('users').select('gender').eq('id', user.id).maybeSingle()
    if (!profile?.gender) {
      return jsonError('참여 전에 성별을 먼저 등록해주세요. 계정 설정에서 등록할 수 있어요.', 403)
    }

    // apply/route.ts와 동일한 이유 — 참여 패널 프로필의 직군 집계가 항상
    // 비어 있지 않도록, 성별과 같이 참여 시점에도 막는다(리뷰 제출 시점
    // 안전망은 그대로 유지 — 두 시점 다 필요).
    const { data: reviewerProfile } = await supabase
      .from('reviewer_profiles')
      .select('domain_tags')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!reviewerProfile?.domain_tags || reviewerProfile.domain_tags.length === 0) {
      return jsonError('참여 전에 관심 직군을 먼저 선택해주세요. 계정 설정에서 선택할 수 있어요.', 403)
    }

    const { data: project } = await supabase
      .from('projects_public')
      .select('status, completed_count, target_count, access_method')
      .eq('id', id)
      .single()

    if (!project) return jsonError('프로젝트를 찾을 수 없습니다', 404)
    if (project.status !== 'active') return jsonError('현재 참여할 수 없는 프로젝트입니다', 400)

    // completed_count(리뷰 제출 완료 수)는 모집 중엔 항상 0이라 이걸로
    // 마감을 판단하면 절대 안 막힌다 — 실제 자리를 차지한 지원 수로 비교.
    const { count: occupiedCount } = await supabase
      .from('project_matches')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
      .in('status', ['pending', 'accepted', 'completed'])
    if ((occupiedCount ?? 0) >= project.target_count) {
      return jsonError('모집이 마감된 프로젝트입니다', 400)
    }

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
