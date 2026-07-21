import { buildPrompt, type ProjectForReport, type Review } from './prompt'
import { callGemini } from './gemini'
import {
  PSF_STANDARD_QUESTIONS,
  SEAN_ELLIS_QUESTION,
} from '@/components/builder/new-request/types'
import type { Recommendation, Verdict } from '@/types/database'

// ── 실데이터 기반 AI 리포트 생성 + ai_reports 저장 ──
//
// review_answers / review_questions를 조회해 PSF 서브스코어를 계산하고,
// Gemini로 정성 인사이트를 생성한 뒤, verdict(GO/CAUTION/RECONSIDER)를 매겨
// ai_reports에 project_id 기준으로 upsert한다.
// (리뷰 완료율 도달 시 자동 트리거, Builder 리포트 페이지의 재생성 버튼에서 공용 호출)

// question_text로 매칭하기 위한 고정 문항 텍스트
const PSF1_TEXT = PSF_STANDARD_QUESTIONS[0].text // 이 문제를 직접 겪어보신 적이 있나요?
const PSF3_TEXT = PSF_STANDARD_QUESTIONS[2].text // 이런 솔루션이 있다면 사용해보시겠어요?
const SEAN_ELLIS_TEXT = SEAN_ELLIS_QUESTION.text

type QuestionRow = { id: string; question_text: string; question_type: string; question_key: string | null; order_index: number }
type AnswerRow = { reviewer_id: string | null; question_id: string | null; answer_text: string }

function recommendationToVerdict(rec: Recommendation | null): Verdict | null {
  if (rec === 'continue') return 'GO'
  if (rec === 'pivot') return 'CAUTION'
  if (rec === 'stop') return 'RECONSIDER'
  return null
}

// 특정 질문에 대한 답변 중 positiveOptions에 해당하는 비율(%) 계산
function pctPositive(
  questionId: string | undefined,
  answers: AnswerRow[],
  positiveOptions: string[]
): number | null {
  if (!questionId) return null
  const relevant = answers.filter((a) => a.question_id === questionId)
  if (relevant.length === 0) return null
  const positive = relevant.filter((a) => positiveOptions.includes(a.answer_text)).length
  return Math.round((positive / relevant.length) * 100)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateAndSaveReport(projectId: string, supabase: any) {
  // 1) 프로젝트 + 질문 + 답변 조회
  const [{ data: project }, { data: questionsRaw }, { data: answersRaw }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, project_type, psf_pmf_type, problem, solution, target_count, completed_count')
      .eq('id', projectId)
      .single(),
    supabase
      .from('review_questions')
      .select('id, question_text, question_type, question_key, order_index')
      .eq('project_id', projectId)
      .order('order_index'),
    supabase
      .from('review_answers')
      .select('reviewer_id, question_id, answer_text')
      .eq('project_id', projectId),
  ])

  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.')
  if (project.completed_count < project.target_count) {
    throw new Error('아직 목표 리뷰 수에 도달하지 않았습니다.')
  }

  const questions: QuestionRow[] = questionsRaw ?? []
  const answers: AnswerRow[] = answersRaw ?? []

  const qById = new Map(questions.map((q) => [q.id, q]))

  // 2) 리뷰어별 응답 묶기 (answers 키 = 질문 텍스트)
  const byReviewer = new Map<string, Record<string, string>>()
  for (const a of answers) {
    const rid = a.reviewer_id ?? 'anon'
    const q = a.question_id ? qById.get(a.question_id) : undefined
    const key = q?.question_text ?? a.question_id ?? 'unknown'
    const bucket = byReviewer.get(rid) ?? {}
    bucket[key] = a.answer_text
    byReviewer.set(rid, bucket)
  }
  const reviews: Review[] = Array.from(byReviewer.entries()).map(([id, ans]) => ({
    id,
    answers: ans,
  }))

  // 3) PSF 서브스코어 계산 (고정 문항 응답 집계)
  // M-1: question_key(안정적인 id)로 먼저 매칭 — 문항 문구가 나중에 수정돼도
  // 매칭이 깨지지 않는다. question_key가 없는 옛 프로젝트(migration 012 이전
  // 제출분)를 위해 텍스트 매칭을 fallback으로 유지.
  const psf1 = questions.find((q) => q.question_key === 'psf-1') ?? questions.find((q) => q.question_text === PSF1_TEXT)
  const psf3 = questions.find((q) => q.question_key === 'psf-3') ?? questions.find((q) => q.question_text === PSF3_TEXT)
  const seanEllis =
    questions.find((q) => q.question_key === 'sean-ellis') ??
    questions.find((q) => q.question_type === 'sean_ellis' || q.question_text === SEAN_ELLIS_TEXT)

  const problem_exists_pct = pctPositive(psf1?.id, answers, ['자주 겪는다', '가끔 겪는다'])
  const solution_acceptance_pct = pctPositive(psf3?.id, answers, ['반드시 사용한다', '사용해볼 것 같다'])
  // 구매의향은 강한 수용(반드시 사용한다)을 프록시로 사용
  const purchase_intent_pct = pctPositive(psf3?.id, answers, ['반드시 사용한다'])
  const sean_ellis_pct = pctPositive(seanEllis?.id, answers, ['매우 실망할 것이다'])

  // 4) Gemini로 정성 리포트 생성
  const projectForReport: ProjectForReport = {
    id: project.id,
    title: project.title,
    project_type: (project.project_type ?? 'standard') as ProjectForReport['project_type'],
    psf_pmf_type: (project.psf_pmf_type ?? 'psf') as ProjectForReport['psf_pmf_type'],
    problem: project.problem ?? undefined,
    solution: project.solution ?? undefined,
    questions: questions.map((q) => ({ question_text: q.question_text })),
  }

  const prompt = buildPrompt(reviews, projectForReport)
  const aiResult = await callGemini(prompt)

  // 5) recommendation / verdict / psf_score 결정
  const recommendation = (aiResult.recommendation as Recommendation | undefined) ?? null
  const verdict = recommendationToVerdict(recommendation)
  const psf_score =
    typeof aiResult.psf_score === 'number'
      ? aiResult.psf_score
      : // light 등 psf_score 없을 때 서브스코어 평균으로 보완
        avg([problem_exists_pct, solution_acceptance_pct, purchase_intent_pct])
  const aiSeanEllis = typeof aiResult.sean_ellis_pct === 'number' ? aiResult.sean_ellis_pct : null

  // 6) ai_reports upsert
  const row = {
    project_id: projectId,
    report_type: project.project_type ?? 'standard',
    ai_engine_used: 'gemini' as const,
    psf_score,
    sean_ellis_pct: sean_ellis_pct ?? aiSeanEllis,
    recommendation,
    report_data: aiResult,
    is_unlocked: true, // 이번 라운드는 전체 공개 (유료 잠금은 다음 라운드)
    problem_exists_pct,
    solution_acceptance_pct,
    purchase_intent_pct,
    verdict,
  }

  const { data: saved, error } = await supabase
    .from('ai_reports')
    .upsert(row, { onConflict: 'project_id' })
    .select('*')
    .single()

  if (error) throw new Error(error.message ?? '리포트 저장에 실패했습니다.')
  return saved
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => typeof n === 'number')
  if (valid.length === 0) return null
  return Math.round(valid.reduce((s, n) => s + n, 0) / valid.length)
}
