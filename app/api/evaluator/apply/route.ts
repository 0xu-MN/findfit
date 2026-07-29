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
