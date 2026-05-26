'use client'

import QuestionBuilder from './QuestionBuilder'
import { SEAN_ELLIS_QUESTION, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step4Survey({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* 공통 영역 — 검증 목표 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black">검증 내용</h2>
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">설문형</span>
        </div>

        <Textarea
          label="이번 검증으로 알고 싶은 것"
          hint={`${data.validationGoal.length}/100`}
          max={100}
          rows={2}
          value={data.validationGoal}
          placeholder="어떤 의사결정을 위해 검증하나요? 예: 출시 여부 결정 / 기능 우선순위"
          onChange={(v) => onChange({ validationGoal: v })}
        />

        <Textarea
          label="검증 가설"
          hint="템플릿 권장"
          max={300}
          rows={3}
          value={data.hypothesis}
          placeholder="우리는 [타겟]이 [솔루션] 때문에 [결과]를 원한다고 가정한다"
          onChange={(v) => onChange({ hypothesis: v })}
        />
      </div>

      {/* 설문형 전용 — 질문 빌더 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black">질문 설계</h3>
          <p className="text-[10px] text-[#999] font-bold">
            평가단이 제품 설명을 읽고 바로 답변할 질문을 작성하세요. Sean Ellis Test 1개가 자동 포함되어 최대 9개까지 작성 가능.
          </p>
        </div>

        <QuestionBuilder
          questions={data.questions}
          onChange={(qs) => onChange({ questions: qs })}
          max={9}
          showFixed={SEAN_ELLIS_QUESTION}
        />
      </div>
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
