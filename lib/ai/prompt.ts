export type Review = {
  id: string
  answers: Record<string, unknown>
}

export type ProjectStage = 'idea' | 'prototype' | 'beta' | 'launched'

export type ProjectForReport = {
  id: string
  title: string
  project_type: 'light' | 'standard' | 'deep'
  psf_pmf_type: 'psf' | 'pmf'
  stage?: ProjectStage
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

const STAGE_TONE: Record<ProjectStage, string> = {
  idea: '아직 만들지 않은 아이디어 단계 — 액션 플랜은 "랜딩페이지로 먼저 검증", "핵심 문제 재정의" 같은 저비용 검증 톤으로 제안',
  prototype: '목업/와이어프레임만 있는 단계 — 액션 플랜은 "타겟 세그먼트 확정", "핵심 기능 우선순위 결정" 같은 방향 설정 톤으로 제안',
  beta: '초기 사용자가 써보고 있는 단계 — 액션 플랜은 "베타 테스터 확보", "온보딩 개선" 같은 실행/개선 톤으로 제안',
  launched: '정식 운영 중인 단계 — 액션 플랜은 "리텐션 지표 측정", "성장 채널 검증" 같은 스케일업 톤으로 제안',
}

// stage가 'beta' 또는 'launched'일 때만 유의미한 필드 (아직 안 만들었거나
// 프로토타입만 있는 단계에서는 실사용 비용 구조를 물을 수 없다)
function unitEconomicsEligible(stage: ProjectStage): boolean {
  return stage === 'beta' || stage === 'launched'
}

function buildStandardPrompt(reviews: Review[], project: ProjectForReport): string {
  const stage = project.stage ?? 'beta'
  const stageTone = STAGE_TONE[stage]
  const ueEligible = unitEconomicsEligible(stage)
  const gtmScaleupEligible = stage === 'beta' || stage === 'launched'

  return `당신은 PSF/PMF 검증 전문가 겸 그로스 컨설턴트입니다.

[프로젝트] ${project.title} / ${project.psf_pmf_type.toUpperCase()} 모드
[현재 단계] ${stage} — ${stageTone}
[문제] ${project.problem ?? ''}  [솔루션] ${project.solution ?? ''}
[${reviews.length}건의 응답]
${JSON.stringify(reviews.map((r) => r.answers))}

[중요 — 아래 필드들에 대한 지침]
1. recommendation을 먼저 스스로 판단하세요 ("continue"=계속 진행, "pivot"=방향 전환 검토,
   "stop"=재검토 필요). action_plan은 위 [현재 단계] 톤에 맞게 실제 프로젝트 내용을
   반영해 3개 작성하세요(고정 문구를 그대로 쓰지 말고 이 서비스에 맞게 구체화).
2. pivot_scenarios는 recommendation과 무관하게 2개 작성하세요. recommendation이
   "continue"면 "추가로 시도해볼 만한 성장 시나리오" 톤으로, "pivot"/"stop"이면
   "방향 전환 시나리오" 톤으로 작성하세요(제목은 화면에서 recommendation을 보고
   따로 정하니, 여기서는 내용만 그 톤에 맞게 작성).
3. market_size, positioning_map, competitor_references는 실제 시장조사 데이터가
   아니라 당신의 일반 지식을 바탕으로 한 추정치입니다. 반드시 market_size.note와
   positioning_map.note에 "AI 추정치이며 실제 시장조사를 대체하지 않는다"는 취지를
   담으세요. 항상 생성하세요(단계 무관).
4. positioning_map.competitors에 실제 서비스명을 넣어도 되지만, "~는 별로다" 같은
   단정적 문구는 피하고 "일반적으로 알려진 포지션 기준으로 보면" 정도의 완곡한
   톤으로 note를 작성하세요.
5. unit_economics는 ${ueEligible ? '이 프로젝트가 베타/출시 단계이므로 반드시 생성' : '이 프로젝트가 아직 베타 이전 단계라 실사용 비용 구조를 추정할 근거가 없으니 null로 반환'}하세요.
   생성한다면 basis_note에 이것도 AI 추정치임을 명시하세요.
6. gtm_strategies(4개)와 scaleup_roadmap(4단계)는 ${gtmScaleupEligible ? '이 프로젝트가 베타/출시 단계이니, 위에서 스스로 판단한 recommendation이 "continue"일 때만 생성하고, 그 외에는 둘 다 null로 반환' : '이 프로젝트가 아직 베타 이전 단계이니 둘 다 null로 반환'}하세요.

아래 JSON 형식으로만 반환하세요:
{
  "psf_score": 0~100,
  "sean_ellis_pct": 0~100,
  "recommendation": "continue" 또는 "pivot" 또는 "stop",
  "key_insights": ["인사이트1", "인사이트2", "인사이트3", "인사이트4", "인사이트5"],
  "pattern_analysis": "공통 패턴 분석 텍스트",
  "benchmark_comment": "동일 카테고리 평균 대비 코멘트",
  "action_plan": ["액션1", "액션2", "액션3"],
  "pivot_scenarios": ["시나리오1", "시나리오2"],
  "competitor_references": [
    { "name": "...", "description": "..." }
  ],
  "market_size": {
    "tam": { "label": "...", "value": "...", "basis": "..." },
    "sam": { "label": "...", "value": "...", "basis": "..." },
    "som": { "label": "...", "value": "...", "basis": "..." },
    "note": "AI 추정치임을 명시하는 문구"
  },
  "positioning_map": {
    "axes": { "x_label": "...", "y_label": "..." },
    "competitors": [{ "name": "...", "x": 0~100, "y": 0~100 }],
    "self": { "x": 0~100, "y": 0~100 },
    "note": "AI 추정치임을 명시하는 문구"
  },
  "unit_economics": ${ueEligible ? '{ "cac": "...", "ltv": "...", "ratio": "...", "basis_note": "..." }' : 'null'},
  "gtm_strategies": ${gtmScaleupEligible ? '[{ "title": "...", "phase": "...", "description": "..." }] 또는 null (recommendation이 continue가 아니면 null)' : 'null'},
  "scaleup_roadmap": ${gtmScaleupEligible ? '[{ "phase": "...", "title": "...", "description": "...", "kpis": ["...", "..."] }] 또는 null (recommendation이 continue가 아니면 null)' : 'null'}
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
