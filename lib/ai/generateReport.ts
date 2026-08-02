import { buildPrompt, type ProjectForReport, type Review } from './prompt'
import { callClaude } from './claude'
import { computeConfidenceTiers } from './confidenceTiers'
import { MIN_BENCHMARK_SAMPLE_SIZE, MIN_BENCHMARK_COMMENT_SAMPLES } from './constants'
import {
  PSF_STANDARD_QUESTIONS,
  SEAN_ELLIS_QUESTION,
  TARGET_FIT_IN_TARGET_MIN_SCORE,
  TARGET_FIT_OUT_OF_TARGET_MAX_SCORE,
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
      .select('id, title, project_type, psf_pmf_type, stage, problem, solution, target_count, completed_count, categories, extra_data')
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

  // 타겟 적합도 자기평가(target-fit) 기준 세분화 — 리뷰어별 자기평가 점수를
  // 먼저 모은 뒤, Sean Ellis 응답을 타겟군 내/외로 나눠 재집계한다(순수 계산).
  const targetFitQ = questions.find((q) => q.question_key === 'target-fit')
  const targetFitScoreByReviewer = new Map<string, number>()
  if (targetFitQ) {
    for (const a of answers) {
      if (a.question_id !== targetFitQ.id || !a.reviewer_id) continue
      const n = Number(a.answer_text)
      if (!Number.isNaN(n)) targetFitScoreByReviewer.set(a.reviewer_id, n)
    }
  }
  function segmentedSeanEllisPct(inTarget: boolean): number | null {
    if (!seanEllis || targetFitScoreByReviewer.size === 0) return null
    const relevant = answers.filter((a) => {
      if (a.question_id !== seanEllis.id || !a.reviewer_id) return false
      const score = targetFitScoreByReviewer.get(a.reviewer_id)
      if (score === undefined) return false
      return inTarget ? score >= TARGET_FIT_IN_TARGET_MIN_SCORE : score <= TARGET_FIT_OUT_OF_TARGET_MAX_SCORE
    })
    if (relevant.length === 0) return null
    const positive = relevant.filter((a) => a.answer_text === '매우 실망할 것이다').length
    return Math.round((positive / relevant.length) * 100)
  }
  const seanEllisSegments = {
    inTargetPct: segmentedSeanEllisPct(true),
    outOfTargetPct: segmentedSeanEllisPct(false),
  }

  // Van Westendorp 가격 4문항 — 중앙값 계산(순수 계산, AI 호출 없음)
  function vwMedian(questionKey: string): number | null {
    const q = questions.find((qq) => qq.question_key === questionKey)
    if (!q) return null
    const nums = answers
      .filter((a) => a.question_id === q.id)
      .map((a) => Number(a.answer_text.replace(/[^0-9.]/g, '')))
      .filter((n) => !Number.isNaN(n) && n > 0)
      .sort((a, b) => a - b)
    if (nums.length === 0) return null
    const mid = Math.floor(nums.length / 2)
    return Math.round(nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid])
  }
  const vwTooCheap = vwMedian('vw-too-cheap')
  const vwCheap = vwMedian('vw-cheap')
  const vwExpensive = vwMedian('vw-expensive')
  const vwTooExpensive = vwMedian('vw-too-expensive')
  const van_westendorp =
    vwCheap !== null || vwExpensive !== null
      ? {
          too_cheap_median: vwTooCheap,
          cheap_median: vwCheap,
          expensive_median: vwExpensive,
          too_expensive_median: vwTooExpensive,
          acceptable_price_range: vwCheap !== null && vwExpensive !== null ? [vwCheap, vwExpensive] : null,
        }
      : null

  // 유닛 이코노믹스(LTV/CAC) — AI가 실제 재무 근거 없이 자유 생성하던 필드를
  // 순수 계산으로 대체한다(하드 가드: 크리에이터가 재무 정보를 입력하지 않았으면
  // 무조건 null, AI가 지어내지 않는다).
  const financials = (project.extra_data as { financials?: { expectedPrice: number; expectedCost: number; marketingBudget: number } | null } | null)
    ?.financials
  const unit_economics = (() => {
    if (!financials) return null
    const { expectedPrice, expectedCost, marketingBudget } = financials
    // LTV = 단위 마진 × 예상 구매 횟수. 예상 구매 횟수는 구매의향 응답만으로는
    // 반복구매를 알 수 없어, sean_ellis_pct(핵심 만족도)가 높을수록 반복구매
    // 가능성이 높다고 보정하는 단순 추정치다(기본 1회 + 최대 3회 가산).
    const unitMargin = expectedPrice - expectedCost
    const estimatedPurchaseCount = 1 + ((sean_ellis_pct ?? 0) / 100) * 3
    const ltv = Math.round(unitMargin * estimatedPurchaseCount)
    // CAC = 마케팅 예산 ÷ 예상 확보 인원. 예상 확보 인원은 리뷰 참여자 수에
    // 구매의향 비율을 곱해 보정한다(리뷰 데이터 기반 관심도 프록시).
    const estimatedAcquiredUsers = Math.max(1, Math.round(reviews.length * ((purchase_intent_pct ?? 0) / 100)))
    const cac = marketingBudget > 0 ? Math.round(marketingBudget / estimatedAcquiredUsers) : null
    return {
      cac: cac !== null ? `약 ${cac.toLocaleString()}원` : '마케팅 예산 미입력',
      ltv: `약 ${ltv.toLocaleString()}원`,
      ratio: cac !== null && cac > 0 ? `${(ltv / cac).toFixed(1)}x` : '계산 불가(마케팅 예산 필요)',
      basis_note:
        `크리에이터가 입력한 재무 정보(판매가 ${expectedPrice.toLocaleString()}원 / 원가 ${expectedCost.toLocaleString()}원` +
        (marketingBudget > 0 ? ` / 마케팅 예산 ${marketingBudget.toLocaleString()}원` : '') +
        `)와 실제 리뷰 응답(구매의향 ${purchase_intent_pct ?? '-'}%, 핵심 만족도 ${sean_ellis_pct ?? '-'}%)을 근거로 한 순수 계산치입니다(AI 추정 아님).`,
    }
  })()

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
    seanEllisSegments,
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
  // 웹검색은 비용/지연이 늘어나므로 유료·심층 섹션이 있는 Standard/Deep
  // 리포트에서만 켠다 — Light(무료 전용 리포트)는 켜지 않는다.
  const useWebSearch = projectForReport.project_type !== 'light'
  const aiResult = (await callClaude(prompt, 'sonnet', { maxTokens: 12000, useWebSearch })) as Record<string, unknown>

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

  // benchmark_comment는 지금까지 AI가 실제 비교 수치 없이 "동일 카테고리 평균
  // 대비"라고 자유 생성하는 지어낸 텍스트였다 — report_benchmark_logs에 이미
  // category+stage로 쌓인 실제 psf_score/sean_ellis_pct 평균과 표본 수를 직접
  // 계산해서, AI가 만든 문구를 덮어쓴다(순수 계산, AI 호출 없음).
  const { data: benchmarkRows } = await supabase
    .from('report_benchmark_logs')
    .select('psf_score, sean_ellis_pct')
    .eq('category', category)
    .eq('stage', projectForReport.stage)
  const benchmarkSampleSize = benchmarkRows?.length ?? 0
  let realBenchmarkComment: string
  if (benchmarkSampleSize < MIN_BENCHMARK_COMMENT_SAMPLES) {
    realBenchmarkComment = '아직 같은 카테고리·단계의 비교 데이터가 부족해요 (비교 데이터 부족)'
  } else {
    const avgPsf = avg((benchmarkRows ?? []).map((r: { psf_score: number | null }) => r.psf_score))
    realBenchmarkComment =
      avgPsf === null
        ? '아직 같은 카테고리·단계의 비교 데이터가 부족해요 (비교 데이터 부족)'
        : `동일 카테고리·단계 ${benchmarkSampleSize}건 평균 PSF 점수는 ${avgPsf}점이에요`
  }

  // 5) recommendation / verdict / psf_score 결정
  const recommendation = (aiResult.recommendation as Recommendation | undefined) ?? null
  const verdict = recommendationToVerdict(recommendation)
  const psf_score =
    typeof aiResult.psf_score === 'number'
      ? aiResult.psf_score
      : // light 등 psf_score 없을 때 서브스코어 평균으로 보완
        avg([problem_exists_pct, solution_acceptance_pct, purchase_intent_pct])
  const aiSeanEllis = typeof aiResult.sean_ellis_pct === 'number' ? aiResult.sean_ellis_pct : null

  // Standard/Deep만 benchmark_comment를 스키마에 갖는다(Light엔 없음) — AI가
  // 지어낸 문구를 실제 계산값으로 덮어쓴다.
  if (typeof aiResult.benchmark_comment === 'string') {
    aiResult.benchmark_comment = realBenchmarkComment
  }

  // unit_economics도 마찬가지로 AI가 생성했더라도 항상 순수 계산값(또는
  // 재무 정보 미입력 시 null)으로 덮어쓴다 — 스키마 자체엔 필드가 있을 수
  // 있는(ueEligible) 단계에서만 의미가 있으므로 그때만 덮어쓴다.
  if ('unit_economics' in aiResult) {
    aiResult.unit_economics = unit_economics
  }

  // _sources는 report_data.sources로 옮겨 담을 내부 전달용 필드라 여기서 뺀다.
  const sources = (aiResult._sources as { url: string; title: string | null }[] | undefined) ?? []
  delete aiResult._sources

  // reviewer_narratives에 실제 인구통계(성별/나이/직군)를 코드로 붙인다 —
  // AI는 reviewer_tag만 알고 성별/나이/직군은 모르므로(프롬프트에 안 줌),
  // "리뷰어 A"가 reviews[0]과 같은 순서라는 점(reviewerTag 명명 규칙,
  // lib/ai/prompt.ts와 동일)을 이용해 매칭한다. 리포트 화면(리뷰어 원본
  // 보기 페이지와 동일한 정보)을 더 풍성하게 보여주기 위함 — AI 호출 추가 없음.
  if (Array.isArray(aiResult.reviewer_narratives)) {
    aiResult.reviewer_narratives = (aiResult.reviewer_narratives as { reviewer_tag?: string }[]).map((n) => {
      const idx = tagToIndex(n.reviewer_tag)
      const demo = idx !== null ? reviews[idx]?.demographics : undefined
      return {
        ...n,
        gender: demo?.gender === 'male' ? '남성' : demo?.gender === 'female' ? '여성' : null,
        age: demo?.age ?? null,
        jobDomain: demo?.jobDomain ?? [],
      }
    })
  }

  // 6) ai_reports upsert
  const row = {
    project_id: projectId,
    report_type: project.project_type ?? 'standard',
    ai_engine_used: 'claude' as const,
    psf_score,
    sean_ellis_pct: sean_ellis_pct ?? aiSeanEllis,
    recommendation,
    report_data: {
      ...aiResult,
      // callClaude가 웹검색 인용 출처를 얹어두면(위에서 _sources를 뽑아 삭제)
      // report_data.sources로 옮겨 담는다(리포트 화면 "출처: OO" 각주용).
      sources,
      question_summary,
      confidence_tiers,
      panel_summary,
      response_time_summary,
      sean_ellis_segments: seanEllisSegments,
      van_westendorp,
    },
    is_unlocked: true, // 이번 라운드는 전체 공개 (유료 잠금은 다음 라운드)
    problem_exists_pct,
    solution_acceptance_pct,
    purchase_intent_pct,
    verdict,
  }

  // ai_reports는 project_id UNIQUE라 upsert가 이전 버전을 그대로 덮어쓴다 —
  // 재생성 직전 시점의 기존 row를 ai_reports_history에 백업해둔다(최초 생성 시엔 없음).
  const { data: prevReport } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()
  if (prevReport) {
    await supabase.from('ai_reports_history').insert({
      project_id: prevReport.project_id,
      report_type: prevReport.report_type,
      ai_engine_used: prevReport.ai_engine_used,
      psf_score: prevReport.psf_score,
      sean_ellis_pct: prevReport.sean_ellis_pct,
      recommendation: prevReport.recommendation,
      report_data: prevReport.report_data,
      pdf_url: prevReport.pdf_url,
      is_unlocked: prevReport.is_unlocked,
    })
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

// "리뷰어 A" → 0, "리뷰어 B" → 1 ... lib/ai/prompt.ts의 reviewerTag()와 반드시
// 동일한 규칙(순서대로 A, B, C...)을 따라야 매칭이 맞는다.
function tagToIndex(tag: string | undefined): number | null {
  if (!tag) return null
  const m = tag.match(/^리뷰어 ([A-Z])$/)
  return m ? m[1].charCodeAt(0) - 65 : null
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => typeof n === 'number')
  if (valid.length === 0) return null
  return Math.round(valid.reduce((s, n) => s + n, 0) / valid.length)
}
