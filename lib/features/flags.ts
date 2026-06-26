// Feature Flag 시스템
// 베타: 모두 false, 정식 출시: 환경변수를 true로 전환
// 이 파일 하나로 기능 ON/OFF 전체 관리

export const FEATURES = {
  // 시장 데이터 API
  googleTrends:   process.env.ENABLE_GOOGLE_TRENDS === 'true',
  metaAds:        process.env.ENABLE_META_ADS === 'true',

  // 수익 / 결제
  volumeDiscount: process.env.ENABLE_VOLUME_DISCOUNT === 'true',
  autoDistribute: process.env.ENABLE_AUTO_DISTRIBUTE === 'true',

  // 성장 기능
  expSystem:      process.env.ENABLE_EXP_SYSTEM === 'true',
  roleSwitch:     process.env.ENABLE_ROLE_SWITCH === 'true',
  fcmPush:        process.env.ENABLE_FCM_PUSH === 'true',
  claudeReport:   process.env.ENABLE_CLAUDE_REPORT === 'true',
} as const

export type FeatureKey = keyof typeof FEATURES
