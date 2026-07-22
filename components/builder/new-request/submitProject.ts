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
    case 'web_link':
      return data.landingUrl ? { url: data.landingUrl } : {}
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

  // 1) projects insert — 피드 노출을 위해 status='active'
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
      status: 'active',
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
      incentive_budget: data.feePerEvaluator || null,
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
      },
    })
    .select('id')
    .single()

  if (projectError || !inserted) {
    throw new Error(projectError?.message ?? '프로젝트 등록에 실패했습니다.')
  }

  const projectId = inserted.id as string

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

  return { projectId }
}
