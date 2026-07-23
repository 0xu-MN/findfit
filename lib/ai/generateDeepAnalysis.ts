import { buildDeepAnalysisPrompt, type ProjectForReport, type ReviewWithSegment } from './prompt'
import { callClaude } from './claude'

// ── 고급 분석(Deep Analysis, 유료 콘텐츠) 생성 ──
//
// generateReport.ts(Gemini, 기본 리포트)와 별도로, 여기서만 Claude를 호출한다.
// 기본 ai_reports row가 이미 존재해야 하며(report_data가 먼저 만들어져 있어야
// 함), 그 row에 deep_analysis_data / deep_analysis_generated_at만 채워 넣는다.

type QuestionRow = { id: string; question_text: string; question_type: string }
type AnswerRow = { reviewer_id: string | null; question_id: string | null; answer_text: string }
type ReviewerProfileRow = { user_id: string; domain_tags: string[] }

// 리커트 답변에 붙은 "(이유: ...)" 자유 서술을 뽑아낸다 (형식은
// components/evaluator/ProjectCardExpandable.tsx의 제출 로직과 동일하게 유지)
const REASON_PATTERN = /\(이유:\s*([^)]+)\)/g

function extractReasons(answers: AnswerRow[]): string[] {
  const reasons: string[] = []
  for (const a of answers) {
    for (const match of a.answer_text.matchAll(REASON_PATTERN)) {
      const reason = match[1]?.trim()
      if (reason) reasons.push(reason)
    }
  }
  return reasons
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateDeepAnalysis(projectId: string, supabase: any) {
  const [{ data: project }, { data: questionsRaw }, { data: answersRaw }, { data: existingReport }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, project_type, psf_pmf_type, problem, solution')
      .eq('id', projectId)
      .single(),
    supabase
      .from('review_questions')
      .select('id, question_text, question_type')
      .eq('project_id', projectId),
    supabase
      .from('review_answers')
      .select('reviewer_id, question_id, answer_text')
      .eq('project_id', projectId),
    supabase
      .from('ai_reports')
      .select('id, report_data')
      .eq('project_id', projectId)
      .maybeSingle(),
  ])

  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.')
  if (!existingReport) throw new Error('기본 리포트가 먼저 생성되어야 합니다.')

  const questions: QuestionRow[] = questionsRaw ?? []
  const answers: AnswerRow[] = answersRaw ?? []
  const qById = new Map(questions.map((q) => [q.id, q]))

  // 리뷰어별 응답 묶기 (question_text 키) — generateReport.ts와 동일한 방식
  const byReviewer = new Map<string, Record<string, string>>()
  const reviewerIds = new Set<string>()
  for (const a of answers) {
    const rid = a.reviewer_id ?? 'anon'
    if (a.reviewer_id) reviewerIds.add(a.reviewer_id)
    const q = a.question_id ? qById.get(a.question_id) : undefined
    const key = q?.question_text ?? a.question_id ?? 'unknown'
    const bucket = byReviewer.get(rid) ?? {}
    bucket[key] = a.answer_text
    byReviewer.set(rid, bucket)
  }

  // 세그먼트 분석용 도메인 태그 — reviewer_profiles.user_id = review_answers.reviewer_id
  const { data: profilesRaw } = reviewerIds.size > 0
    ? await supabase
        .from('reviewer_profiles')
        .select('user_id, domain_tags')
        .in('user_id', Array.from(reviewerIds))
    : { data: [] as ReviewerProfileRow[] }

  const tagsByReviewer = new Map<string, string[]>(
    ((profilesRaw ?? []) as ReviewerProfileRow[]).map((p) => [p.user_id, p.domain_tags ?? []])
  )

  const reviews: ReviewWithSegment[] = Array.from(byReviewer.entries()).map(([id, ans]) => ({
    id,
    answers: ans,
    domain_tags: tagsByReviewer.get(id) ?? [],
  }))

  const reasons = extractReasons(answers)

  const projectForReport: ProjectForReport = {
    id: project.id,
    title: project.title,
    project_type: (project.project_type ?? 'standard') as ProjectForReport['project_type'],
    psf_pmf_type: (project.psf_pmf_type ?? 'psf') as ProjectForReport['psf_pmf_type'],
    problem: project.problem ?? undefined,
    solution: project.solution ?? undefined,
  }

  const prompt = buildDeepAnalysisPrompt(reviews, projectForReport, reasons)
  const deepAnalysisData = await callClaude(prompt)

  const { data: saved, error } = await supabase
    .from('ai_reports')
    .update({
      deep_analysis_data: deepAnalysisData,
      deep_analysis_generated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .select('*')
    .single()

  if (error) throw new Error(error.message ?? '고급 분석 저장에 실패했습니다.')
  return saved
}
