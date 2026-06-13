'use client'

import { Info, Lock } from 'lucide-react'
import {
  DISTRIBUTION_OPTIONS,
  LIGHT_CASH_COST,
  PROJECT_TYPE_OPTIONS,
  REVIEWER_COMMISSION_RATE,
  TARGET_REVIEWER_ROLES,
  calculateCost,
  calculateDeepDeadline,
  type DistributionMethod,
  type RequestFormData,
} from './types'

type Props = {
  data: RequestFormData
  walletBalance: number
  onChange: (patch: Partial<RequestFormData>) => void
}

function fmt(n: number): string {
  return n.toLocaleString('ko-KR')
}

export default function Step6Pricing({ data, walletBalance, onChange }: Props) {
  if (!data.projectType) {
    return (
      <div className="rounded-3xl border border-[#F77019]/30 bg-[#F77019]/5 p-8 flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-black text-[#F77019]">프로젝트 타입이 선택되지 않았습니다</p>
        <p className="text-[11px] font-bold text-[#666]">Step 1에서 Light/Standard/Deep 중 하나를 먼저 선택해주세요.</p>
      </div>
    )
  }

  if (data.projectType === 'light') {
    return <LightPricing data={data} walletBalance={walletBalance} />
  }
  return <StdDeepPricing data={data} walletBalance={walletBalance} onChange={onChange} />
}

/* ─────────────────────────────────────────────────────── */
/*  Light — 캐시 차감만                                       */
/* ─────────────────────────────────────────────────────── */

function LightPricing({ data, walletBalance }: { data: RequestFormData; walletBalance: number }) {
  const remaining = walletBalance - LIGHT_CASH_COST
  const insufficient = remaining < 0

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black">비용 확인</h2>
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Light</span>
        </div>
        <p className="text-[10px] text-[#999] font-bold">Light는 캐시 차감만 발생합니다 · 사례금 · 사전 승인 없음</p>
      </div>

      {/* 비용 요약 */}
      <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-5 flex flex-col gap-2 text-[11px] font-bold">
        <Row label="플랫폼 이용료 (Light 고정)" value={`${fmt(LIGHT_CASH_COST)}C`} />
        <Row label="잔여 캐시" value={`${fmt(remaining)}C`} valueClass={insufficient ? 'text-red-500' : 'text-[#666]'} />
        <div className="h-[1px] bg-[#EEEEEE] my-1" />
        <Row label="사례금" value="없음" />
        <Row label="완료 기한" value={`최대 ${data.deadlineDays}일`} />

        {insufficient && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 mt-2">
            <p className="text-[10px] font-bold text-red-600">
              ⚠ 캐시가 부족합니다. 부족분 {fmt(Math.abs(remaining))}C 충전이 필요합니다.
            </p>
          </div>
        )}
      </div>

      {/* 안내 박스 */}
      <div className="rounded-xl bg-[#1565C0]/5 border border-[#1565C0]/15 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#1565C0] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-[#1565C0] leading-relaxed">
            Light는 빠른 방향성 확인용입니다. 평가단은 EXP 적립 + 신제품 선행 접근을 동기로 참여하며,
            결과 리포트는 무료로 제공됩니다 (Gemini Flash).
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  Standard / Deep — 캐시 + PortOne 사전 승인                */
/* ─────────────────────────────────────────────────────── */

function StdDeepPricing({
  data,
  walletBalance,
  onChange,
}: {
  data: RequestFormData
  walletBalance: number
  onChange: (patch: Partial<RequestFormData>) => void
}) {
  const cost = calculateCost(data)
  const remainingCash = walletBalance - cost.cashCost
  const insufficientCash = remainingCash < 0
  const projectMeta = PROJECT_TYPE_OPTIONS.find((p) => p.value === data.projectType)!

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black">평가단 · 사례금 · 비용 확인</h2>
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">{projectMeta.title}</span>
        </div>
        <p className="text-[10px] text-[#999] font-bold">캐시는 즉시 차감 · 사례금은 사전 승인 후 리뷰 완료 시 실제 청구</p>
      </div>

      {/* 평가단 수 — 자유 입력 (최소 검증) */}
      <Field label="평가단 수" hint={`최소 ${projectMeta.minReviewers}명 · 자유 입력`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={projectMeta.minReviewers ?? 1}
              step={1}
              value={data.evaluatorCount}
              onChange={(e) => onChange({ evaluatorCount: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
              className={`flex-1 h-10 rounded-xl border bg-[#F5F5F5] outline-none px-4 text-[11px] font-bold transition-colors ${
                projectMeta.minReviewers && data.evaluatorCount < projectMeta.minReviewers
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-transparent focus:border-[#F77019]'
              }`}
            />
            <span className="text-[11px] font-bold text-[#666]">명</span>
          </div>

          {/* 빠른 선택 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-[#999] font-bold">빠른 선택:</span>
            {[10, 20, 30, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ evaluatorCount: n })}
                className={`px-2.5 h-6 rounded-full text-[9px] font-black transition-colors ${
                  data.evaluatorCount === n
                    ? 'bg-[#F77019] text-white'
                    : 'bg-white border border-[#1D1C1C]/10 text-[#666] hover:border-[#F77019] hover:text-[#F77019]'
                }`}
              >
                {n}명
              </button>
            ))}
          </div>

          {/* 최소값 미달 경고 */}
          {projectMeta.minReviewers && data.evaluatorCount < projectMeta.minReviewers && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">!</span>
              <p className="text-[10px] font-bold text-red-600">
                {projectMeta.title}는 최소 {projectMeta.minReviewers}명이 필요합니다. 현재 {data.evaluatorCount}명 — 다음 단계로 진행할 수 없습니다.
              </p>
            </div>
          )}
        </div>
      </Field>

      {/* 1인당 사례금 */}
      <Field label="1인당 사례금" hint="Creator 자율 설정 · 수수료 15%는 Reviewer 수령액에서 차감">
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
        <p className="text-[10px] text-[#999] font-bold mt-1">
          평가단 실 수령: <span className="text-[#1D1C1C]">{fmt(cost.reviewerNetPerPerson)}원/명</span> (1인당 사례금 {fmt(data.feePerEvaluator)}원 × 85%)
        </p>
      </Field>

      {/* 완료 기한 — Deep는 체험기간 + 평가작성 기간 합산 표시 */}
      <Field
        label="리뷰 완료 기한"
        hint={data.projectType === 'deep' ? '체험 기간 + 평가 작성 기간 합산' : '등록일부터 최대 10일'}
      >
        <div className="grid grid-cols-3 gap-2">
          {[5, 7, 10].map((d) => {
            const active = data.deadlineDays === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ deadlineDays: d })}
                className={`h-10 rounded-xl text-[11px] font-black transition-colors ${
                  active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                }`}
              >
                {d}일
              </button>
            )
          })}
        </div>

        {/* Deep — 체험기간 + 평가작성 기간 브레이크다운 */}
        {data.projectType === 'deep' && (
          <DeepDeadlineBreakdownBox
            experienceHours={data.experienceDeadline}
            totalDays={data.deadlineDays}
          />
        )}
      </Field>

      {/* 원하는 평가단 직군 — 매칭 기준 */}
      <Field label="원하는 평가단 직군" hint="복수 선택 가능 · 해당 직군 리뷰어에게 추천 노출">
        <div className="flex items-center gap-2 flex-wrap">
          {TARGET_REVIEWER_ROLES.map((role) => {
            const active = data.targetReviewerRoles.includes(role)
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  const next = active
                    ? data.targetReviewerRoles.filter((r) => r !== role)
                    : [...data.targetReviewerRoles, role]
                  onChange({ targetReviewerRoles: next })
                }}
                className={`px-4 h-8 rounded-full text-[11px] font-bold transition-colors ${
                  active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                }`}
              >
                {role}
              </button>
            )
          })}
        </div>
        {data.targetReviewerRoles.length === 0 && (
          <p className="text-[10px] text-[#999] font-bold mt-1">
            미선택 시 전체 리뷰어에게 노출됩니다 (추천 가중치 없음)
          </p>
        )}
      </Field>

      {/* 배분 방식 */}
      <Field label="사례금 배분 방식" hint="리뷰 완료 후 적용">
        <div className="grid grid-cols-1 gap-2">
          {DISTRIBUTION_OPTIONS.map((opt) => {
            const active = data.distributionMethod === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ distributionMethod: opt.value as DistributionMethod })}
                className={`flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-[11px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{opt.label}</span>
                  <span className={`text-[9px] mt-0.5 ${active ? 'text-[#F77019]/70' : 'text-[#999]'}`}>{opt.desc}</span>
                </div>
                {active && (
                  <div className="w-4 h-4 rounded-full bg-[#F77019] flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Field>

      {/* AI 리포트 안내 (레벨 기반 자동) */}
      <div className="rounded-xl bg-[#1565C0]/5 border border-[#1565C0]/15 p-3 flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 text-[#1565C0] flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-[#1565C0]">AI 리포트 자동 적용 — Builder 레벨</span>
          <span className="text-[10px] font-bold text-[#1565C0]/80">
            Claude Sonnet 기반 심층 리포트 무료 제공 · Sean Ellis 스코어 첫 지표로 표시
          </span>
        </div>
      </div>

      {/* 비용 요약 */}
      <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-5 flex flex-col gap-3">
        <h3 className="text-[12px] font-black">비용 요약</h3>

        <div className="flex flex-col gap-2 text-[11px] font-bold">
          <Row label={`캐시 차감 (1,800C × ${data.evaluatorCount}명)`} value={`${fmt(cost.cashCost)}C`} />
          <Row label="잔여 캐시" value={`${fmt(remainingCash)}C`} valueClass={insufficientCash ? 'text-red-500' : 'text-[#666]'} />

          <div className="h-[1px] bg-[#EEEEEE] my-1" />

          <Row label={`사전 승인액 (${fmt(data.feePerEvaluator)}원 × ${data.evaluatorCount}명)`} value={`${fmt(cost.preAuthAmount)}원`} />
          <div className="flex items-center justify-between text-[10px] font-medium text-[#999]">
            <span>└ 평가단 실 수령</span>
            <span>{fmt(cost.reviewerNetPerPerson)}원/명 × {data.evaluatorCount} = {fmt(cost.reviewerNetPerPerson * data.evaluatorCount)}원</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium text-[#999]">
            <span>└ FindFit 수수료 ({Math.round(REVIEWER_COMMISSION_RATE * 100)}%, Reviewer 차감)</span>
            <span>{fmt(cost.platformCommissionTotal)}원</span>
          </div>

          <div className="h-[1px] bg-[#EEEEEE] my-1" />

          <div className="rounded-lg bg-[#F77019]/5 border border-[#F77019]/15 px-3 py-2 mt-1">
            <p className="text-[10px] font-bold text-[#F77019] leading-relaxed">
              💡 사전 승인은 카드 잠금 (실제 출금 X). 리뷰 완료 후 PortOne 캡처 시점에 실제 청구되며,
              미완료분은 자동 잠금 해제됩니다.
            </p>
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

/* ─────────────────────────────────────────────────────── */
/*  Deep — 체험기간 + 평가작성 기간 브레이크다운                */
/* ─────────────────────────────────────────────────────── */

function DeepDeadlineBreakdownBox({
  experienceHours,
  totalDays,
}: {
  experienceHours: number
  totalDays: number
}) {
  const breakdown = calculateDeepDeadline(experienceHours, totalDays)
  const expPct = (breakdown.experienceDays / breakdown.totalDays) * 100
  const reviewPct = Math.max(0, (breakdown.reviewWritingDays / breakdown.totalDays) * 100)

  return (
    <div
      className={`rounded-xl p-3 flex flex-col gap-2 mt-2 border ${
        breakdown.isValid ? 'bg-[#F5F5F5] border-[#1D1C1C]/5' : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-[#666]">기간 분할</span>
        <span className={breakdown.isValid ? 'text-[#1D1C1C]' : 'text-red-600'}>
          체험 {breakdown.experienceDays}일 + 평가 작성 {breakdown.reviewWritingDays}일 = 총 {breakdown.totalDays}일
        </span>
      </div>

      {/* 시각화 바 */}
      <div className="w-full h-2 rounded-full bg-white overflow-hidden flex">
        <div className="h-full bg-[#1565C0]" style={{ width: `${expPct}%` }} />
        <div className="h-full bg-[#F77019]" style={{ width: `${reviewPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[9px] font-bold">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#1565C0]" />
          <span className="text-[#1565C0]">
            체험 ({experienceHours}h ≈ {breakdown.experienceDays}일)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#F77019]" />
          <span className="text-[#F77019]">평가 작성 ({breakdown.reviewWritingDays}일)</span>
        </div>
      </div>

      {!breakdown.isValid && (
        <p className="text-[10px] font-bold text-red-600 leading-relaxed mt-1">
          ⚠ 평가 작성 시간이 1일 미만입니다. 리뷰 완료 기한을 늘리거나 체험 기간을 줄여주세요.
        </p>
      )}
    </div>
  )
}
