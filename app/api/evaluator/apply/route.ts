import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: Request) {
  try {
    const supabase: AnySupabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('로그인이 필요합니다', 401)

    const { projectId, applicantEmail, applicantDomain, applicantIntro, ndaAgreed } = await req.json()
    if (!projectId || !applicantEmail) return jsonError('필수 항목이 누락되었습니다', 400)

    // 크리에이터가 특정 성별을 타겟으로 리뷰어를 모집했는데, 성별 미입력
    // 상태로 지원이 되면 매칭 정확도가 깨진다(예: 20대 여성 타겟에 성별
    // 미입력 지원자가 섞임) — 지원 시점에 성별이 있어야만 지원 가능하게 막는다.
    const { data: profile } = await supabase.from('users').select('gender').eq('id', user.id).maybeSingle()
    if (!profile?.gender) {
      return jsonError('지원 전에 성별을 먼저 등록해주세요. 계정 설정에서 등록할 수 있어요.', 403)
    }

    // 참여 패널 프로필(직군별 인원 집계)이 domain_tags 미입력으로 항상
    // 비어 있던 문제(2026-07-31 확인: 5명 중 0명) — 성별과 같은 이유로
    // 지원 시점에도 막는다. 기존에 있던 리뷰 제출 시점 안전망은 그대로 둔다
    // (지원 절차를 우회하는 경로가 생겨도 최종적으로 걸러지도록 두 시점 다 필요).
    const { data: reviewerProfile } = await supabase
      .from('reviewer_profiles')
      .select('domain_tags')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!reviewerProfile?.domain_tags || reviewerProfile.domain_tags.length === 0) {
      return jsonError('지원 전에 관심 직군을 먼저 선택해주세요. 계정 설정에서 선택할 수 있어요.', 403)
    }

    // 프로젝트 상태 확인
    const { data: project } = await supabase
      .from('projects_public')
      .select('status, completed_count, target_count, title')
      .eq('id', projectId)
      .single()

    if (!project) return jsonError('프로젝트를 찾을 수 없습니다', 404)
    if (project.status !== 'active') return jsonError('현재 지원할 수 없는 프로젝트입니다', 400)

    // ⚠️ completed_count는 "리뷰 제출 완료" 수라서 모집 중(active)엔 항상
    // 0이다 — 이 값으로 모집 마감을 판단하면 target_count를 훨씬 넘겨서
    // 지원이 계속 들어와도 절대 막히지 않는다. 실제로 자리를 차지하고
    // 있는 지원(수락 대기 pending + 이미 수락된 accepted/completed) 수를
    // 따로 세서 target_count와 비교해야 한다.
    const { count: occupiedCount } = await supabase
      .from('project_matches')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .in('status', ['pending', 'accepted', 'completed'])
    if ((occupiedCount ?? 0) >= project.target_count) {
      return jsonError('모집 인원이 모두 찼습니다', 400)
    }

    // projects_public 뷰는 creator_id를 노출하지 않으므로(privacy) 서비스 롤로
    // 별도 확인 — 크리에이터가 자기 프로젝트에 리뷰어로 지원하는 것을 방지.
    const admin = createAdminClient()
    const { data: ownerCheck } = await admin
      .from('projects')
      .select('creator_id')
      .eq('id', projectId)
      .single()
    if (ownerCheck?.creator_id === user.id) {
      return jsonError('본인이 등록한 프로젝트에는 리뷰어로 지원할 수 없습니다', 400)
    }

    // 중복 지원 확인
    const { data: existing } = await supabase
      .from('project_matches')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('reviewer_id', user.id)
      .single()

    if (existing) return jsonError('이미 지원한 프로젝트입니다', 400)

    // 닉네임 자동 할당 — 원자적 시퀀스 RPC (migration 009, join/route.ts와 동일 이유)
    const { data: nickname, error: nicknameError } = await supabase.rpc('assign_reviewer_nickname', {
      p_project_id: projectId,
    })
    if (nicknameError || !nickname) return jsonError('닉네임 발급에 실패했습니다', 500)

    const { error: insertError } = await supabase.from('project_matches').insert({
      project_id: projectId,
      reviewer_id: user.id,
      nickname,
      status: 'pending',
      applicant_email: applicantEmail,
      applicant_domain: applicantDomain ?? [],
      applicant_intro: applicantIntro ?? null,
      applied_at: new Date().toISOString(),
      nda_agreed_at: ndaAgreed ? new Date().toISOString() : null,
    })

    if (insertError) {
      console.error('[apply]', insertError)
      return jsonError('지원 처리 중 오류가 발생했습니다', 500)
    }

    return NextResponse.json({ success: true, nickname })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
