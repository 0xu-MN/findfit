// Agent 대화 로직 (v3.3 재설계)
// Agent의 유일한 목적: 사용자 아이디어를 듣고 → 검증받고 싶게 만들고 → 프로젝트 등록 CTA로 이동

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
  phase: 0 | 1 | 2 | 3 | 4
  ideaSummary?: string    // 사용자가 직접 말한 아이디어 (Phase 0에서 입력)
  category?: string       // ideaSummary에서 자동 감지
  stage?: string          // idea / building / launched
  targetCustomer?: string // Phase 2 답변 (스킵 가능)
  psf?: boolean           // true = PSF (아이디어 검증), false = PMF (시장 반응)
  // 리포트용 풀 레퍼런스 — 채팅에서는 절대 렌더링 안 함
  references?: ReferenceData[]
}

export type AgentMessage = {
  id: string
  role: AgentMessageRole
  content: string
  timestamp: string
  toastOptions?: ToastOption[]
  toastType?: 'single' | 'multi'
  marketData?: MarketData
  trends?: TrendKeyword[]
  // 채팅 렌더링 없음 (사이드바 context 전달용)
  references?: ReferenceData[]
  // Phase 4 경쟁사 한 줄 허용 여부 플래그
  lightReferences?: LightReference[]
  showCTA?: boolean
}

// ─── 단계 선택지 (Phase 1 → 2) ─────────────────────────────

const STAGE_OPTIONS: ToastOption[] = [
  { id: 'idea',     label: '아이디어 단계예요',      emoji: '💡', value: 'idea'     },
  { id: 'building', label: '만들고 있어요',           emoji: '🔨', value: 'building' },
  { id: 'launched', label: '이미 출시/운영 중이에요', emoji: '🚀', value: 'launched' },
]

// ─── 타겟 스킵 (Phase 2 → 3) ─────────────────────────────

const TARGET_SKIP_OPTION: ToastOption[] = [
  { id: 'skip', label: '아직 모르겠어요', emoji: '🤷', value: 'skip' },
]

// ─── 트렌드 한 줄 (Phase 3) — 경쟁사 이름 절대 포함 안 함 ─────

const TREND_TEXTS: Record<string, string> = {
  health:   '헬스·웰니스 관련 검색은 최근 6개월간 국내에서 꾸준히 증가하고 있어요',
  food:     '건강 식품·밀키트 관련 검색은 최근 6개월간 지속 상승 중이에요',
  edu:      'AI 교육·온라인 학습 관련 검색은 최근 1년간 급격히 증가했어요',
  app:      'SaaS·생산성 앱 관련 검색은 최근 3개월간 꾸준히 늘고 있어요',
  fintech:  '핀테크·간편 금융 관련 검색은 최근 6개월간 안정적으로 성장 중이에요',
  commerce: '커머스·이커머스 관련 검색은 최근 6개월간 꾸준히 성장하고 있어요',
  default:  '관련 분야 검색은 최근 6개월간 국내에서 꾸준히 증가하고 있어요',
}

// ─── 카테고리 감지 (텍스트 기반, 버튼 없음) ─────────────────

export function matchCategory(input: string): string {
  const lower = input.toLowerCase()
  const map: [string[], string][] = [
    [['운동', '헬스', '건강', '다이어트', '피트니스', '단백질', '영양', '체중', 'health', '웰니스'], 'health'],
    [['음식', '푸드', '식품', '요리', '밀키트', '식단', '카페', '베이커리', '간식', 'food', '비건'], 'food'],
    [['교육', '에듀', '학습', '강의', '코딩', '영어', '수학', '부트캠프', 'edu'], 'edu'],
    [['금융', '핀테크', '투자', '주식', '은행', 'fintech'], 'fintech'],
    [['쇼핑', '커머스', '이커머스', '판매', '스토어', 'commerce'], 'commerce'],
    [['앱', '게임', '웹', 'saas', '소프트웨어', '플랫폼', '자동화', 'ai', '툴', '도구'], 'app'],
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

// ─── 첫 메시지 — 카테고리 버튼 없음, 반드시 텍스트 입력 유도 ─────

export function getGreeting(exploreMode = false): AgentMessage {
  if (exploreMode) {
    return {
      id: genId(),
      role: 'assistant',
      content:
        '아이템 탐색을 도와드릴게요! 🔍\n\n' +
        '요즘 어떤 서비스나 아이디어에 관심이 있으신가요?\n' +
        '한 줄이라도 괜찮으니 자유롭게 말씀해주세요 ✏️',
      timestamp: new Date().toISOString(),
    }
  }
  return {
    id: genId(),
    role: 'assistant',
    content:
      '안녕하세요! 어떤 서비스나 아이디어를 검증해보고 싶으세요? 😊\n\n' +
      '한 줄이라도 괜찮으니 자유롭게 말씀해주세요 ✏️',
    timestamp: new Date().toISOString(),
  }
}

// ─── Phase별 응답 생성 ─────────────────────────────────────────
//
// Phase 0 → 1 : 사용자 아이디어 첫 입력 → 확인 + 단계 질문
// Phase 1 → 2 : 단계(idea/building/launched) → 타겟 고객 질문
// Phase 2 → 3 : 타겟 답변(or 스킵) → 트렌드 한 줄 + CTA
// Phase 3 → 4 : 추가 대화 → 아이디어 요약 + 경쟁사 언급 한 줄(이름 없음) + CTA
// Phase 4+    : CTA 반복
//
// 규칙: 경쟁사 이름(ValidatorAI 등)은 Phase 0~3 완전 금지
//        Phase 4에서도 이름 없이 "비슷한 서비스들도 있다" 한 줄만

export function generatePhaseResponse(
  userInput: string,
  context: AgentContext,
  _isToastSelection: boolean,
  // Phase 2→3 전환에서만 쓰인다 — 실제 네이버 데이터랩 API 호출(서버 전용 키가
  // 필요해 이 파일에서 직접 호출할 수 없다)은 AgentPanel이 미리 해서 결과
  // 문장을 여기로 넘겨준다. 안 넘겨주면(로딩 실패 등) 기존 정적 문구로 대체.
  realTrendLine?: string,
): { message: AgentMessage; updatedContext: AgentContext } {

  const phase = context.phase

  // ── Phase 0 → 1: 아이디어 첫 입력 ──
  if (phase === 0) {
    const ideaSummary = userInput.length > 60
      ? userInput.slice(0, 60) + '...'
      : userInput
    const category = matchCategory(userInput)
    const psf = true // 기본 PSF, Phase 1에서 stage 보고 재판단

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content:
          `"**${ideaSummary}**"\n\n` +
          `흥미로운 아이디어네요! 지금 어느 단계예요?`,
        timestamp: new Date().toISOString(),
        toastOptions: STAGE_OPTIONS,
        toastType: 'single',
      },
      updatedContext: { ...context, phase: 1, ideaSummary, category, psf },
    }
  }

  // ── Phase 1 → 2: 단계 선택 → 타겟 고객 질문 ──
  if (phase === 1) {
    const stage = userInput
    const psf = stage !== 'launched'

    const stageMsg =
      stage === 'idea'     ? '아직 아이디어 단계시군요 💡' :
      stage === 'building' ? '만들고 계시는군요 🔨'        :
      stage === 'launched' ? '이미 출시하셨군요 🚀'        :
      `**${stage}** 단계시군요`

    // 타겟이 이미 알려져 있으면(예: 홈 화면 아이템 탐색 퀴즈에서 연령대/성별을
    // 이미 답하고 넘어온 경우) 똑같은 질문을 또 하지 않고 바로 트렌드+CTA로
    // 넘어간다 — Phase 2 질문을 건너뛰는 것뿐, Phase 자체는 그대로 3으로 전이.
    if (context.targetCustomer) {
      const categoryKey = context.category ?? 'default'
      const trendText = realTrendLine ?? TREND_TEXTS[categoryKey] ?? TREND_TEXTS.default
      return {
        message: {
          id: genId(),
          role: 'assistant',
          content:
            `${stageMsg}\n\n` +
            `**${context.targetCustomer}** 타겟으로 이미 좁혀두셨네요!\n\n` +
            `📈 ${trendText}\n\n` +
            `실제 사용자들이 이 서비스를 어떻게 느끼는지,\n진짜 반응이 궁금하지 않으세요?`,
          timestamp: new Date().toISOString(),
          showCTA: true,
        },
        updatedContext: { ...context, phase: 3, stage, psf },
      }
    }

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content:
          `${stageMsg}\n\n` +
          `누구를 위한 서비스예요? 타겟이 어느 정도 생각나시면 말씀해주세요.\n` +
          `아직 모르셔도 괜찮아요, 그것도 검증하면서 찾아갈 수 있어요 🙌`,
        timestamp: new Date().toISOString(),
        toastOptions: TARGET_SKIP_OPTION,
        toastType: 'single',
      },
      updatedContext: { ...context, phase: 2, stage, psf },
    }
  }

  // ── Phase 2 → 3: 타겟 답변(or 스킵) → 트렌드 한 줄 + CTA ──
  if (phase === 2) {
    const isSkip =
      userInput === 'skip' ||
      userInput.includes('모르') ||
      userInput.includes('없어') ||
      userInput.length < 3

    const targetCustomer = isSkip ? undefined : userInput
    const categoryKey = context.category ?? 'default'
    const trendText = realTrendLine ?? TREND_TEXTS[categoryKey] ?? TREND_TEXTS.default

    const skipLine = isSkip
      ? '그것도 검증하면서 찾아가면 돼요! 🙌\n\n'
      : `**${targetCustomer}** 타겟이군요!\n\n`

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content:
          skipLine +
          `📈 ${trendText}\n\n` +
          `실제 사용자들이 이 서비스를 어떻게 느끼는지,\n진짜 반응이 궁금하지 않으세요?`,
        timestamp: new Date().toISOString(),
        showCTA: true,
      },
      updatedContext: { ...context, phase: 3, targetCustomer },
    }
  }

  // ── Phase 3 → 4: 추가 대화 → 아이디어 요약 + 경쟁사 한 줄(이름 없음) + CTA ──
  if (phase === 3) {
    const idea = context.ideaSummary ?? '아이디어'
    const target = context.targetCustomer ? ` **${context.targetCustomer}** 타겟으로,` : ''

    return {
      message: {
        id: genId(),
        role: 'assistant',
        content:
          `**"${idea}"**${target} 이 아이디어를\n` +
          `실제 타겟 사용자들에게 직접 검증받아볼 수 있어요.\n\n` +
          `FindFit 리뷰어들이 직접 써보고 솔직한 피드백을 드려요 📋\n\n` +
          `비슷한 방향의 서비스들도 있지만,\n실제 사용자 반응은 직접 받아봐야 알 수 있어요.`,
        timestamp: new Date().toISOString(),
        showCTA: true,
      },
      updatedContext: { ...context, phase: 4 },
    }
  }

  // ── Phase 4+: CTA 반복 ──
  return {
    message: {
      id: genId(),
      role: 'assistant',
      content:
        `등록하면 72시간 안에 실제 리뷰어들의 솔직한 피드백을 받아볼 수 있어요 🚀\n\n` +
        `지금이 딱 좋은 타이밍이에요!`,
      timestamp: new Date().toISOString(),
      showCTA: true,
    },
    updatedContext: { ...context, phase: 4 },
  }
}

// ─── 빈 컨텍스트 ─────────────────────────────

export function createEmptyContext(): AgentContext {
  return { phase: 0 }
}

// ─── FindFit Agent Phase 1(자유 텍스트 이해) — Claude 연동 ─────────────
//
// AgentPanel이 자유 텍스트(토스트 버튼 클릭이 아닌 입력)를 phase 0/1에서
// 받았을 때만 쓰는 경로. /api/agent/understand가 반환한 구조화 결과를
// 기존 엔진과 동일한 AgentMessage/AgentContext 형태로 변환한다.
// Phase 2~4, 토스트 버튼 흐름은 전혀 건드리지 않는다.

export const GENERIC_FALLBACK_REPLY = '궁금한 내용이시군요, 조금 더 말씀해주시겠어요?'

export type UnderstandingResult = {
  reply: string
  category: string | null
  stage: string | null
  item_summary: string | null
  target_customer?: string | null
  ready_for_cta?: boolean
}

const VALID_STAGES = ['idea', 'building', 'launched']

export function applyUnderstanding(
  context: AgentContext,
  result: UnderstandingResult,
): { message: AgentMessage; updatedContext: AgentContext } {
  const category = result.category ?? context.category
  const ideaSummary = result.item_summary ?? context.ideaSummary
  const phase = context.phase

  // ── Phase 2: 타겟 고객 확인 중 ──
  // Claude가 실제로 타겟을 확인했을 때만 phase 3으로 전이한다(입력값과
  // 무관하게 매번 다음 단계로 넘어가던 예전 규칙기반 버그를 여기서도
  // 반복하지 않기 위함) — 확인 안 됐으면 phase 2 유지, 재질문.
  if (phase === 2) {
    if (result.target_customer) {
      return {
        message: { id: genId(), role: 'assistant', content: result.reply, timestamp: new Date().toISOString(), showCTA: true },
        updatedContext: { ...context, phase: 3, targetCustomer: result.target_customer, ideaSummary, category },
      }
    }
    return {
      message: { id: genId(), role: 'assistant', content: result.reply, timestamp: new Date().toISOString(), toastOptions: TARGET_SKIP_OPTION, toastType: 'single' },
      updatedContext: { ...context, ideaSummary, category },
    }
  }

  // ── Phase 3+: 요약 확인 → 등록 준비됐다고 Claude가 판단하면 CTA ──
  if (phase >= 3) {
    return {
      message: { id: genId(), role: 'assistant', content: result.reply, timestamp: new Date().toISOString(), showCTA: true },
      updatedContext: { ...context, phase: result.ready_for_cta ? 4 : phase, ideaSummary, category },
    }
  }

  // ── Phase 0/1: 아이디어/단계 파악 (기존 로직 그대로) ──
  // 이번 발화에서 단계가 확인됐으면 phase 2로 전이 — 이후 AgentPanel의
  // 기존 phase===2 트렌드 조회/타겟 질문 흐름을 그대로 태운다(건드리지 않음).
  // 단, 타겟이 이미 알려져 있으면(홈 화면 아이템 탐색 퀴즈에서 이미 답한
  // 경우) Phase 2 질문을 건너뛰고 바로 Phase 3으로 전이한다.
  if (result.stage && VALID_STAGES.includes(result.stage)) {
    if (context.targetCustomer) {
      return {
        message: { id: genId(), role: 'assistant', content: result.reply, timestamp: new Date().toISOString(), showCTA: true },
        updatedContext: { ...context, phase: 3, stage: result.stage, psf: result.stage !== 'launched', ideaSummary, category },
      }
    }
    return {
      message: {
        id: genId(),
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
        toastOptions: TARGET_SKIP_OPTION,
        toastType: 'single',
      },
      updatedContext: {
        ...context,
        phase: 2,
        stage: result.stage,
        psf: result.stage !== 'launched',
        ideaSummary,
        category,
      },
    }
  }

  // 단계가 아직 파악 안 됐으면 phase 1 유지 + STAGE_OPTIONS 재노출
  return {
    message: {
      id: genId(),
      role: 'assistant',
      content: result.reply,
      timestamp: new Date().toISOString(),
      toastOptions: STAGE_OPTIONS,
      toastType: 'single',
    },
    updatedContext: {
      ...context,
      phase: Math.max(context.phase, 1) as AgentContext['phase'],
      ideaSummary,
      category,
      psf: context.psf ?? true,
    },
  }
}

// Claude 실패/캡 초과 시 조용한 폴백 — 화면이 절대 깨지면 안 되는 첫 진입
// 화면이라, 기존 규칙기반 수준의 제네릭 응답으로 대체한다.
export function fallbackUnderstanding(context: AgentContext): { message: AgentMessage; updatedContext: AgentContext } {
  return {
    message: {
      id: genId(),
      role: 'assistant',
      content: GENERIC_FALLBACK_REPLY,
      timestamp: new Date().toISOString(),
      toastOptions: STAGE_OPTIONS,
      toastType: 'single',
    },
    updatedContext: { ...context, phase: Math.max(context.phase, 1) as AgentContext['phase'] },
  }
}
