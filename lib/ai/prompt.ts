export type Review = {
  id: string
  answers: Record<string, unknown>
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
