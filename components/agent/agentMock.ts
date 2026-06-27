// Agent Phase 1~4 목업 데이터 (v3.3 기획 기반)
// 실제 API 연동 시 이 파일의 함수들을 API 호출로 교체합니다.

export type AgentMessageRole = 'user' | 'assistant'

export type ToastOption = {
  id: string
  label: string
  emoji?: string
  value: string
}

export type LightReference = {
  name: string
  summary: string
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
  targetCustomer?: string
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
  lightReferences?: LightReference[]   // Phase 4: 이름+한 줄 요약만 (가격/강점/약점 없음)
  references?: ReferenceData[]          // 사이드바 context 전달용 (채팅에서 렌더 안 함)
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

// ─── Phase 2: 방향 선택지 ─────────────────────────────

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
    { id: 'b2c',      label: 'B2C 소비자 서비스',  emoji: '👤', value: 'B2C 소비자 서비스' },
    { id: 'b2b',      label: 'B2B 기업 솔루션',   emoji: '🏢', value: 'B2B 기업 솔루션' },
    { id: 'platform', label: '중개 플랫폼',        emoji: '🔗', value: '중개 플랫폼' },
    { id: 'sub',      label: '구독 서비스',        emoji: '🔄', value: '구독 서비스' },
  ],
}

// ─── Phase 4: 라이트 레퍼런스 (이름 + 한 줄 요약만) ─────────
// 가격 / 강점 / 약점 심층 분석은 절대 포함하지 않음 → 리포트에서만 공개

const LIGHT_REFERENCES: Record<string, LightReference[]> = {
  health: [
    { name: 'FitFolio',   summary: '개인 맞춤 운동·식단 AI 추천 구독 앱' },
    { name: 'BodyBuddy',  summary: 'PT 매칭 + 실시간 자세 교정 서비스' },
    { name: 'NutriTrack', summary: '바코드 스캔 기반 영양 분석 앱' },
  ],
  food: [
    { name: '오늘의식탁',       summary: '레시피 + 장보기 원스톱 밀키트 앱' },
    { name: 'Yummly',           summary: 'AI 레시피 추천 + 스마트 가전 연동 글로벌 앱' },
    { name: '마켓컬리 컬리로그', summary: '프리미엄 식품 리뷰 커뮤니티' },
  ],
  edu: [
    { name: '클래스101', summary: '크리에이터 중심 다양한 분야 구독 강의 플랫폼' },
    { name: '인프런',    summary: 'IT 직군 특화 강의 + 로드맵 플랫폼' },
    { name: 'Udemy',     summary: '글로벌 최대 온라인 강의 마켓플레이스' },
  ],
  app: [
    { name: 'Notion',          summary: '올인원 생산성 + 협업 워크스페이스 SaaS' },
    { name: 'Typeform',        summary: 'UI 특화 폼 빌더 + 데이터 수집 플랫폼' },
    { name: 'Make (Integromat)', summary: '노코드 업무 자동화 연동 플랫폼' },
  ],
  fintech: [
    { name: '토스',       summary: '국내 최대 간편 금융 슈퍼앱' },
    { name: 'Rainist',    summary: '가계부 + 자산 관리 앱 뱅크샐러드' },
    { name: '카카오페이', summary: '간편결제 + 금융상품 중개 플랫폼' },
  ],
  default: [
    { name: 'ValidatorAI', summary: 'AI 멘토 대화형 아이디어 검증 플랫폼 (글로벌)' },
    { name: 'IDEAGACHA',   summary: '아이디어 탐색 + 트렌드 분석 서비스 (국내)' },
    { name: '오픈서베이',  summary: '기업/마케터 대상 정량 리서치 패널 플랫폼' },
  ],
}

// 사이드바 표시용 전체 레퍼런스 (채팅 메시지에는 사용 안 함)
const FULL_REFERENCES: Record<string, ReferenceData[]> = {
  health: [
    { name: 'FitFolio',   target: '20~30대 운동 초보 여성', price: '월 9,900원 구독', pros: '개인 맞춤 운동 루틴 + 식단 AI 추천', cons: '오프라인 연계 부족, 커뮤니티 미약' },
    { name: 'BodyBuddy',  target: '30~40대 직장인 남녀',   price: '1회 체험 무료 / 월 14,900원', pros: 'PT 매칭 + 실시간 자세 교정', cons: '지역 제한 (서울 강남 위주)' },
    { name: 'NutriTrack', target: '20~40대 건강 관심층',   price: '기본 무료 / 프로 월 7,900원', pros: '바코드 스캔 영양 분석, 대형 DB', cons: '한국 식품 DB 부족, UI 올드' },
  ],
  food: [
    { name: '마켓컬리 컬리로그', target: '30~40대 프리미엄 식품 관심층', price: '별도 없음', pros: '프리미엄 식품 리뷰 커뮤니티', cons: '마켓컬리 종속, 독립 서비스 아님' },
    { name: '오늘의식탁',       target: '25~45세 자취/신혼 남녀',       price: '무료 / 밀키트 구매 연계', pros: '레시피 + 장보기 원스톱', cons: '밀키트 브랜드 편중' },
    { name: 'Yummly',           target: '20~40대 글로벌 유저',          price: '무료 / Pro 월 $4.99', pros: 'AI 레시피 추천, 스마트 가전 연동', cons: '한국 음식 레시피 부족' },
  ],
  edu: [
    { name: '클래스101', target: '20~40대 자기계발 관심층', price: '구독 월 14,900원', pros: '다양한 분야, 크리에이터 중심', cons: '수료율 낮음, 퀄리티 편차' },
    { name: '인프런',    target: '개발자/디자이너/기획자',  price: '강의별 1~15만원', pros: 'IT 전문 강의 풍부, 로드맵', cons: '비IT 콘텐츠 부족' },
    { name: 'Udemy',     target: '글로벌 직장인/학생',      price: '강의별 $10~$200', pros: '방대한 강의 수, 할인 행사', cons: '한국어 강의 부족, 퀄리티 천차만별' },
  ],
  app: [
    { name: 'Notion',           target: '스타트업/팀/개인 사용자', price: '무료 / Pro 월 $16', pros: '유연한 블록 에디터, 강력한 DB', cons: '학습곡선 높음, 오프라인 미지원' },
    { name: 'Typeform',         target: '마케터/기획자',           price: '무료 / Plus 월 $25', pros: '높은 완료율, 대화형 UX', cons: '복잡한 로직 구성 어려움' },
    { name: 'Make (Integromat)', target: '개발자/운영자',          price: 'Free / Pro 월 $9', pros: '2,000+ 앱 연동, 강력한 자동화', cons: '비개발자 진입장벽 높음' },
  ],
  default: [
    { name: 'ValidatorAI', target: '글로벌 창업 준비자', price: '기본 무료 / Pro 월 $29', pros: '20만+ 유저, AI 멘토 대화형', cons: '실제 사람 검증 없음' },
    { name: 'IDEAGACHA',   target: '국내 창업 준비자',  price: '무료', pros: '아이디어 탐색 + 트렌드', cons: '실제 사람 검증 없음, 2026 초기 서비스' },
    { name: '오픈서베이',  target: '기업/마케터',       price: '수십~수백만원', pros: '정량적 리서치, 패널 규모', cons: '비용 과다 — 초기 창업자 부적합' },
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
//
// Phase 1-a : 분야 선택 → 단계 선택 요청          (phase: 1, category 추가)
// Phase 1-b : 단계 선택 → 시장 데이터 + 방향 선택  (phase: 2)
// Phase 2   : 방향 선택 → 타겟 고객 팔로업 질문    (phase: 3)  ← 레퍼런스 없음
// Phase 3   : 타겟 고객 답변 → 라이트 레퍼런스 + CTA (phase: 4)
// Phase 4+  : 자유 대화 + CTA 재표시

export function generatePhaseResponse(
  userInput: string,
  context: AgentContext,
  isToastSelection: boolean,
): { message: AgentMessage; updatedContext: AgentContext } {

  const phase = context.phase

  // ── Phase 1-a: 분야 선택 ──
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

  // ── Phase 1-b: 단계 선택 → 시장 데이터 + 방향 선택 ──
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

  // ── Phase 2: 방향 선택 → 타겟 고객 팔로업 질문 (레퍼런스 없음) ──
  if (phase === 2) {
    const direction = userInput
    return {
      message: {
        id: genId(),
        role: 'assistant',
        content:
          `**${direction}** 방향으로 가시는군요! 💡\n\n` +
          `한 가지만 더 여쭤볼게요 — 핵심 타겟 고객은 어떻게 생각하고 계세요?\n\n` +
          `예) 20대 직장인 여성, 초등학생 자녀를 둔 40대 부모, 1인 창업자 등\n` +
          `직접 입력해주세요 ✏️`,
        timestamp: new Date().toISOString(),
      },
      updatedContext: { ...context, direction, phase: 3 },
    }
  }

  // ── Phase 3: 타겟 고객 답변 → 라이트 레퍼런스 + CTA ──
  if (phase === 3) {
    const targetCustomer = userInput
    const categoryKey = matchCategory(context.category ?? '')
    const lightRefs = (LIGHT_REFERENCES[categoryKey] ?? LIGHT_REFERENCES.default).slice(0, 3)
    const fullRefs  = FULL_REFERENCES[categoryKey] ?? FULL_REFERENCES.default

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content:
          `**${targetCustomer}** 타겟이군요! 잘 정리됐어요 🎯\n\n` +
          `비슷한 방향의 서비스 ${lightRefs.length}개를 찾아봤어요 🔍\n` +
          `가격·강점·약점 심층 분석은 검증 리포트에서 확인하실 수 있어요 📋`,
        timestamp: new Date().toISOString(),
        lightReferences: lightRefs,
        showCTA: true,
      },
      updatedContext: {
        ...context,
        targetCustomer,
        references: fullRefs,
        phase: 4,
      },
    }
  }

  // ── Phase 4+: 자유 대화 + CTA 재표시 ──
  return {
    message: {
      id: genId(),
      role: 'assistant',
      content:
        `지금까지 탐색한 내용을 정리해드릴게요 💡\n\n` +
        `• **분야**: ${context.category ?? '—'}\n` +
        `• **단계**: ${context.stage ?? '—'}\n` +
        `• **방향**: ${context.direction ?? '—'}\n` +
        `• **타겟**: ${context.targetCustomer ?? userInput}\n\n` +
        `실제 리뷰어에게 검증받으면 72시간 안에 전문가 피드백을 받을 수 있어요 🚀`,
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
