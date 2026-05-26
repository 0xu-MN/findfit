export type RequestType = 'survey' | 'experience'
export type Stage = 'idea' | 'prototype' | 'beta' | 'launched'
export type EvaluatorTier = 'general' | 'expert' | 'domain'
export type DecisionFactor = 'price' | 'convenience' | 'trust' | 'feature' | 'design' | 'etc'
export type AiReport = 'basic' | 'deep'
export type QuestionType = 'multiple' | 'text' | 'likert'

export type Question = {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  isFixed?: boolean
}

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
  requestType: RequestType | null

  // Step 2 — 문제와 솔루션
  problem: string
  currentSolution: string
  alternativeLimit: string
  ourDifference: string

  // Step 3 — 타겟 고객
  ageGroups: string[]
  occupations: string[]
  interests: string[]
  targetContext: string
  decisionFactor: DecisionFactor | null
  hasAlternative: boolean | null
  alternativeDetail: string

  // Step 4 — 공통
  validationGoal: string
  hypothesis: string

  // Step 4 — 설문형 전용
  questions: Question[]

  // Step 4 — 체험형 전용
  experienceUrl: string
  experienceFileName: string
  experienceGuide: string
  experienceTime: number
  experienceDeadline: number
  postQuestions: Question[]
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

  // Step 6 — 평가단/사례금/비용
  evaluatorTier: EvaluatorTier
  evaluatorCount: number
  feePerEvaluator: number
  aiReport: AiReport
  deadlineHours: number
}

export const CATEGORIES = ['앱', '게임', '웹서비스', 'SaaS', '커머스', '헬스', '에듀', '핀테크', '푸드', '부동산', '기타']

export const STAGE_OPTIONS: { value: Stage; title: string; sub: string }[] = [
  { value: 'idea', title: '아이디에이션', sub: '구체화 논의' },
  { value: 'prototype', title: '프로토타입', sub: '목업/와이어프레임' },
  { value: 'beta', title: '베타', sub: '초기 사용자 테스트' },
  { value: 'launched', title: '출시 후', sub: '시장 안착' },
]

export const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대+']
export const OCCUPATIONS = ['직장인', '학생', '프리랜서', '창업자', '주부', '기타']

export const DECISION_FACTORS: { value: DecisionFactor; label: string }[] = [
  { value: 'price', label: '가격' },
  { value: 'convenience', label: '편의성' },
  { value: 'trust', label: '신뢰성' },
  { value: 'feature', label: '기능' },
  { value: 'design', label: '디자인' },
  { value: 'etc', label: '기타' },
]

export const EVALUATOR_TIERS: { value: EvaluatorTier; label: string; cash: number; desc: string }[] = [
  { value: 'general', label: '일반', cash: 1500, desc: '기본 평가단' },
  { value: 'expert', label: '전문가 ★★', cash: 2500, desc: '관련 업계 경험자' },
  { value: 'domain', label: '도메인 전문가 ★★★', cash: 4000, desc: '검증된 도메인 전문가' },
]

export const EVALUATOR_COUNTS = [5, 10, 20, 30, 50, 100]
export const EXPERIENCE_TIMES = [5, 10, 15, 30, 60]
export const EXPERIENCE_DEADLINES = [24, 48, 72]

export const STEP_LABELS: Record<number, string> = {
  1: '기본 정보',
  2: '문제·솔루션',
  3: '타겟 고객',
  4: '검증 내용',
  5: '자료 첨부',
  6: '평가단·비용',
}

export const SEAN_ELLIS_QUESTION: Question = {
  id: 'sean-ellis',
  type: 'multiple',
  text: '이 제품/서비스를 더 이상 사용할 수 없게 된다면 어떤 기분이 들겠습니까?',
  options: ['매우 실망스러울 것이다', '다소 실망스러울 것이다', '실망스럽지 않을 것이다', '해당 없음 (사용하지 않을 것이다)'],
  isFixed: true,
}

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
    requestType: null,

    problem: '',
    currentSolution: '',
    alternativeLimit: '',
    ourDifference: '',

    ageGroups: [],
    occupations: [],
    interests: [],
    targetContext: '',
    decisionFactor: null,
    hasAlternative: null,
    alternativeDetail: '',

    validationGoal: '',
    hypothesis: '',

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

    evaluatorTier: 'general',
    evaluatorCount: 10,
    feePerEvaluator: 5000,
    aiReport: 'basic',
    deadlineHours: 72,
  }
}

export function getStepLabel(step: number): string {
  return STEP_LABELS[step] ?? ''
}

export function getDraftTagLabel(step: number): string {
  return `${getStepLabel(step)} 작성중`
}
