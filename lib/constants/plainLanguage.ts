export const STAGE_LABELS = {
  idea:      { label: '아이디어',   desc: '아직 만들지 않은 단계' },
  prototype: { label: '프로토타입', desc: '목업이나 와이어프레임이 있는 단계' },
  beta:      { label: '베타',       desc: '초기 사용자가 써보고 있는 단계' },
  launched:  { label: '출시 후',    desc: '정식으로 운영 중인 단계' },
} as const

export const VALIDATION_MODE_LABELS = {
  psf: {
    label: '아이디어 검증',
    desc: '사람들이 이 문제를 진짜 겪고 있는지, 내 솔루션을 원할지 확인해요',
  },
  pmf: {
    label: '실사용 만족도 검증',
    desc: '이미 쓰고 있는 사람들이 이 서비스에 얼마나 만족하는지 확인해요',
  },
} as const

export const SEAN_ELLIS_DESC =
  '"이 서비스가 갑자기 없어진다면 얼마나 아쉬울까요?"를 물어보는 핵심 질문이에요. ' +
  '"매우 아쉽다"는 답변이 많을수록 좋은 신호예요.'

export const PSF_CORE_QUESTIONS_DESC =
  '사람들이 이 문제를 실제로 겪고 있는지, 내 솔루션을 써볼 의향이 있는지 확인하는 핵심 질문이에요.'

export const RECOMMENDATION_LABELS = {
  continue: '이대로 계속 진행해도 좋아요',
  pivot:    '방향을 조금 바꿔보는 게 좋아요',
  stop:     '지금 방향은 다시 생각해봐야 해요',
} as const
