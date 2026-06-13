'use client'

import { PROJECT_TYPE_OPTIONS, calculateCost, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
}

function fmt(n: number): string {
  return n.toLocaleString('ko-KR')
}

export default function RequestSummaryPanel({ data }: Props) {
  const typeMeta = PROJECT_TYPE_OPTIONS.find((o) => o.value === data.projectType)
  const stageLabel = data.stage
    ? { idea: '아이디에이션', prototype: '프로토타입', beta: '베타', launched: '출시 후' }[data.stage]
    : '미선택'

  const cost = calculateCost(data)

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h3 className="text-xs font-black mb-5">의뢰 요약</h3>

      <div className="flex flex-col gap-3 text-[10px] font-bold text-[#666]">
        <Row label="프로젝트 타입" value={typeMeta?.title ?? '미선택'} highlight={!!typeMeta} />
        <Row label="단계" value={stageLabel} highlight={!!data.stage} />

        {data.projectType === 'light' && (
          <>
            <Row label="질문 수" value={`${data.questions.length}개`} />
            <Row label="기한" value={`최대 ${data.deadlineDays}일`} />
          </>
        )}

        {(data.projectType === 'standard' || data.projectType === 'deep') && (
          <>
            <Row label="평가단" value={`${data.evaluatorCount}명`} highlight />
            <Row label="1인당 사례금" value={`${fmt(data.feePerEvaluator)}원`} />
            <Row label="기한" value={`최대 ${data.deadlineDays}일`} />
          </>
        )}

        <div className="h-[1px] bg-[#EEEEEE] my-1" />

        <Row label="첨부 이미지" value={data.imageNames.length > 0 ? `${data.imageNames.length}장` : '없음'} />
        <Row label="첨부 문서" value={data.documentNames.length > 0 ? `${data.documentNames.length}개` : '없음'} />

        <div className="h-[1px] bg-[#EEEEEE] my-1" />

        {/* 비용 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span>플랫폼 이용료 (캐시)</span>
            <span className="text-[#1D1C1C]">{fmt(cost.cashCost)}C</span>
          </div>
          {cost.preAuthAmount > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span>사전 승인액</span>
                <span className="text-[#1D1C1C]">{fmt(cost.preAuthAmount)}원</span>
              </div>
              <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#EEEEEE]">
                <span className="text-[#1D1C1C]">실제 청구 시점</span>
                <span className="text-[#F77019] text-[10px] font-black">리뷰 완료 후</span>
              </div>
            </>
          )}
          {data.projectType === 'light' && (
            <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#EEEEEE]">
              <span className="text-[#1D1C1C]">사례금</span>
              <span className="text-[#1D1C1C]">없음</span>
            </div>
          )}
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
