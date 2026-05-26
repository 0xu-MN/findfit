'use client'

import type { RequestFormData } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step2Problem({ data, onChange }: Props) {
  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black">문제 · 솔루션</h2>
        <p className="text-[10px] text-[#999] font-bold">검증 가설을 정리하기 위한 컨텍스트입니다</p>
      </div>

      <Textarea
        label="어떤 문제를 해결하나요?"
        hint={`${data.problem.length}/200`}
        max={200}
        rows={4}
        value={data.problem}
        placeholder="타겟 고객이 어떤 상황에서 겪는 불편인지 구체적으로 서술"
        onChange={(v) => onChange({ problem: v })}
      />

      <Textarea
        label="지금 사람들은 이 문제를 어떻게 해결하나요?"
        hint={`${data.currentSolution.length}/150`}
        max={150}
        rows={3}
        value={data.currentSolution}
        placeholder="기존 대안과 방법"
        onChange={(v) => onChange({ currentSolution: v })}
      />

      <Textarea
        label="기존 대안의 한계"
        hint={`${data.alternativeLimit.length}/100`}
        max={100}
        rows={2}
        value={data.alternativeLimit}
        placeholder="왜 기존 방법이 불충분한지"
        onChange={(v) => onChange({ alternativeLimit: v })}
      />

      <Textarea
        label="우리 솔루션이 다른 점"
        hint={`${data.ourDifference.length}/150`}
        max={150}
        rows={3}
        value={data.ourDifference}
        placeholder="'더 빠르다'보다 구체적으로 — 어떤 방식으로 다른가"
        onChange={(v) => onChange({ ourDifference: v })}
      />
    </div>
  )
}

function Textarea({
  label,
  hint,
  max,
  rows,
  value,
  placeholder,
  onChange,
}: {
  label: string
  hint: string
  max: number
  rows: number
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold">{label}</label>
        <span className="text-[9px] text-[#999] font-bold">{hint}</span>
      </div>
      <textarea
        rows={rows}
        maxLength={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[#F5F5F5] border-none outline-none px-4 py-3 text-[11px] resize-none leading-relaxed"
      />
    </div>
  )
}
