import type { ProjectStage } from './prompt'

export type ReportModuleKey =
  | 'question_summary'
  | 'key_insights'
  | 'action_plan'
  | 'pivot_scenarios'
  | 'competitor_references'
  | 'market_size'
  | 'positioning_map'
  | 'unit_economics'
  | 'gtm_strategies'
  | 'scaleup_roadmap'

// 기획서 §21.5 "단계 × 검증방식별 리포트 모듈 매트릭스" — 프로젝트 단계와
// PSF/PMF 모드에 따라 어떤 리포트 블록이 포함되는지 한 곳에서 관리한다.
// 새 리포트 항목을 추가할 땐 반드시 이 표에 먼저 셀을 정의할 것. 산발적인
// boolean 체크(예: stage==='beta'||stage==='launched')를 이 함수 하나로 대체한다.
//
// - 아이디어 / 만들고 있어요(idea, prototype) — PSF 기본 모듈만
// - 베타(beta) — PSF 모듈 + Unit Economics + GTM 초기 전략
// - 출시(launched) — PMF 모듈(Sean Ellis 등) + Unit Economics + GTM + Scale-up 로드맵
//
// 마케팅 채널별 성과/운영·비용구조 포인트는 §21.5에 따라 이번 범위에서 제외 —
// 등록 마법사에 관련 입력 필드가 없고 베타 데이터로 필요성 검증 전이라 보류.
export function getReportModulesForStage(stage: ProjectStage, _mode: 'psf' | 'pmf'): ReportModuleKey[] {
  const base: ReportModuleKey[] = [
    'question_summary',
    'key_insights',
    'action_plan',
    'pivot_scenarios',
    'competitor_references',
    'market_size',
    'positioning_map',
  ]

  if (stage === 'idea' || stage === 'prototype') return base
  if (stage === 'beta') return [...base, 'unit_economics', 'gtm_strategies']
  // launched
  return [...base, 'unit_economics', 'gtm_strategies', 'scaleup_roadmap']
}
