import { getReportModulesForStage } from './reportModules'

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

export type AgentConversationContext = {
  ideaSummary?: string
  category?: string
  stage?: string
  targetCustomer?: string
  // 지금 대화가 몇 단계인지(0~4) — phase별로 다른 걸 캐묻게 하기 위함.
  // 없으면(과거 호출부 호환) phase 0/1 취급.
  phase?: number
  recentMessages?: { role: 'user' | 'assistant'; content: string }[]
  // 이 크리에이터의 지난 프로젝트 종료 시점 경량 요약(최근 2건) — 원본 대화
  // 로그는 저장하지 않고 이 요약만 참고자료로 이관한다(§21.2/§21.4).
  pastSummaries?: string[]
  // Phase 2→3 전환 시에만 실제 네이버 데이터랩 트렌드 한 줄이 채워진다
  // (서버 전용 키가 필요해 AgentPanel이 미리 조회해서 넘겨준다).
  trendLine?: string
  // 지금 사용자가 등록 마법사 화면에 떠 있고, 몇 단계·어떤 내용을 채우고
  // 있는지. 있으면 "이 부분 어떻게 쓰면 좋을까?" 같은 질문을 검증 문항
  // 설계(리뷰어에게 보여줄 질문)와 헷갈리지 않고 그 단계의 실제 필드
  // 내용에 대한 조언으로 처리한다.
  wizardStep?: { stepKey: string; stepLabel: string; fieldsHint?: string } | null
}

// FindFit Agent 자유 텍스트 이해 — 사용자가 토스트 버튼이 아니라 자유
// 텍스트를 입력했을 때 모든 phase에서 쓰인다(2026-07 확장: 이전엔 phase
// 0/1에서만 Claude를 탔고 phase 2+는 무조건 규칙기반 고정 문구였음 — 입력
// 내용과 무관하게 매번 다음 단계로 넘어가 "형식적인 챗봇" 느낌을 줬다).
// 토스트 버튼 클릭 흐름은 여전히 기존 규칙기반(agentMock.ts) 그대로.
export function buildAgentUnderstandingPrompt(userInput: string, context: AgentConversationContext): string {
  const history = (context.recentMessages ?? [])
    .map((m) => `${m.role === 'user' ? '사용자' : 'FindFit Agent'}: ${m.content}`)
    .join('\n')

  const phase = context.phase ?? 0

  const phaseInstruction =
    phase <= 1
      ? context.targetCustomer
        ? `1. 단계를 아직 모르면 — 지금 아이디어 단계인지 / 만들고 있는지 / 이미 출시했는지
2. 타겟 고객(${context.targetCustomer})은 이미 파악돼 있으니 다시 묻지 말고, 검증에 대한
관심을 자연스럽게 끌어보세요.`
        : `1. 단계를 아직 모르면 — 지금 아이디어 단계인지 / 만들고 있는지 / 이미 출시했는지
2. 단계를 이미 안다면 — 타겟 고객이 누구인지`
      : phase === 2
        ? `타겟 고객이 누구인지 파악하세요. 이미 답했다면(또는 "모르겠다"고 하면) 그 내용을
target_customer로 정리하고, 아래 트렌드 정보가 있으면 자연스럽게 한 줄 언급하며
"실제 사용자 반응이 궁금하지 않으세요?" 같은 뉘앙스로 검증에 대한 관심을 끌어보세요.
${context.trendLine ? `[참고 트렌드] ${context.trendLine}` : ''}`
        : `지금까지 파악한 아이디어/단계/타겟을 짧게 요약하며 확인하고, 검증 등록으로
넘어갈 준비가 됐는지 자연스럽게 물어보세요. 사용자가 추가 정보를 주면 반영하되,
같은 말을 반복하지 말고 매번 대화 맥락에 맞게 다르게 응답하세요.
사용자가 "트렌드 더 자세히", "요즘 어때" 같은 트렌드/시장 동향을 물어보면, 아래
참고 트렌드 데이터를 실제로 인용해서 구체적으로 답하세요(있는데도 무시하고
일반론만 말하면 안 됩니다).
${context.trendLine ? `[참고 트렌드] ${context.trendLine}` : '[참고 트렌드] 아직 조회된 데이터 없음'}`

  return `당신은 FindFit의 창업 아이디어 상담 에이전트입니다. FindFit은 창업 아이디어를
실제 사용자에게 검증받게 해주는 서비스입니다.

당신의 유일한 목적은 사용자의 창업 아이디어를 이해하고, 그 아이디어를 FindFit
검증으로 연결하는 것입니다. 일반적인 AI 챗봇처럼 아무 주제에나 답하면 안 됩니다.
사용자가 아이디어와 무관한 질문을 하면, 짧게 답한 뒤 부드럽게 "그런데 지금
생각 중이신 아이디어가 있으신가요?" 식으로 원래 목적으로 되돌리세요.
같은 문장·같은 인사말을 반복하지 말고, 매번 사용자의 실제 발화 내용에 맞춰
다르게 응답하세요 — 정형화된 챗봇처럼 느껴지면 안 됩니다.

[지금까지 파악된 정보]
아이디어 요약: ${context.ideaSummary ?? '아직 없음'}
분야: ${context.category ?? '아직 미파악'}
단계: ${context.stage ?? '아직 미파악'}
타겟 고객: ${context.targetCustomer ?? '아직 미파악'}

[이 크리에이터의 지난 프로젝트 요약(참고용, 언급은 자연스러울 때만)]
${context.pastSummaries?.length ? context.pastSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n') : '없음'}

[최근 대화]
${history || '(첫 대화)'}

[사용자의 새 발화]
${userInput}

[요청]
사용자의 발화를 실제로 이해하고 자연스럽게 응답하면서, 다음을 진행하세요(질문을
나열하지 말고 자연스러운 대화체로 하나만):
${phaseInstruction}

컨설턴트처럼 친근하지만 전문적인 톤을 유지하고, 1~3문장으로 간결하게 답하세요.
아직 정보가 불충분하면(예: "몰라요", 한두 글자 성의없는 답 등) 억지로 다음 단계로
넘어가지 말고 다시 물어보세요 — 필드는 실제로 확인됐을 때만 채우세요.

${context.wizardStep ? `[지금 사용자가 보고 있는 화면 — 등록 마법사 "${context.wizardStep.stepLabel}" 단계]
사용자가 지금 이 등록 마법사 단계 화면을 띄워둔 채 대화하고 있습니다. 현재 입력 상태:
${context.wizardStep.fieldsHint ?? '(아직 입력 없음)'}
사용자가 "이 부분 어떻게 쓰면 좋을까", "여기 뭐라고 채워야 할까"처럼 지금 단계 화면의
내용을 물어보면 — 아래 [검증 문항 설계 상담]과 절대 혼동하지 마세요. 이건 리뷰어에게
보여줄 질문이 아니라, 이 단계 필드(${context.wizardStep.stepLabel})에 실제로 쓸 문장
자체를 물어본 것입니다. 지금까지 파악된 아이디어/타겟을 반영해서 그 필드에 바로 넣을
수 있는 구체적인 문장 예시를 1~2개 제시하세요.
` : ''}
[검증 문항 설계 상담 — 사용자가 "검증 질문"/"리뷰어에게 물어볼 것"을 명시적으로 물어보면]
사용자가 "어떤 질문을 만들어야 할지", "검증 문항을 어떻게 설계해야 할지", "간단하게
필요성만 확인하려면 뭘 물어봐야 할지"처럼 질문 설계 자체를 물어보면, 원칙만 설명하지
말고 지금까지 파악된 아이디어/단계를 반영한 실제 문항 예시를 2~3개 만들어서 제시하세요.
FindFit 등록 티어 기준:
- Light(빠른 방향성 확인용, 최대 5문항, 3~5일 소요): 예/아니오, 객관식, A/B 테스트처럼
  리뷰어가 몇 초 안에 답할 수 있는 가벼운 문항 위주. 이 단계에서 딱 필요성/관심도 정도만
  확인하고 싶다고 하면, "이 문제를 겪어본 적 있나요?(예/아니오)"처럼 아주 단순한 존재
  확인형 질문 1~2개만으로도 충분하다고 안내하세요.
- Standard(심층 설문, 최대 9문항 + Sean Ellis 필수 포함, 10일 소요): 리커트 척도·주관식을
  섞어 이유·맥락까지 파고드는 문항 위주.
사용자의 실제 아이디어 맥락 없이 일반론만 말하지 말고, 지금 대화에서 파악된 내용을
반영한 구체적인 예시 문장으로 답하세요.

아래 JSON 형식으로만 반환하세요:
{
  "reply": "...",
  "category": "health" 또는 "food" 또는 "edu" 또는 "fintech" 또는 "commerce" 또는 "app" 또는 null,
  "stage": "idea" 또는 "building" 또는 "launched" 또는 null,
  "item_summary": "지금까지 파악된 아이디어 한 줄 요약" 또는 null,
  "target_customer": "이번 발화에서 확인된 타겟 고객" 또는 null,
  "ready_for_cta": true 또는 false
}`
}

// 프로젝트 종료(리포트 생성 성공) 시점에 1회 생성하는 경량 요약 — 원본 대화
// 로그는 저장하지 않고, 이 요약 1건만 다음 Agent 대화의 참고자료로 이관한다
// (기획서 §21.2 "경량 이관" 결정 반영).
export function buildProjectSummaryPrompt(project: { title: string; problem?: string; solution?: string }, verdict: string | null): string {
  return `아래 검증이 끝난 프로젝트를 다음에 이 크리에이터가 새 아이디어를
상담할 때 참고할 수 있도록 2~3문장으로 요약하세요. 프로젝트명, 핵심 문제,
검증 결과(판정)를 포함하되 개인정보는 넣지 마세요.

[프로젝트명] ${project.title}
[문제] ${project.problem ?? ''}
[솔루션] ${project.solution ?? ''}
[검증 판정] ${verdict ?? '알 수 없음'}

아래 JSON 형식으로만 반환하세요:
{ "summary": "..." }`
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

[중요] Light 티어는 설계상 소수 응답(보통 2~5명)으로 빠른 방향성만 확인하는
용도입니다. "표본이 적다", "통계적으로 유의하지 않다", "n=30 이상 추가로
확보해야 한다" 같은 통계적 유의성 경고는 절대 넣지 마세요 — 이건 Light 티어의
정상적인 사용 범위이지 결함이 아닙니다. 대신 이 소수의 응답에서 실제로 관찰된
방향성(선호/의견이 갈렸는지 일치했는지)만 담백하게 설명하세요.

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

function buildStandardPrompt(reviews: Review[], project: ProjectForReport): string {
  const stage = project.stage ?? 'beta'
  const stageTone = STAGE_TONE[stage]
  // 기획서 §21.5 매트릭스 — 산발적 boolean 체크 대신 이 함수 하나로 이번
  // 리포트에 어떤 모듈이 포함 가능한지 정한다.
  const modules = getReportModulesForStage(stage, project.psf_pmf_type)
  const ueEligible = modules.includes('unit_economics')
  const gtmScaleupEligible = modules.includes('gtm_strategies')

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
7. FindFit은 리뷰를 1회 제출로 마감하는 원샷 구조라 실제 반복사용(리텐션)을
   추적하지 않습니다. benchmark_comment나 key_insights에서 "재방문율", "사용
   빈도가 높다", "리텐션이 좋다" 같이 실측인 것처럼 들리는 표현을 쓰지 마세요.
   대신 "설문 기반 예상 재방문 의향(실제 반복사용 측정 아님)" 같은 정확한
   표현만 사용하세요.

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
