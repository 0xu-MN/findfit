'use client'

export type ConfidenceTier = 'verified' | 'internal_benchmark' | 'ai_estimate'

// 기획서 §21.4 리포트 콘텐츠 신뢰도 3단계 배지
const TIER_META: Record<ConfidenceTier, { label: string; bg: string; text: string }> = {
  verified: { label: '검증된 기준', bg: 'bg-green-50', text: 'text-green-700' },
  internal_benchmark: { label: 'FindFit 데이터 기반', bg: 'bg-[#1565C0]/10', text: 'text-[#1565C0]' },
  ai_estimate: { label: 'AI 추정치', bg: 'bg-[#F5F5F5]', text: 'text-[#999]' },
}

export default function ConfidenceBadge({ tier }: { tier: ConfidenceTier }) {
  const meta = TIER_META[tier]
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${meta.bg} ${meta.text}`} title={meta.label}>
      {meta.label}
    </span>
  )
}
