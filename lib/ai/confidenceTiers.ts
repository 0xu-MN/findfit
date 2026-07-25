// 기획서 §21.4 "리포트 콘텐츠 신뢰도 3단계 체계"
export type ConfidenceTier = 'verified' | 'internal_benchmark' | 'ai_estimate'

export type ConfidenceTiers = {
  sean_ellis: ConfidenceTier
  competitor_references: ConfidenceTier
  market_size: ConfidenceTier
  score_baseline: ConfidenceTier
  usage_frequency_note: ConfidenceTier
}

// hasEnoughBenchmarkSamples = 해당 category+stage의 report_benchmark_logs
// 표본이 MIN_BENCHMARK_SAMPLE_SIZE 이상 쌓였는지 — generateReport.ts가
// report_benchmark_logs를 조회해 판단한 뒤 이 함수에 넘긴다.
export function computeConfidenceTiers(hasEnoughBenchmarkSamples: boolean): ConfidenceTiers {
  const benchmarkTier: ConfidenceTier = hasEnoughBenchmarkSamples ? 'internal_benchmark' : 'ai_estimate'
  return {
    // Sean Ellis 40% 룰 자체는 외부에서 이미 검증된 방법론 — 항상 1단계 고정
    sean_ellis: 'verified',
    // 경쟁사 레퍼런스 / TAM·SAM·SOM / 점수 기준선(합격선)은 표본이 쌓이면
    // FindFit 자체 벤치마크(2단계)로 승격
    competitor_references: benchmarkTier,
    market_size: benchmarkTier,
    score_baseline: benchmarkTier,
    // "사용빈도/리텐션 신호" — FindFit은 원샷 리뷰 구조라 실제 반복사용을
    // 측정하지 않으므로, 표본 수와 무관하게 항상 3단계(AI 추정) 고정
    usage_frequency_note: 'ai_estimate',
  }
}
