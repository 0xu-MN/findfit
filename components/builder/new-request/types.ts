export type ProjectType = 'light' | 'standard'
export type Stage = 'idea' | 'prototype' | 'beta' | 'launched'
export type DecisionFactor = 'price' | 'convenience' | 'trust' | 'feature' | 'design' | 'etc'
export type DistributionMethod = 'later' | 'equal' | 'differential' | 'top_n' | 'custom'

// Light는 한 프로젝트에 하나의 질문 스타일만 사용
export type LightQuestionStyle = 'ab_test' | 'keyword' | 'yes_no'

// Light: ab_test, keyword, yes_no
// Standard/Deep: multiple_choice, short_answer, likert (+ sean_ellis 자동)
export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'likert'
  | 'ab_test'
  | 'keyword'
  | 'yes_no'
  | 'sean_ellis'

// 단계 흐름 — Light는 4단계, Standard/Deep는 6단계
export type StepKey = 'basic' | 'problem' | 'target' | 'questions' | 'attachments' | 'cost'

export type Question = {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  isFixed?: boolean
}

// Creator 레벨 (AI 리포트 무료/유료 결정)
export type CreatorLevel = 'seed' | 'sprout' | 'builder' | 'launcher'

export type DraftStatus = 'draft' | 'submitted'

export type RequestFormData = {
  id: string
  status: DraftStatus
  currentStep: number
  createdAt: string
  updatedAt: string

  // Step 1 — 기본 정보
  productName: string
  oneLineDesc: string
  categories: string[]
  stage: Stage | null
  landingUrl: string
  projectType: ProjectType | null

  // Step 2 — 문제와 솔루션 (3개 필드)
  problem: string
  alternativeAndLimit: string // 기존 대안과 한계 (이전 currentSolution + alternativeLimit 통합)
  ourDifference: string

  // Step 3 — 타겟 고객
  ageGroups: string[]
  occupations: string[] // 활동 상태 — 직장인/학생/프리랜서/자영업자/주부/무직/기타
  jobRoles: string[] // 직군 — PM/개발자/디자이너/마케터/etc (활동 상태가 직장인/프리랜서/자영업자/창업자일 때 의미 있음)
  interests: string[]
  targetContext: string
  decisionFactor: DecisionFactor | null

  // Step 4 — 공통
  validationGoal: string
  hypothesis: string

  // Step 4 — Light 전용: 질문 스타일 선택 (한 프로젝트에 하나만)
  lightQuestionStyle: LightQuestionStyle | null

  // Step 4 — Light/Standard 질문 (Sean Ellis는 자동 포함, 작성 안 함)
  questions: Question[]

  // Step 4 — Deep 전용
  experienceUrl: string
  experienceFileName: string
  experienceGuide: string
  experienceTime: number // 분: 5/10/15/30/60
  experienceDeadline: number // 시간: 24/48/72
  postQuestions: Question[] // Deep 체험 후 질문
  screenshotRequired: boolean

  // Step 5 — 자료 첨부
  imageNames: string[]
  videoUrl: string
  documentNames: string[]
  visibility: {
    images: boolean
    video: boolean
    documents: boolean
  }

  // Step 6
  evaluatorCount: number // Light는 의미 없음 (스펙: "제한 없음"), Standard/Deep는 10/20/30/50/100
  feePerEvaluator: number // Light는 0
  distributionMethod: DistributionMethod
  deadlineDays: number // Light: 5, Standard/Deep: 10 (Deep은 experienceDeadline 이상)
  targetReviewerRoles: string[] // 원하는 평가단 직군 (PM/개발자/마케터/디자이너/창업자/투자자/일반소비자)
}

export const CATEGORIES = ['앱', '게임', '웹', 'SaaS', '커머스', '헬스', '에듀', '핀테크', '푸드', '부동산', '기타']

export const STAGE_OPTIONS: { value: Stage; title: string; sub: string }[] = [
  { value: 'idea',      title: '아이디어',    sub: '아직 만들지 않은 단계' },
  { value: 'prototype', title: '프로토타입',  sub: '목업이나 와이어프레임이 있는 단계' },
  { value: 'beta',      title: '베타',        sub: '초기 사용자가 써보고 있는 단계' },
  { value: 'launched',  title: '출시 후',     sub: '정식으로 운영 중인 단계' },
]

export const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대+']

// 활동 상태 — 고용 형태/현재 무엇을 하고 있는지
export const OCCUPATIONS = ['직장인', '학생', '프리랜서', '자영업자', '창업자', '주부', '무직', '기타']

// 직군 — 실제 직업 종류 (활동 상태가 일하는 부류일 때 의미 있음)
export const JOB_ROLES = [
  '기획·PM',
  '개발자',
  '디자이너',
  '마케터',
  '영업·BD',
  '운영·CS',
  '데이터·분석가',
  '재무·회계',
  '인사·HR',
  '콘텐츠 크리에이터',
  '교육·연구',
  '의료·헬스케어',
  '법률·세무',
  '제조·생산',
  '서비스직',
  '학생',
  '기타',
]

// 평가단 직군 (매칭 기준) — Step 6에서 의뢰자가 선택, 리뷰어 피드의 추천 노출 기준
export const TARGET_REVIEWER_ROLES = [
  'PM',
  '개발자',
  '마케터',
  '디자이너',
  '창업자',
  '투자자',
  '일반 소비자',
]

export const DECISION_FACTORS: { value: DecisionFactor; label: string }[] = [
  { value: 'price', label: '가격' },
  { value: 'convenience', label: '편의성' },
  { value: 'trust', label: '신뢰성' },
  { value: 'feature', label: '기능' },
  { value: 'design', label: '디자인' },
  { value: 'etc', label: '기타' },
]

// 프로젝트 타입 옵션 + 핵심 메타
export const PROJECT_TYPE_OPTIONS: {
  value: ProjectType
  title: string
  shortDesc: string
  detail: string
  cashCost: string
  honorariumNote: string
  maxDays: number
  minReviewers: number | null
}[] = [
  {
    value: 'light',
    title: 'Light',
    shortDesc: '빠른 방향성 확인',
    detail: 'A/B · 키워드 · 예/아니오',
    cashCost: '4,900C 고정',
    honorariumNote: '사례금 없음',
    maxDays: 5,
    minReviewers: null,
  },
  {
    value: 'standard',
    title: 'Standard',
    shortDesc: '설문으로 PSF/PMF 검증',
    detail: '객관식 · 주관식 · 리커트',
    cashCost: '1,800C / 명',
    honorariumNote: '사례금 자율 설정',
    maxDays: 10,
    minReviewers: 10,
  },
]

export const REVIEWER_COUNTS = [10, 20, 30, 50, 100] // Standard/Deep
export const EXPERIENCE_TIMES = [5, 10, 15, 30, 60] // 분
export const EXPERIENCE_DEADLINES = [24, 48, 72] // 시간

export const DISTRIBUTION_OPTIONS: { value: DistributionMethod; label: string; desc: string }[] = [
  { value: 'later', label: '나중에 결정', desc: '리뷰 완료 후 결정 · 72시간 미결정 시 균등 자동 처리' },
  { value: 'equal', label: '균등', desc: '모든 Reviewer 동일 금액' },
  { value: 'differential', label: '차등', desc: '각자 금액 직접 입력' },
  { value: 'top_n', label: 'Top N', desc: '상위 N명에게만 지급' },
  { value: 'custom', label: '커스텀', desc: '자유 조합' },
]

// 단계 라벨 (key 기반)
export const STEP_KEY_LABELS: Record<StepKey, string> = {
  basic: '기본 정보',
  problem: '문제·솔루션',
  target: '타겟 고객',
  questions: '검증 내용',
  attachments: '자료 첨부',
  cost: '비용 확인',
}

// 타입별 단계 흐름 — Light는 4단계 (target/attachments 스킵), Standard/Deep는 6단계
export const STEP_FLOWS: Record<ProjectType, StepKey[]> = {
  light: ['basic', 'problem', 'questions', 'cost'],
  standard: ['basic', 'problem', 'target', 'questions', 'attachments', 'cost'],
}

// 기본 흐름 (projectType 미선택 시 — 6단계 fallback)
export const DEFAULT_FLOW: StepKey[] = STEP_FLOWS.standard

// 호환용 (기존 코드)
export const STEP_LABELS: Record<number, string> = {
  1: '기본 정보',
  2: '문제·솔루션',
  3: '타겟 고객',
  4: '검증 내용',
  5: '자료 첨부',
  6: '비용 확인',
}

// 흐름·step number 헬퍼
export function getFlow(projectType: ProjectType | null): StepKey[] {
  return projectType ? STEP_FLOWS[projectType] : DEFAULT_FLOW
}

export function getStepKey(projectType: ProjectType | null, step: number): StepKey {
  const flow = getFlow(projectType)
  return flow[Math.min(Math.max(step - 1, 0), flow.length - 1)]
}

export function getStepNumberByKey(projectType: ProjectType | null, key: StepKey): number {
  const flow = getFlow(projectType)
  const idx = flow.indexOf(key)
  return idx >= 0 ? idx + 1 : 1
}

// 비용 상수 (스펙: 1. 수익 구조 / 2. 프로젝트 타입 설계)
export const LIGHT_CASH_COST = 4900 // 고정
export const STD_DEEP_CASH_PER_REVIEWER = 1800
export const REVIEWER_COMMISSION_RATE = 0.15 // 15% Reviewer 수령액 차감
export const AI_REPORT_DEEP_COST = 0 // Builder+ 기본 무료 (스펙 기준 베타 단계)

// Deep 권장 사례금 (스펙 2.Deep 타입 상세)
export const DEEP_RECOMMENDED_FEE: Record<number, number> = {
  5: 3000,
  10: 5000,
  15: 8000,
  30: 15000,
  60: 25000,
}

export const SEAN_ELLIS_QUESTION: Question = {
  id: 'sean-ellis',
  type: 'sean_ellis',
  text: '이 제품/서비스를 더 이상 사용할 수 없게 된다면 어떤 기분이 들겠습니까?',
  options: ['매우 실망할 것이다', '약간 실망할 것이다', '실망하지 않을 것이다', '이 제품을 사용하지 않는다'],
  isFixed: true,
}

// PSF 단계(아이디어/프로토타입)에서 Standard에 자동 포함되는 필수 질문 4개
export const PSF_STANDARD_QUESTIONS: Question[] = [
  {
    id: 'psf-1',
    type: 'multiple_choice',
    text: '이 문제를 직접 겪어보신 적이 있나요?',
    options: ['자주 겪는다', '가끔 겪는다', '거의 없다', '겪어본 적 없다'],
    isFixed: true,
  },
  {
    id: 'psf-2',
    type: 'short_answer',
    text: '현재는 이 문제를 어떻게 해결하고 계신가요?',
    isFixed: true,
  },
  {
    id: 'psf-3',
    type: 'multiple_choice',
    text: '이런 솔루션이 있다면 사용해보시겠어요?',
    options: ['반드시 사용한다', '사용해볼 것 같다', '잘 모르겠다', '사용하지 않을 것 같다'],
    isFixed: true,
  },
  {
    id: 'psf-4',
    type: 'multiple_choice',
    text: '이 문제는 얼마나 자주 발생하나요?',
    options: ['매일', '주 1~2회', '월 1~2회', '거의 없음'],
    isFixed: true,
  },
]

// Light 질문 최대 개수 (Sean Ellis 미포함)
export const LIGHT_MAX_QUESTIONS = 5
// Standard/Deep 작성 가능 질문 (Sean Ellis 자동 포함되어 총 10개 = 작성 9개)
export const STD_DEEP_MAX_WRITABLE = 9
// PSF 모드에서 4개 필수 질문이 자동 포함되므로 작성 가능 최대 = 9 - 4 = 5
export const PSF_MAX_WRITABLE = STD_DEEP_MAX_WRITABLE - PSF_STANDARD_QUESTIONS.length

export function createEmptyDraft(): RequestFormData {
  const now = new Date().toISOString()
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`,
    status: 'draft',
    currentStep: 1,
    createdAt: now,
    updatedAt: now,

    productName: '',
    oneLineDesc: '',
    categories: [],
    stage: null,
    landingUrl: '',
    projectType: null,

    problem: '',
    alternativeAndLimit: '',
    ourDifference: '',

    ageGroups: [],
    occupations: [],
    jobRoles: [],
    interests: [],
    targetContext: '',
    decisionFactor: null,

    validationGoal: '',
    hypothesis: '',

    lightQuestionStyle: null,
    questions: [],
    experienceUrl: '',
    experienceFileName: '',
    experienceGuide: '',
    experienceTime: 10,
    experienceDeadline: 72,
    postQuestions: [],
    screenshotRequired: false,

    imageNames: [],
    videoUrl: '',
    documentNames: [],
    visibility: { images: true, video: true, documents: true },

    evaluatorCount: 10,
    feePerEvaluator: 5000,
    distributionMethod: 'later',
    deadlineDays: 10,
    targetReviewerRoles: [],
  }
}

export function getStepLabel(step: number): string {
  return STEP_LABELS[step] ?? ''
}

export function getDraftTagLabel(step: number): string {
  return `${getStepLabel(step)} 작성중`
}

/* ─────────────────────────────────────────────────────── */
/*  Deep deadline 분할 계산                                  */
/* ─────────────────────────────────────────────────────── */

export type DeepDeadlineBreakdown = {
  experienceDays: number // 체험 기간 (일 단위)
  reviewWritingDays: number // 평가 작성 기간 (일 단위)
  totalDays: number // 전체 기간 (일 단위)
  isValid: boolean // 평가 작성 시간이 1일 이상 남는지
}

export function calculateDeepDeadline(experienceHours: number, totalDays: number): DeepDeadlineBreakdown {
  const experienceDays = Math.ceil(experienceHours / 24)
  const reviewWritingDays = totalDays - experienceDays
  return {
    experienceDays,
    reviewWritingDays,
    totalDays,
    isValid: reviewWritingDays >= 1,
  }
}

/* ─────────────────────────────────────────────────────── */
/*  비용 계산 헬퍼                                          */
/* ─────────────────────────────────────────────────────── */

export type CostBreakdown = {
  cashCost: number // 캐시 소모
  preAuthAmount: number // PortOne 사전 승인액 (Standard/Deep만 > 0)
  reviewerNetPerPerson: number // 평가단 실수령액 (1인당)
  platformCommissionTotal: number // FindFit 수수료 총액 (사례금 기반)
}

export function calculateCost(data: RequestFormData): CostBreakdown {
  if (data.projectType === 'light') {
    return {
      cashCost: LIGHT_CASH_COST,
      preAuthAmount: 0,
      reviewerNetPerPerson: 0,
      platformCommissionTotal: 0,
    }
  }
  if (data.projectType === 'standard' || data.projectType === 'deep') {
    const cashCost = STD_DEEP_CASH_PER_REVIEWER * data.evaluatorCount
    const preAuthAmount = data.feePerEvaluator * data.evaluatorCount
    const reviewerNetPerPerson = Math.round(data.feePerEvaluator * (1 - REVIEWER_COMMISSION_RATE))
    const platformCommissionTotal = preAuthAmount - reviewerNetPerPerson * data.evaluatorCount
    return { cashCost, preAuthAmount, reviewerNetPerPerson, platformCommissionTotal }
  }
  return { cashCost: 0, preAuthAmount: 0, reviewerNetPerPerson: 0, platformCommissionTotal: 0 }
}

/* ─────────────────────────────────────────────────────── */
/*  레거시 draft 마이그레이션                                */
/* ─────────────────────────────────────────────────────── */

// 이전 버전 draft (requestType: survey/experience) 호환
type LegacyDraft = Partial<RequestFormData> & {
  requestType?: 'survey' | 'experience'
  currentSolution?: string
  alternativeLimit?: string
  hasAlternative?: boolean | null
  alternativeDetail?: string
  evaluatorTier?: string
  aiReport?: string
  deadlineHours?: number
  lightQuestionStyle?: LightQuestionStyle | null
}

export function migrateDraft(raw: unknown): RequestFormData {
  const empty = createEmptyDraft()
  if (!raw || typeof raw !== 'object') return empty
  const old = raw as LegacyDraft

  // requestType → projectType
  let projectType: ProjectType | null = empty.projectType
  if (old.projectType === 'light' || old.projectType === 'standard') {
    projectType = old.projectType
  } else if (old.requestType === 'survey' || old.requestType === 'experience') {
    // 'experience' (구 deep)는 standard로 마이그레이션
    projectType = 'standard'
  }

  // currentSolution + alternativeLimit → alternativeAndLimit
  let alternativeAndLimit = old.alternativeAndLimit ?? ''
  if (!alternativeAndLimit && (old.currentSolution || old.alternativeLimit)) {
    alternativeAndLimit = [old.currentSolution, old.alternativeLimit].filter(Boolean).join(' / ')
  }

  // currentStep을 새 흐름(Light=4, Std/Deep=6) 기준으로 클램프
  const flowLen = getFlow(projectType).length
  const currentStep = Math.min(Math.max(old.currentStep ?? 1, 1), flowLen)

  // lightQuestionStyle은 Light만 의미 있음
  const lightQuestionStyle =
    projectType === 'light' && old.lightQuestionStyle ? old.lightQuestionStyle : null

  return {
    ...empty,
    ...old,
    id: old.id ?? empty.id,
    projectType,
    alternativeAndLimit,
    currentStep,
    lightQuestionStyle,
    evaluatorCount: old.evaluatorCount ?? empty.evaluatorCount,
    distributionMethod: old.distributionMethod ?? empty.distributionMethod,
    deadlineDays: old.deadlineDays ?? (projectType === 'light' ? 5 : 10),
    targetReviewerRoles: Array.isArray(old.targetReviewerRoles) ? old.targetReviewerRoles : [],
    jobRoles: Array.isArray(old.jobRoles) ? old.jobRoles : [],
  } as RequestFormData
}
