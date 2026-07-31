import { createClient } from '@/lib/supabase/client'
import { getPsfPmfType } from '@/lib/utils/psfPmf'
import {
  PSF_STANDARD_QUESTIONS,
  SEAN_ELLIS_QUESTION,
  type AccessMethod,
  type Question,
  type RequestFormData,
} from './types'
import type { AccessInfo, PsfPmfType, ReviewQuestionSource, ReviewQuestionType } from '@/types/database'

// ── RequestFormData → projects / review_questions 실제 Supabase 저장 ──
//
// 마법사 최종 제출 시 호출. localStorage draft를 DB projects row로 승격시키고,
// 고정 문항(PSF 4개 / Sean Ellis) + 커스텀 문항을 review_questions에 함께 insert한다.
// (임시 저장 draft는 기존 localStorage 로직을 그대로 사용 — 여기서는 최종 제출만 담당)

export type SubmitProjectResult = {
  projectId: string
}

// review_questions.question_type이 허용하는 값으로 정규화
function normalizeQuestionType(type: Question['type']): ReviewQuestionType {
  // Question.type과 DB ReviewQuestionType은 거의 동일하나, likert는 likert_5 없이 그대로 저장
  return type as ReviewQuestionType
}

// access_method별 부가 정보 구성
function buildAccessInfo(data: RequestFormData): AccessInfo {
  switch (data.accessMethod) {
    case 'web_link': {
      const raw = data.landingUrl.trim()
      // 프로토콜 없이 "example.com"처럼 입력되면 <a href>가 상대경로로
      // 해석돼 링크가 깨진다 — 저장 시점에 정규화해서 원천 차단한다.
      const url = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw
      return url ? { url } : {}
    }
    case 'app_download':
      return {
        appStoreUrl: data.appStoreUrl || undefined,
        playStoreUrl: data.playStoreUrl || undefined,
      }
    case 'physical_shipping':
      return {}
    default:
      return {}
  }
}

// 프로젝트 타입 + 단계에 따라 review_questions로 저장할 전체 질문 목록을 순서대로 구성
function buildQuestionRows(data: RequestFormData, psfPmfType: PsfPmfType): {
  question_text: string
  question_type: ReviewQuestionType
  question_key: string | null
  options: string[] | null
  is_required: boolean
  allow_multiple: boolean
  source: ReviewQuestionSource
  order_index: number
}[] {
  const fixedLead: Question[] = []
  const fixedTail: Question[] = []

  if (data.projectType === 'standard') {
    if (psfPmfType === 'psf') {
      // PSF 단계: 필수 4개 문항이 앞에 자동 포함
      fixedLead.push(...PSF_STANDARD_QUESTIONS)
    } else {
      // PMF 단계: Sean Ellis 문항이 마지막에 자동 포함
      fixedTail.push(SEAN_ELLIS_QUESTION)
    }
  }

  // 커스텀 문항 (data.questions에는 고정 문항이 들어있지 않음 — UI에서 별도 표시)
  const custom = data.questions.filter((q) => !q.isFixed)

  const ordered = [...fixedLead, ...custom, ...fixedTail]

  return ordered.map((q, idx) => ({
    question_text: q.text,
    question_type: normalizeQuestionType(q.type),
    // 고정 문항만 안정적인 key를 가진다 (psf-1/psf-3/sean-ellis 등) — 커스텀
    // 질문의 id는 문항 식별용이 아니라 의미 없는 key라 null로 둔다 (M-1).
    question_key: q.isFixed ? q.id : null,
    options: q.options ?? null,
    is_required: Boolean(q.isFixed),
    allow_multiple: Boolean(q.allowMultiple),
    source: 'manual',
    order_index: idx,
  }))
}

export async function submitProject(data: RequestFormData): Promise<SubmitProjectResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다. 다시 로그인해주세요.')
  }

  const psfPmfType: PsfPmfType = data.stage ? getPsfPmfType(data.stage) : 'psf'

  // 마감일 계산 (now + deadlineDays)
  const deadline = new Date(Date.now() + data.deadlineDays * 24 * 60 * 60 * 1000).toISOString()

  // 1) projects insert — 관리자 검수 큐로 먼저 들어간다(pending_review).
  // app/api/admin/requests/[id]/approve가 검수 승인 시 'active'로 전환해야
  // 그때부터 projects_public(리뷰어 피드)에 노출된다 — 여기서 바로
  // 'active'로 넣으면 검수 단계 자체를 완전히 건너뛰게 된다.
  const { data: inserted, error: projectError } = await supabase
    .from('projects')
    .insert({
      creator_id: user.id,
      title: data.productName,
      one_liner: data.oneLineDesc,
      categories: data.categories,
      stage: data.stage,
      project_type: data.projectType ?? 'standard',
      psf_pmf_type: psfPmfType,
      status: 'pending_review',
      problem: data.problem,
      solution: data.ourDifference,
      alternative_limit: data.alternativeAndLimit,
      target_age_range: data.ageGroups.length ? data.ageGroups.join(', ') : null,
      target_jobs: data.jobRoles,
      landing_url: data.landingUrl || null,
      target_count: data.evaluatorCount,
      completed_count: 0,
      deadline,
      incentive_exists: data.feePerEvaluator > 0,
      // incentive_budget은 "전체 사례금 풀"(1인당 사례금 x 모집인원)이다 —
      // 리뷰어 화면 쪽 코드 전부가 이 값을 target_count로 나눠 1인당 몫을
      // 계산하므로, 여기서 1인당 금액을 그대로 넣으면 두 번 나눠져 절반
      // 이하로 표시되는 버그가 있었다.
      incentive_budget: data.feePerEvaluator > 0 ? data.feePerEvaluator * data.evaluatorCount : null,
      distribution_method: data.distributionMethod,
      access_method: data.accessMethod as AccessMethod,
      access_info: buildAccessInfo(data),
      // H-2: 마법사에서 입력받지만 전용 컬럼이 없어 그냥 버려지던 필드들 —
      // 전용 컬럼으로 승격되기 전까지 유실만 막아둔다 (migration 011).
      extra_data: {
        occupations: data.occupations,
        interests: data.interests,
        targetContext: data.targetContext,
        decisionFactors: data.decisionFactors,
        validationGoal: data.validationGoal,
        hypothesis: data.hypothesis,
        targetReviewerRoles: data.targetReviewerRoles,
        // 2026-08-01: lightQuestionStyle과 첨부 메타데이터(파일명/영상 URL/
        // 공개여부)는 지금까지 폼에서 입력받고도 제출 시 그냥 버려지고
        // 있었다 — 유실만 막아둔다. 참고: 이미지/문서는 지금도 실제 파일
        // 업로드(Storage) 자체가 구현돼 있지 않아서 파일명 문자열만 남고
        // 실물 파일은 어차피 없다 — 별도 작업으로 다뤄야 함.
        lightQuestionStyle: data.lightQuestionStyle,
        attachments: {
          imageNames: data.imageNames,
          documentNames: data.documentNames,
          videoUrl: data.videoUrl,
          visibility: data.visibility,
        },
      },
    })
    .select('id')
    .single()

  if (projectError || !inserted) {
    throw new Error(projectError?.message ?? '프로젝트 등록에 실패했습니다.')
  }

  const projectId = inserted.id as string

  // 1.5) 등록 이용료 결제 — ENABLE_PAYMENT_GATE=false(기본값)면 서버가
  // PortOne 없이 즉시 waived_test로 성공 응답을 준다. 게이트를 켰을 때
  // 결제가 실제로 실패(카드 거절 등)하면 방금 만든 projects row를 그대로
  // 두지 않고 롤백한다 — "결제는 실패했는데 프로젝트는 남아있는" 반쪽
  // 상태를 막기 위함. review_questions insert보다 반드시 앞에 있어야 한다.
  const skuType = data.projectType === 'light' ? 'registration_light' : 'registration_standard'
  const amount = data.projectType === 'light' ? 4900 : 1800 * data.evaluatorCount
  const paymentRes = await fetch('/api/payments/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skuType, amount, projectId }),
  })

  if (!paymentRes.ok) {
    await supabase.from('projects').delete().eq('id', projectId)
    const body = await paymentRes.json().catch(() => ({}))
    throw new Error(body.error ?? '결제에 실패해 등록이 취소되었습니다.')
  }

  // 2) review_questions insert (고정 + 커스텀)
  const questionRows = buildQuestionRows(data, psfPmfType).map((row) => ({
    ...row,
    project_id: projectId,
  }))

  if (questionRows.length > 0) {
    const { error: questionError } = await supabase.from('review_questions').insert(questionRows)
    if (questionError) {
      throw new Error(questionError.message ?? '질문 등록에 실패했습니다.')
    }
  }

  // 3) Agent 대화 전문을 프로젝트에 연결 — 나중에 리포트 모드에서 같은
  // 대화를 이어갈 수 있게 한다. 실패해도 등록 자체는 막지 않는다(부가 기능).
  if (data.agentSessionId) {
    try {
      const rawMessages = sessionStorage.getItem(`agent_messages_${data.agentSessionId}`)
      if (rawMessages) {
        await supabase.from('agent_conversation_logs').insert({
          project_id: projectId,
          creator_id: user.id,
          messages: JSON.parse(rawMessages),
        })
      }
    } catch (err) {
      console.error('Failed to save agent conversation log', err)
    }
  }

  return { projectId }
}
