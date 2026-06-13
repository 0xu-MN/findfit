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
        placeholder="타겟이 어떤 상황에서 겪는 구체적 불편 — 상황·빈도·감정까지 같이 적어주세요"
        onChange={(v) => onChange({ problem: v })}
      />

      <Textarea
        label="기존 대안과 한계"
        hint={`${data.alternativeAndLimit.length}/150`}
        max={150}
        rows={3}
        value={data.alternativeAndLimit}
        placeholder="지금 사람들이 어떻게 해결하는지 + 그 방법의 단점"
        onChange={(v) => onChange({ alternativeAndLimit: v })}
      />

      <Textarea
        label="우리 솔루션이 다른 점"
        hint={`${data.ourDifference.length}/150`}
        max={150}
        rows={3}
        value={data.ourDifference}
        placeholder='"더 빠르다"보다 구체적으로 — 어떤 방식으로 다른가요?'
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
