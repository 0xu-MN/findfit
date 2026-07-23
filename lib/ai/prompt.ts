export type Review = {
  id: string
  answers: Record<string, unknown>
}

// Deep Analysis(고급 분석)용 — 세그먼트 분석에 리뷰어의 도메인 태그가 필요해
// 기본 Review에 얹어서 넘긴다.
export type ReviewWithSegment = Review & {
  domain_tags?: string[]
}

export type ProjectForReport = {
  id: string
  title: string
  project_type: 'light' | 'standard' | 'deep'
  psf_pmf_type: 'psf' | 'pmf'
  problem?: string
  solution?: string
  questions?: { question_text: string; meta?: { phase?: string } }[]
}

export type QuestionTemplate = {
  question_text: string
}

export type ReviewQuestion = {
  question_text: string
}

export type ProjectForSuggest = {
  title: string
  one_liner: string
  category: string
  stage: string
  problem: string
  solution: string
  target_jobs?: string[]
  target_age_range?: string
  project_type: string
}

export type QuestionSuggestion = {
  question_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'likert_5'
  options: string[] | null
}

export type InterestSuggestProject = {
  title: string
  one_liner: string
  category: string
  problem: string
  solution: string
}

export function buildInterestSuggestionPrompt(project: InterestSuggestProject, existing: string[]): string {
  return `당신은 타겟 고객 리서치 전문가입니다.

[서비스 정보]
서비스명: ${project.title}
한 줄 소개: ${project.one_liner}
카테고리: ${project.category}
문제: ${project.problem}
솔루션: ${project.solution}

[이미 추가된 관심사 키워드 - 중복 금지]
${existing.join(', ') || '없음'}

[요청]
이 서비스에 관심 가질 만한 타겟 고객의 관심사 키워드를 5~8개 추천하세요.
매칭 알고리즘에 쓰이는 태그라 짧고 구체적인 명사형으로 작성하세요.

아래 JSON 배열로만 반환하세요:
["키워드1", "키워드2", "키워드3"]`
}

export function buildQuestionRecommendationPrompt(
  project: ProjectForSuggest,
  requiredQuestions: QuestionTemplate[],
  alreadyAdded: ReviewQuestion[],
  remainingSlots: number
): string {
  return `당신은 PSF/PMF 검증 설문 설계 전문가입니다.

[서비스 정보]
서비스명: ${project.title}
한 줄 소개: ${project.one_liner}
카테고리: ${project.category}
현재 단계: ${project.stage}
문제: ${project.problem}
솔루션: ${project.solution}

[타겟 응답자]
직업군: ${project.target_jobs?.join(', ') || '미지정'}
연령대: ${project.target_age_range || '미지정'}

[이미 포함된 질문 - 절대 중복 금지]
${[...requiredQuestions, ...alreadyAdded].map(q => `- ${q.question_text}`).join('\n')}

[요청]
위 정보를 바탕으로 ${project.project_type} 타입에 어울리는 검증 질문을
최대 ${remainingSlots}개까지 추천하세요. 객관식/주관식/리커트 5점을 적절히 섞고,
이 서비스의 카테고리와 타겟 응답자 특성을 구체적으로 반영하세요.

아래 JSON 배열로만 반환하세요:
[
  { "question_text": "...", "question_type": "multiple_choice", "options": ["...","...","...","..."] },
  { "question_text": "...", "question_type": "short_answer", "options": null },
  { "question_text": "...", "question_type": "likert_5", "options": ["매우 그렇다","그렇다","보통","아니다","전혀 아니다"] }
]`
}

export function buildPrompt(reviews: Review[], project: ProjectForReport): string {
  if (project.project_type === 'light') return buildLightPrompt(reviews, project)
  if (project.project_type === 'deep') return buildDeepPrompt(reviews, project)
  return buildStandardPrompt(reviews, project)
}

function buildLightPrompt(reviews: Review[], _project: ProjectForReport): string {
  return `당신은 빠른 의사결정을 돕는 분석가입니다.
[${reviews.length}건의 응답]
${JSON.stringify(reviews.map((r) => r.answers))}

아래 JSON 형식으로만 반환하세요:
{
  "winner": "A" 또는 "B" 또는 null,
  "ratio_summary": "A 64% / B 36%",
  "key_comments": ["주관식 응답 중 인상적인 코멘트 2~3개"],
  "one_line_recommendation": "한 줄 추천"
}`
}

function buildStandardPrompt(reviews: Review[], project: ProjectForReport): string {
  return `당신은 PSF/PMF 검증 전문가입니다.
[프로젝트] ${project.title} / ${project.psf_pmf_type.toUpperCase()} 모드
[문제] ${project.problem ?? ''}  [솔루션] ${project.solution ?? ''}
[${reviews.length}건의 응답]
${JSON.stringify(reviews.map((r) => r.answers))}

아래 JSON 형식으로만 반환하세요:
{
  "psf_score": 0~100,
  "sean_ellis_pct": 0~100,
  "recommendation": "continue" 또는 "pivot" 또는 "stop",
  "key_insights": ["인사이트1", "인사이트2", "인사이트3"],
  "pattern_analysis": "공통 패턴 분석 텍스트",
  "benchmark_comment": "동일 카테고리 평균 대비 코멘트",
  "action_plan": ["액션1", "액션2", "액션3"],
  "pivot_scenarios": ["시나리오1", "시나리오2"]
}`
}

// 고급 분석(Deep Analysis, 유료 콘텐츠) — 세그먼트별 반응 차이, 감성 키워드
// 매핑, 의사결정 장벽 클러스터링 3가지를 한 번의 Claude 호출로 요청한다.
// reasons는 리커트 1점(전혀 아니다) 응답에 딸린 "(이유: ...)" 자유 서술을
// generateDeepAnalysis에서 정규식으로 미리 뽑아 넘긴 것 — 장벽 클러스터링의
// 원재료로 쓴다.
export function buildDeepAnalysisPrompt(
  reviews: ReviewWithSegment[],
  project: ProjectForReport,
  reasons: string[]
): string {
  const segmentCounts = new Map<string, number>()
  for (const r of reviews) {
    for (const tag of r.domain_tags ?? []) {
      segmentCounts.set(tag, (segmentCounts.get(tag) ?? 0) + 1)
    }
  }
  const segmentSummary = Array.from(segmentCounts.entries())
    .map(([tag, count]) => `${tag}: ${count}명`)
    .join(', ') || '없음'

  return `당신은 정성 데이터를 분석하는 UX 리서처 겸 그로스 컨설턴트입니다.

[프로젝트] ${project.title}
[문제] ${project.problem ?? ''}
[솔루션] ${project.solution ?? ''}

[전체 응답 ${reviews.length}건]
${JSON.stringify(reviews.map((r) => ({ answers: r.answers, domain_tags: r.domain_tags ?? [] })))}

[응답자 세그먼트(도메인 태그) 분포]
${segmentSummary}

[리커트 최하점(전혀 아니다)에 딸린 자유 서술 이유 ${reasons.length}건 — 의사결정 장벽 클러스터링 원재료]
${JSON.stringify(reasons)}

[요청]
아래 3가지 분석을 수행하세요.

1. segment_analysis: 도메인 태그(세그먼트)별로 응답 경향의 차이를 분석하세요.
   각 세그먼트 인원이 3명 미만이면 통계적으로 의미 있는 비교가 불가능하니
   segment_analysis는 빈 배열로 반환하고, segment_analysis_note에 그 이유를
   설명하세요(예: "세그먼트별 표본이 3명 미만이라 유의미한 비교가 어렵습니다").
   충분하면 segment_analysis_note는 null로 반환하세요.

2. sentiment_mapping: 주관식/서술형 응답 전반에서 반복되는 긍정/부정 키워드를
   추출하고, 각 키워드의 등장 횟수와 대표 인용문을 붙이세요. 응답이 너무 적어
   유의미한 패턴이 없으면 positive/negative를 빈 배열로 두세요.

3. decision_barriers: 리커트 최하점 이유(위 목록)와 부정적 서술형 응답을
   종합해, 반복되는 의사결정 장벽 테마로 클러스터링하세요. 원재료가 부족하면
   빈 배열로 반환하세요.

아래 JSON 형식으로만 반환하세요:
{
  "segment_analysis": [
    { "segment": "...", "summary": "...", "notable_diff": "..." }
  ],
  "segment_analysis_note": "표본 부족 등으로 분석이 불가능할 때만 이유 설명, 아니면 null",
  "sentiment_mapping": {
    "positive": [{ "keyword": "...", "count": 0, "example_quote": "..." }],
    "negative": [{ "keyword": "...", "count": 0, "example_quote": "..." }]
  },
  "decision_barriers": [
    { "theme": "...", "count": 0, "example_quotes": ["..."] }
  ]
}`
}

function buildDeepPrompt(reviews: Review[], project: ProjectForReport): string {
  const taskDesc = project.questions?.find((q) => q.meta?.phase === 'task')?.question_text ?? ''
  const pmfFields =
    project.psf_pmf_type === 'pmf'
      ? `,
  "psf_score": 0~100,
  "sean_ellis_pct": 0~100,
  "recommendation": "continue" 또는 "pivot" 또는 "stop"`
      : ''

  return `당신은 UX 리서처입니다.
[체험 태스크] ${taskDesc}
[${reviews.length}건의 체험 후 평가]
${JSON.stringify(reviews.map((r) => r.answers))}

아래 JSON 형식으로만 반환하세요:
{
  "usability_score": 0~100,
  "intuitiveness_score": 0~100,
  "trust_score": 0~100,
  "friction_points": ["막힌 지점1", "막힌 지점2", "막힌 지점3"],
  "priority_fixes": ["개선1", "개선2", "개선3"]${pmfFields}
}`
}
