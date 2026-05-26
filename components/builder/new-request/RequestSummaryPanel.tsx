'use client'

import { EVALUATOR_TIERS, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
}

function fmtNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}

export default function RequestSummaryPanel({ data }: Props) {
  const tier = EVALUATOR_TIERS.find((t) => t.value === data.evaluatorTier)
  const requestTypeLabel = data.requestType === 'survey' ? '설문형' : data.requestType === 'experience' ? '체험형' : '미선택'
  const stageLabel = data.stage
    ? { idea: '아이디에이션', prototype: '프로토타입', beta: '베타', launched: '출시 후' }[data.stage]
    : '미선택'

  const cashCost = (tier?.cash ?? 0) * data.evaluatorCount + (data.aiReport === 'deep' ? 5000 : 0)
  const feeSubtotal = data.feePerEvaluator * data.evaluatorCount
  const platformFee = Math.round(feeSubtotal * 0.075)
  const vat = Math.round(platformFee * 0.1)
  const totalCash = feeSubtotal + platformFee + vat

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h3 className="text-xs font-black mb-5">의뢰 요약</h3>

      <div className="flex flex-col gap-3 text-[10px] font-bold text-[#666]">
        <Row label="의뢰 타입" value={requestTypeLabel} highlight={!!data.requestType} />
        <Row label="단계" value={stageLabel} highlight={!!data.stage} />
        <Row label="평가단" value={tier ? `${tier.label} ${data.evaluatorCount}명` : '미선택'} highlight />
        <Row label="리포트" value={data.aiReport === 'deep' ? '심층 분석' : '기본'} />
        <Row label="완료 기한" value={`${data.deadlineHours}시간`} />

        <div className="h-[1px] bg-[#EEEEEE] my-1" />

        <Row label="첨부 이미지" value={data.imageNames.length > 0 ? `${data.imageNames.length}장` : '없음'} />
        <Row label="첨부 문서" value={data.documentNames.length > 0 ? `${data.documentNames.length}개` : '없음'} />

        <div className="h-[1px] bg-[#EEEEEE] my-1" />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span>캐시 소모</span>
            <span className="text-[#1D1C1C]">{fmtNumber(cashCost)}C</span>
          </div>
          <div className="flex items-center justify-between">
            <span>사례금 소계</span>
            <span className="text-[#1D1C1C]">{fmtNumber(feeSubtotal)}원</span>
          </div>
          <div className="flex items-center justify-between">
            <span>수수료 + 부가세</span>
            <span className="text-[#1D1C1C]">{fmtNumber(platformFee + vat)}원</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#EEEEEE]">
            <span className="text-[#1D1C1C]">총 현금 결제</span>
            <span className="text-[#F77019] text-[11px] font-black">{fmtNumber(totalCash)}원</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={highlight ? 'text-[#1D1C1C]' : 'text-[#999]'}>{value}</span>
    </div>
  )
}
