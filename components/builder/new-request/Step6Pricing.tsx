'use client'

import { EVALUATOR_COUNTS, EVALUATOR_TIERS, type AiReport, type EvaluatorTier, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
  walletBalance: number
  onChange: (patch: Partial<RequestFormData>) => void
}

function fmt(n: number): string {
  return n.toLocaleString('ko-KR')
}

export default function Step6Pricing({ data, walletBalance, onChange }: Props) {
  const tier = EVALUATOR_TIERS.find((t) => t.value === data.evaluatorTier)!
  const cashCost = tier.cash * data.evaluatorCount + (data.aiReport === 'deep' ? 5000 : 0)
  const remainingCash = walletBalance - cashCost
  const insufficientCash = remainingCash < 0

  const feeSubtotal = data.feePerEvaluator * data.evaluatorCount
  const platformFee = Math.round(feeSubtotal * 0.075)
  const vat = Math.round(platformFee * 0.1)
  const totalCash = feeSubtotal + platformFee + vat

  const deadlineOptions =
    data.requestType === 'experience'
      ? [{ h: data.experienceDeadline + 24, label: `${data.experienceDeadline + 24}시간`, note: '체험 기한 + 24h (평가 작성)' }]
      : [
          { h: 72, label: '72시간', note: '기본' },
          { h: 48, label: '48시간', note: '+10% 할증' },
        ]

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black">평가단 · 사례금 · 비용 확인</h2>
        <p className="text-[10px] text-[#999] font-bold">실시간 계산된 비용을 확인하고 미리보기로 진행하세요</p>
      </div>

      {/* 평가단 등급 */}
      <Field label="평가단 등급">
        <div className="grid grid-cols-3 gap-3">
          {EVALUATOR_TIERS.map((t) => {
            const active = data.evaluatorTier === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ evaluatorTier: t.value as EvaluatorTier })}
                className={`flex flex-col p-4 rounded-xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <span className={`text-[11px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{t.label}</span>
                <span className={`text-[9px] mt-1 ${active ? 'text-[#F77019]/80' : 'text-[#999]'}`}>{t.desc}</span>
                <span className={`text-[10px] mt-2 font-black ${active ? 'text-[#F77019]' : 'text-[#666]'}`}>{fmt(t.cash)}C / 명</span>
              </button>
            )
          })}
        </div>
      </Field>

      {/* 평가단 수 */}
      <Field label="평가단 수">
        <div className="grid grid-cols-6 gap-2">
          {EVALUATOR_COUNTS.map((n) => {
            const active = data.evaluatorCount === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ evaluatorCount: n })}
                className={`h-10 rounded-xl text-[11px] font-black transition-colors ${
                  active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                }`}
              >
                {n}명
              </button>
            )
          })}
        </div>
      </Field>

      {/* 1인당 사례금 */}
      <Field label="1인당 사례금" hint="최소 1,000원">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1000}
            step={1000}
            value={data.feePerEvaluator}
            onChange={(e) => onChange({ feePerEvaluator: Math.max(0, Number(e.target.value) || 0) })}
            className="flex-1 h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px] font-bold"
          />
          <span className="text-[11px] font-bold text-[#666]">원</span>
        </div>
      </Field>

      {/* AI 리포트 */}
      <Field label="AI 리포트">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'basic' as AiReport, title: '기본 포함', desc: '핵심 인사이트 요약', cost: '+0C' },
              { value: 'deep' as AiReport, title: '심층 분석', desc: '세그먼트별·PSST·우선순위 분석', cost: '+5,000C' },
            ]
          ).map((o) => {
            const active = data.aiReport === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange({ aiReport: o.value })}
                className={`flex flex-col p-4 rounded-xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{o.title}</span>
                  <span className={`text-[10px] font-black ${active ? 'text-[#F77019]' : 'text-[#999]'}`}>{o.cost}</span>
                </div>
                <span className={`text-[10px] mt-2 ${active ? 'text-[#F77019]/80' : 'text-[#999]'}`}>{o.desc}</span>
              </button>
            )
          })}
        </div>
      </Field>

      {/* 완료 기한 */}
      <Field label="완료 기한">
        <div className="grid grid-cols-2 gap-3">
          {deadlineOptions.map((opt) => {
            const active = data.deadlineHours === opt.h
            return (
              <button
                key={opt.h}
                type="button"
                onClick={() => onChange({ deadlineHours: opt.h })}
                className={`flex flex-col p-4 rounded-xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <span className={`text-[11px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{opt.label}</span>
                <span className={`text-[9px] mt-1 ${active ? 'text-[#F77019]/80' : 'text-[#999]'}`}>{opt.note}</span>
              </button>
            )
          })}
        </div>
      </Field>

      {/* 비용 요약 */}
      <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-5 flex flex-col gap-3">
        <h3 className="text-[12px] font-black">비용 요약</h3>

        <div className="flex flex-col gap-2 text-[11px] font-bold">
          <Row label={`캐시 소모 (${tier.label} × ${data.evaluatorCount}${data.aiReport === 'deep' ? ' + 심층 리포트' : ''})`} value={`${fmt(cashCost)}C`} />
          <Row label="잔여 캐시" value={`${fmt(remainingCash)}C`} valueClass={insufficientCash ? 'text-red-500' : 'text-[#666]'} />

          <div className="h-[1px] bg-[#EEEEEE] my-1" />

          <Row label={`사례금 소계 (${fmt(data.feePerEvaluator)} × ${data.evaluatorCount}명)`} value={`${fmt(feeSubtotal)}원`} />
          <Row label="FindFit 수수료 7.5%" value={`${fmt(platformFee)}원`} />
          <Row label="부가세 (수수료의 10%)" value={`${fmt(vat)}원`} />

          <div className="h-[1px] bg-[#EEEEEE] my-1" />

          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black text-[#1D1C1C]">총 현금 결제</span>
            <span className="text-[14px] font-black text-[#F77019]">{fmt(totalCash)}원</span>
          </div>
        </div>

        {insufficientCash && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-[10px] font-bold text-red-600">
              ⚠ 캐시가 부족합니다. 부족분 {fmt(Math.abs(remainingCash))}C 충전이 필요합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold">{label}</label>
        {hint && <span className="text-[9px] text-[#999] font-bold">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#666]">{label}</span>
      <span className={valueClass ?? 'text-[#1D1C1C]'}>{value}</span>
    </div>
  )
}
