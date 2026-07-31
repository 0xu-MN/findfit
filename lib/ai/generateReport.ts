import { buildPrompt, type ProjectForReport, type Review } from './prompt'
import { callClaude } from './claude'
import { computeConfidenceTiers } from './confidenceTiers'
import { MIN_BENCHMARK_SAMPLE_SIZE } from './constants'
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
  const [{ data: project }, { data: questionsRaw }, { data: answersRaw }, { data: matchesRaw }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, project_type, psf_pmf_type, stage, problem, solution, target_count, completed_count, categories')
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
    supabase
      .from('project_matches')
      .select('reviewer_id, review_started_at, submitted_at')
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
  // 응답자 인구통계(성별/나이/직군) — 리포트가 "누가 답했는지"를 전혀
  // 몰라서 성별/연령/직군별 패턴을 분석할 수 없었다. reviewer_id가
  // 'anon'(질문 매칭 실패 등 예외 케이스)이면 조회 대상에서 제외.
  const reviewerIds = Array.from(byReviewer.keys()).filter((id) => id !== 'anon')
  const [{ data: reviewerUsers }, { data: reviewerProfiles }] = reviewerIds.length
    ? await Promise.all([
        supabase.from('users').select('id, gender, birth_date').in('id', reviewerIds),
        supabase.from('reviewer_profiles').select('user_id, domain_tags').in('user_id', reviewerIds),
      ])
    : [{ data: [] }, { data: [] }]

  const genderById = new Map<string, string | null>(
    (reviewerUsers ?? []).map((u: { id: string; gender: string | null }) => [u.id, u.gender])
  )
  const ageById = new Map<string, number | null>(
    (reviewerUsers ?? []).map((u: { id: string; birth_date: string | null }) => [
      u.id,
      u.birth_date ? Math.floor((Date.now() - new Date(u.birth_date).getTime()) / (365.25 * 86400000)) : null,
    ])
  )
  const domainById = new Map<string, string[]>(
    (reviewerProfiles ?? []).map((p: { user_id: string; domain_tags: string[] }) => [p.user_id, p.domain_tags])
  )

  const reviews: Review[] = Array.from(byReviewer.entries()).map(([id, ans]) => ({
    id,
    answers: ans,
    demographics: {
      gender: genderById.get(id) ?? null,
      age: ageById.get(id) ?? null,
      jobDomain: domainById.get(id) ?? [],
    },
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
    stage: (project.stage ?? 'beta') as ProjectForReport['stage'],
    problem: project.problem ?? undefined,
    solution: project.solution ?? undefined,
    questions: questions.map((q) => ({ question_text: q.question_text })),
  }

  const prompt = buildPrompt(reviews, projectForReport)
  // report prompts always ask for an object shape (never the question-suggest
  // array shape), so this narrowing is safe. sonnet 등급 — 리포트 품질이
  // 중요한 무거운 작업.
  // 리포트 JSON은 key_insights/action_plan/market_size/positioning_map/
  // unit_economics/gtm_strategies/scaleup_roadmap/competitor_references +
  // reviewer_narratives/theme_frequency/verbatim_quotes 등 필드가 많아
  // 기본 max_tokens(2000)로는 중간에 잘려서 "Unexpected end of JSON input"
  // 파싱 에러가 났다 — 리포트 생성이 실제로 500으로 실패하던 원인.
  // 여유 있게 늘린다(원문 인용 필드 추가로 12000으로 상향).
  const aiResult = (await callClaude(prompt, 'sonnet', { maxTokens: 12000 })) as Record<string, unknown>

  // 무료 티어에 노출되는 문항별 응답 요약 — AI가 아니라 review_answers를
  // 직접 집계한 값(객관식/리커트류만 대상. 서술형은 막대그래프로 요약할 수
  // 없어 제외)
  const question_summary = buildQuestionSummary(questions, answers)

  // 응답 소요시간 — review_started_at(문항 최초 열람)과 submitted_at(제출)
  // 둘 다 있는 매칭만 계산 대상(2026-08-01 이전에 제출된 리뷰는 시작 시각이
  // 없어서 자동 제외됨). AI 호출 없이 코드로 직접 계산.
  const response_time_summary = buildResponseTimeSummary(matchesRaw ?? [])

  // 패널 프로필 집계 — AI 호출 없이 코드로 직접 GROUP BY. domain_tags가
  // 지금 거의 항상 비어 있어서(2026-07-31 확인: reviewer_profiles 5건 중
  // 채워진 건 0건) 실제로는 "미입력"만 나올 수 있다 — 그래도 나중에
  // domain_tags 입력이 늘어나면 바로 값이 채워지도록 로직 자체는 만들어둔다.
  const panel_summary = buildPanelSummary(reviews)

  // 리포트 콘텐츠 신뢰도 3단계(§21.4) — 이 category+stage로 이미 쌓인
  // report_benchmark_logs 표본이 최소치를 넘었으면 경쟁사 레퍼런스/시장규모/
  // 점수 기준선을 2단계(FindFit 자체 벤치마크)로 승격한다. 지금 막 넣는
  // 이번 리포트 자신의 로그는 집계에서 제외(직전까지 쌓인 데이터 기준).
  const category = project.categories?.[0] ?? 'default'
  const { count: benchmarkCount } = await supabase
    .from('report_benchmark_logs')
    .select('id', { count: 'exact', head: true })
    .eq('category', category)
    .eq('stage', projectForReport.stage)
  const confidence_tiers = computeConfidenceTiers((benchmarkCount ?? 0) >= MIN_BENCHMARK_SAMPLE_SIZE)

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
    ai_engine_used: 'claude' as const,
    psf_score,
    sean_ellis_pct: sean_ellis_pct ?? aiSeanEllis,
    recommendation,
    report_data: { ...aiResult, question_summary, confidence_tiers, panel_summary, response_time_summary },
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

  // 2단계 벤치마크를 만들 데이터가 지금부터 쌓여야 몇 달 뒤 카테고리별
  // 소급 적용이 가능하다 — mock/실제 구분 없이 리포트가 생성될 때마다 무조건 적재.
  await supabase.from('report_benchmark_logs').insert({
    project_id: projectId,
    category,
    stage: projectForReport.stage,
    psf_score,
    sean_ellis_pct: sean_ellis_pct ?? aiSeanEllis,
    verdict,
  })

  return saved
}

const BAR_CHART_TYPES = new Set(['multiple_choice', 'likert_5', 'likert', 'sean_ellis'])

// components/evaluator/ProjectCardExpandable.tsx의 LIKERT_LABELS와 반드시
// 동일하게 유지 — 리커트 답변은 화면에서 "1"~"5" 숫자로만 저장되고
// (review_answers.answer_text), 리뷰어가 실제로 본 라벨 텍스트는 저장되지
// 않는다. 리포트에서 숫자만 보여주면 "3이 뭔지, 5가 좋은 건지" 알 수 없어서
// 여기서 라벨로 변환해 집계한다.
const LIKERT_LABELS = ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다']

// 리커트 1점 답변에 "(이유: ...)" 자유서술이 덧붙는 경우가 있어(제출 로직 참고:
// components/evaluator/ProjectCardExpandable.tsx) 집계 전에 떼어낸다. 복수선택
// 답변은 ", "로 join되어 있으므로 각 옵션을 개별 응답으로 분리해 센다.
function buildQuestionSummary(questions: QuestionRow[], answers: AnswerRow[]) {
  return questions
    .filter((q) => BAR_CHART_TYPES.has(q.question_type))
    .map((q) => {
      const isLikert = q.question_type === 'likert_5' || q.question_type === 'likert'
      const relevant = answers.filter((a) => a.question_id === q.id)
      const optionCounts = new Map<string, number>()
      for (const a of relevant) {
        const cleaned = a.answer_text.replace(/\s*\(이유:[^)]*\)\s*$/, '').trim()
        for (const option of cleaned.split(',').map((s) => s.trim()).filter(Boolean)) {
          const label = isLikert && /^[1-5]$/.test(option) ? `${option} · ${LIKERT_LABELS[Number(option) - 1]}` : option
          optionCounts.set(label, (optionCounts.get(label) ?? 0) + 1)
        }
      }
      const total = relevant.length
      const options = Array.from(optionCounts.entries())
        .map(([label, count]) => ({ label, count, total, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.pct - a.pct)
      return { question_text: q.question_text, options }
    })
    .filter((q) => q.options.length > 0)
}

// 패널 프로필 집계 — 직군/성별/연령대별 인원수. Claude 호출 없이 순수 카운트.
function buildPanelSummary(reviews: Review[]) {
  const jobCounts = new Map<string, number>()
  const genderCounts = new Map<string, number>()
  const ageBucketCounts = new Map<string, number>()

  for (const r of reviews) {
    const d = r.demographics
    if (!d) continue
    for (const job of d.jobDomain ?? []) {
      jobCounts.set(job, (jobCounts.get(job) ?? 0) + 1)
    }
    if (d.gender) {
      const label = d.gender === 'male' ? '남성' : d.gender === 'female' ? '여성' : d.gender
      genderCounts.set(label, (genderCounts.get(label) ?? 0) + 1)
    }
    if (typeof d.age === 'number') {
      const bucket = `${Math.floor(d.age / 10) * 10}대`
      ageBucketCounts.set(bucket, (ageBucketCounts.get(bucket) ?? 0) + 1)
    }
  }

  const toList = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  return {
    total_reviewers: reviews.length,
    jobs: toList(jobCounts),
    genders: toList(genderCounts),
    age_buckets: toList(ageBucketCounts),
  }
}

// 응답 소요시간 요약 — review_started_at/submitted_at 둘 다 있는 매칭만 대상.
// 너무 짧은 완료(예: 9문항에 2분 미만)를 운영자가 알아볼 수 있게 개별
// 소요시간 목록도 같이 남긴다(리뷰어 개인 식별은 안 하고 순서 인덱스만).
const SUSPICIOUSLY_FAST_MINUTES = 2

function buildResponseTimeSummary(
  matches: { reviewer_id: string | null; review_started_at: string | null; submitted_at: string | null }[]
) {
  const durations = matches
    .filter((m) => m.review_started_at && m.submitted_at)
    .map((m) => (new Date(m.submitted_at!).getTime() - new Date(m.review_started_at!).getTime()) / 60000)
    .filter((min) => min >= 0)

  if (durations.length === 0) {
    return { sample_size: 0, avg_minutes: null, fastest_minutes: null, slowest_minutes: null, suspiciously_fast_count: 0 }
  }

  return {
    sample_size: durations.length,
    avg_minutes: Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10,
    fastest_minutes: Math.round(Math.min(...durations) * 10) / 10,
    slowest_minutes: Math.round(Math.max(...durations) * 10) / 10,
    suspiciously_fast_count: durations.filter((d) => d < SUSPICIOUSLY_FAST_MINUTES).length,
  }
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => typeof n === 'number')
  if (valid.length === 0) return null
  return Math.round(valid.reduce((s, n) => s + n, 0) / valid.length)
}
