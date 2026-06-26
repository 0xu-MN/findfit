// Agent Phase 1~4 목업 데이터 (v3.1 기획 기반)
// 실제 API 연동 시 이 파일의 함수들을 API 호출로 교체합니다.

export type AgentMessageRole = 'user' | 'assistant'

export type ToastOption = {
  id: string
  label: string
  emoji?: string
  value: string
}

export type ReferenceData = {
  name: string
  target: string
  price: string
  pros: string
  cons: string
  url?: string
}

export type TrendKeyword = {
  keyword: string
  volume: 'high' | 'medium' | 'low'
  trend: 'rising' | 'stable' | 'declining'
}

export type MarketData = {
  naverTrend?: { keyword: string; changePct: number; period: string }
  googleInterest?: number
  metaAdsCount?: number
  nicheGap?: string
}

export type AgentContext = {
  phase: 1 | 2 | 3 | 4
  category?: string
  stage?: string
  keywords?: string[]
  marketData?: MarketData
  direction?: string
  references?: ReferenceData[]
}

export type AgentMessage = {
  id: string
  role: AgentMessageRole
  content: string
  timestamp: string
  // 특수 블록
  toastOptions?: ToastOption[]
  toastType?: 'single' | 'multi'
  references?: ReferenceData[]
  trends?: TrendKeyword[]
  marketData?: MarketData
  showCTA?: boolean
}

// ─── Phase 1: 분야/단계 선택지 ─────────────────────────────

const CATEGORY_OPTIONS: ToastOption[] = [
  { id: 'app',      label: '앱 / 소프트웨어',   emoji: '📱', value: 'app' },
  { id: 'commerce', label: '커머스 / 이커머스',  emoji: '🛒', value: 'commerce' },
  { id: 'health',   label: '헬스 / 웰니스',     emoji: '🏃', value: 'health' },
  { id: 'edu',      label: '교육 / 에듀테크',   emoji: '📚', value: 'edu' },
  { id: 'food',     label: '푸드 / F&B',       emoji: '🍽️', value: 'food' },
  { id: 'fintech',  label: '핀테크 / 금융',     emoji: '💳', value: 'fintech' },
  { id: 'other',    label: '기타 (직접 입력)',   emoji: '✏️', value: 'other' },
]

const STAGE_OPTIONS: ToastOption[] = [
  { id: 'idea',     label: '아이디어만 있어요',   emoji: '💡', value: 'idea' },
  { id: 'research', label: '시장 조사 중이에요',  emoji: '🔍', value: 'research' },
  { id: 'building', label: '만들고 있어요',       emoji: '🔨', value: 'building' },
  { id: 'launched', label: '이미 출시했어요',     emoji: '🚀', value: 'launched' },
]

// ─── 카테고리별 재확인 질문 선택지 (Phase 3) ─────────────────

const DIRECTION_OPTIONS: Record<string, ToastOption[]> = {
  health: [
    { id: 'senior',  label: '시니어 (60대+)',    emoji: '👴', value: '시니어 맞춤 건강기능식품' },
    { id: 'young',   label: '2030 직장인',       emoji: '💼', value: '2030 직장인 맞춤 영양제' },
    { id: 'family',  label: '가족 단위',          emoji: '👨‍👩‍👧', value: '가족 단위 구독 패키지' },
    { id: 'athlete', label: '운동하는 사람',      emoji: '🏋️', value: '운동 특화 단백질 보충제' },
  ],
  food: [
    { id: 'meal',    label: '건강 밀키트',        emoji: '🥗', value: '건강 밀키트 구독' },
    { id: 'snack',   label: '비건 간식',          emoji: '🌱', value: '비건 간식 정기배송' },
    { id: 'senior',  label: '시니어 맞춤 식단',   emoji: '🍱', value: '시니어 맞춤 간편식' },
    { id: 'pet',     label: '반려동물 간식',      emoji: '🐾', value: '프리미엄 펫 간식' },
  ],
  app: [
    { id: 'time',    label: '시간 절약',          emoji: '⏱️', value: '업무 자동화 SaaS' },
    { id: 'connect', label: '연결/커뮤니티',      emoji: '🤝', value: '커뮤니티 플랫폼' },
    { id: 'manage',  label: '관리/정리',          emoji: '📋', value: '개인 생산성 앱' },
    { id: 'ai',      label: 'AI 활용',            emoji: '🤖', value: 'AI 자동화 도구' },
  ],
  edu: [
    { id: 'coding',  label: 'AI 코딩 교육',      emoji: '💻', value: 'AI 코딩 교육 플랫폼' },
    { id: 'career',  label: '직무 전환',          emoji: '🔄', value: '직무 전환 부트캠프' },
    { id: 'kids',    label: '유아/어린이',        emoji: '👶', value: '유아 영어 AI 튜터' },
    { id: 'senior',  label: '시니어 디지털',      emoji: '👴', value: '시니어 디지털 교육' },
  ],
  default: [
    { id: 'b2c',     label: 'B2C 소비자 서비스',  emoji: '👤', value: 'B2C 소비자 서비스' },
    { id: 'b2b',     label: 'B2B 기업 솔루션',   emoji: '🏢', value: 'B2B 기업 솔루션' },
    { id: 'platform',label: '중개 플랫폼',        emoji: '🔗', value: '중개 플랫폼' },
    { id: 'sub',     label: '구독 서비스',        emoji: '🔄', value: '구독 서비스' },
  ],
}

// ─── 목업 레퍼런스 데이터 ─────────────────────────────

const MOCK_REFERENCES: Record<string, ReferenceData[]> = {
  health: [
    { name: 'FitFolio', target: '20~30대 운동 초보 여성', price: '월 9,900원 구독', pros: '개인 맞춤 운동 루틴 + 식단 AI 추천', cons: '오프라인 연계 부족, 커뮤니티 미약' },
    { name: 'BodyBuddy', target: '30~40대 직장인 남녀', price: '1회 체험 무료 / 월 14,900원', pros: 'PT 매칭 + 실시간 자세 교정', cons: '지역 제한 (서울 강남 위주)' },
    { name: 'NutriTrack', target: '20~40대 건강 관심층', price: '기본 무료 / 프로 월 7,900원', pros: '바코드 스캔 영양 분석, 대형 DB', cons: '한국 식품 DB 부족, UI 올드' },
  ],
  food: [
    { name: '마켓컬리 컬리로그', target: '30~40대 프리미엄 식품 관심층', price: '별도 없음', pros: '프리미엄 식품 리뷰 커뮤니티', cons: '마켓컬리 종속, 독립 서비스 아님' },
    { name: '오늘의식탁', target: '25~45세 자취/신혼 남녀', price: '무료 / 밀키트 구매 연계', pros: '레시피 + 장보기 원스톱', cons: '밀키트 브랜드 편중' },
    { name: 'Yummly', target: '20~40대 글로벌 유저', price: '무료 / Pro 월 $4.99', pros: 'AI 레시피 추천, 스마트 가전 연동', cons: '한국 음식 레시피 부족' },
  ],
  edu: [
    { name: '클래스101', target: '20~40대 자기계발 관심층', price: '구독 월 14,900원', pros: '다양한 분야, 크리에이터 중심', cons: '수료율 낮음, 퀄리티 편차' },
    { name: '인프런', target: '개발자/디자이너/기획자', price: '강의별 1~15만원', pros: 'IT 전문 강의 풍부, 로드맵', cons: '비IT 콘텐츠 부족' },
    { name: 'Udemy', target: '글로벌 직장인/학생', price: '강의별 $10~$200', pros: '방대한 강의 수, 할인 행사', cons: '한국어 강의 부족, 퀄리티 천차만별' },
  ],
  default: [
    { name: 'ValidatorAI', target: '글로벌 창업 준비자', price: '기본 무료 / Pro 월 $29', pros: '20만+ 유저, AI 멘토 대화형', cons: '실제 사람 검증 없음' },
    { name: 'IDEAGACHA', target: '국내 창업 준비자', price: '무료', pros: '아이디어 탐색 + 트렌드', cons: '실제 사람 검증 없음, 2026 초기 서비스' },
    { name: '오픈서베이', target: '기업/마케터', price: '수십~수백만원', pros: '정량적 리서치, 패널 규모', cons: '비용 과다 — 초기 창업자 부적합' },
  ],
}

// ─── 목업 시장 데이터 ─────────────────────────────

const MOCK_MARKET_DATA: Record<string, MarketData> = {
  health:   { naverTrend: { keyword: '건강기능식품 구독', changePct: 28, period: '최근 3개월' }, googleInterest: 74, metaAdsCount: 47, nicheGap: '경쟁 적음 🟢' },
  food:     { naverTrend: { keyword: '비건 간편식', changePct: 41, period: '최근 3개월' }, googleInterest: 62, metaAdsCount: 83, nicheGap: '경쟁 보통 🟡' },
  app:      { naverTrend: { keyword: 'AI SaaS 도구', changePct: 55, period: '최근 3개월' }, googleInterest: 88, metaAdsCount: 127, nicheGap: '경쟁 치열 🔴' },
  edu:      { naverTrend: { keyword: 'AI 코딩 교육', changePct: 62, period: '최근 3개월' }, googleInterest: 91, metaAdsCount: 94, nicheGap: '경쟁 보통 🟡' },
  fintech:  { naverTrend: { keyword: '핀테크 플랫폼', changePct: 18, period: '최근 3개월' }, googleInterest: 55, metaAdsCount: 61, nicheGap: '경쟁 보통 🟡' },
  default:  { naverTrend: { keyword: '스타트업 서비스', changePct: 12, period: '최근 3개월' }, googleInterest: 48, metaAdsCount: 35, nicheGap: '경쟁 적음 🟢' },
}

// ─── 카테고리 매칭 ─────────────────────────────

function matchCategory(input: string): string {
  const lower = input.toLowerCase()
  const map: [string[], string][] = [
    [['운동', '헬스', '건강', '다이어트', '피트니스', '단백질', '영양', '체중', 'health', '웰니스'], 'health'],
    [['음식', '푸드', '식품', '요리', '밀키트', '식단', '카페', '베이커리', '간식', 'food', '비건'], 'food'],
    [['교육', '에듀', '학습', '강의', '코딩', '영어', '수학', '부트캠프', 'edu'], 'edu'],
    [['금융', '핀테크', '투자', '주식', '은행', 'fintech'], 'fintech'],
    [['앱', '게임', '웹', 'saas', '소프트웨어', '플랫폼', '자동화', 'ai'], 'app'],
  ]
  for (const [keywords, category] of map) {
    if (keywords.some(k => lower.includes(k))) return category
  }
  return 'default'
}

// ─── ID 생성 ─────────────────────────────

let msgCounter = 0
function genId(): string {
  return `msg-${Date.now()}-${++msgCounter}`
}

// ─── 초기 인사 메시지 ─────────────────────────────

export function getGreeting(exploreMode = false): AgentMessage {
  if (exploreMode) {
    return {
      id: genId(),
      role: 'assistant',
      content: '아이템 탐색을 도와드릴게요! 🔍\n\n요즘 어떤 분야에 관심이 있으신가요?\n아래에서 선택해주세요 👇',
      timestamp: new Date().toISOString(),
      toastOptions: CATEGORY_OPTIONS,
      toastType: 'single',
    }
  }
  return {
    id: genId(),
    role: 'assistant',
    content: '안녕하세요! FindFit 아이템 탐색 어시스턴트에요 😊\n\n어떤 분야의 아이템을 탐색하고 계신가요?',
    timestamp: new Date().toISOString(),
    toastOptions: CATEGORY_OPTIONS,
    toastType: 'single',
  }
}

// ─── Phase별 응답 생성 ─────────────────────────────

export function generatePhaseResponse(
  userInput: string,
  context: AgentContext,
  isToastSelection: boolean,
): { message: AgentMessage; updatedContext: AgentContext } {

  const phase = context.phase

  // Phase 1-a: 분야 선택 → 단계 선택 요청
  if (phase === 1 && !context.category) {
    const category = isToastSelection ? userInput : matchCategory(userInput)
    const categoryLabel = CATEGORY_OPTIONS.find(o => o.value === category)?.label ?? userInput

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content: `**${categoryLabel}** 분야군요! 👍\n\n지금 어떤 단계에 계신가요?`,
        timestamp: new Date().toISOString(),
        toastOptions: STAGE_OPTIONS,
        toastType: 'single',
      },
      updatedContext: { ...context, category, phase: 1 },
    }
  }

  // Phase 1-b: 단계 선택 → 시장 데이터 수집 (Phase 2)
  if (phase === 1 && context.category && !context.stage) {
    const stage = userInput
    const categoryKey = matchCategory(context.category ?? '')
    const marketData = MOCK_MARKET_DATA[categoryKey] ?? MOCK_MARKET_DATA.default
    const keywords = [marketData.naverTrend?.keyword ?? context.category ?? '']

    const sign = (marketData.naverTrend?.changePct ?? 0) >= 0 ? '+' : ''
    const content =
      `**${context.category}** 분야 시장 데이터를 분석했어요 📊\n\n` +
      `📈 네이버 검색 트렌드: ${sign}${marketData.naverTrend?.changePct}% (${marketData.naverTrend?.period})\n` +
      `🌐 구글 트렌드 관심도: ${marketData.googleInterest}/100\n` +
      `📣 메타 광고 집행 중인 업체: ${marketData.metaAdsCount}개\n\n` +
      `🎯 시장 경쟁 수준: **${marketData.nicheGap}**\n\n` +
      `어떤 방향으로 가고 싶으세요?`

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        marketData,
        toastOptions: DIRECTION_OPTIONS[matchCategory(context.category ?? '')] ?? DIRECTION_OPTIONS.default,
        toastType: 'single',
      },
      updatedContext: { ...context, stage, keywords, marketData, phase: 2 },
    }
  }

  // Phase 2 → Phase 3: 방향 선택 → 타사 레퍼런스 + CTA
  if (phase === 2) {
    const direction = userInput
    const categoryKey = matchCategory(context.category ?? '')
    const references = MOCK_REFERENCES[categoryKey] ?? MOCK_REFERENCES.default

    const content =
      `"**${direction}**" 방향으로 비슷한 서비스를 찾아봤어요 👇\n\n` +
      `경쟁사들의 강점과 약점을 참고해서 차별화 포인트를 잡아보세요.\n\n` +
      `이 방향으로 **실제 사람들의 반응**을 확인해볼까요?\n` +
      `검증 의뢰를 등록하면 72시간 안에 전문가 피드백을 받을 수 있어요 🚀`

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        references,
        showCTA: true,
      },
      updatedContext: { ...context, direction, references, phase: 3 },
    }
  }

  // Phase 3+: 자유 대화
  return {
    message: {
      id: genId(),
      role: 'assistant',
      content: `좋은 방향이에요! 💡\n\n지금까지 정리된 내용:\n• **분야**: ${context.category}\n• **단계**: ${context.stage}\n• **방향**: ${context.direction ?? userInput}\n\n바로 검증 의뢰를 등록해보세요. 72시간 내 실제 사람들의 반응을 확인할 수 있어요.`,
      timestamp: new Date().toISOString(),
      showCTA: true,
    },
    updatedContext: { ...context, phase: 4 },
  }
}

// ─── 빈 컨텍스트 생성 ─────────────────────────────

export function createEmptyContext(): AgentContext {
  return { phase: 1 }
}
