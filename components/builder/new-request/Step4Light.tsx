'use client'

import { Check, GitCompare, ListChecks, ToggleRight } from 'lucide-react'
import QuestionBuilder from './QuestionBuilder'
import { LIGHT_MAX_QUESTIONS, type LightQuestionStyle, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

const STYLE_CARDS: {
  value: LightQuestionStyle
  title: string
  desc: string
  example: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    value: 'ab_test',
    title: 'A/B 테스트',
    desc: '두 옵션 중 하나 선택',
    example: '예: A안과 B안 중 어느 디자인이 더 매력적인가요?',
    icon: GitCompare,
  },
  {
    value: 'keyword',
    title: '키워드 선택',
    desc: '제시한 키워드 중 해당하는 것 선택',
    example: '예: 다음 중 이 제품에 어울리는 키워드를 모두 골라주세요',
    icon: ListChecks,
  },
  {
    value: 'yes_no',
    title: '예/아니오',
    desc: '단순 이진 선택',
    example: '예: 이 제품에 한 달 9,900원을 지불할 의향이 있나요?',
    icon: ToggleRight,
  },
]

export default function Step4Light({ data, onChange }: Props) {
  const selectStyle = (style: LightQuestionStyle) => {
    if (data.lightQuestionStyle === style) return

    // 이전에 다른 스타일로 작성한 질문이 있으면 사용자 확인
    const hasExistingQuestions = data.lightQuestionStyle !== null && data.questions.length > 0
    if (hasExistingQuestions) {
      const ok = typeof window !== 'undefined'
        ? window.confirm(
            `질문 스타일을 변경하면 작성된 ${data.questions.length}개 질문이 삭제됩니다. 계속하시겠습니까?`,
          )
        : true
      if (!ok) return
    }

    onChange({ lightQuestionStyle: style, questions: hasExistingQuestions ? [] : data.questions })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 공통 영역 — 검증 목표 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black">검증 내용</h2>
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Light</span>
        </div>

        <Textarea
          label="이번 검증으로 알고 싶은 것"
          hint={`${data.validationGoal.length}/100`}
          max={100}
          rows={2}
          value={data.validationGoal}
          placeholder="어떤 의사결정을 위해 검증하나요? 예: A안과 B안 중 어느 쪽 반응이 더 좋은지"
          onChange={(v) => onChange({ validationGoal: v })}
        />
      </div>

      {/* 질문 스타일 선택 — 항상 3개 카드 노출 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black">질문 스타일 선택</h3>
          <p className="text-[10px] text-[#999] font-bold">
            Light는 한 프로젝트에 하나의 질문 스타일만 사용합니다. 다른 스타일로 바꾸고 싶으면 카드를 클릭하세요.
            (작성된 질문이 있으면 확인 후 초기화됩니다)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {STYLE_CARDS.map((c) => {
            const Icon = c.icon
            const active = data.lightQuestionStyle === c.value
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => selectStyle(c.value)}
                className={`relative flex flex-col gap-3 p-5 rounded-2xl border transition-all text-left ${
                  active
                    ? 'bg-[#F77019]/5 border-[#F77019] shadow-[0_4px_14px_rgba(247,112,25,0.12)]'
                    : 'bg-[#F5F5F5] border-transparent hover:border-[#F77019]/40 hover:bg-[#F77019]/3'
                }`}
              >
                {/* "현재 선택" 배지 */}
                {active && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F77019] text-white text-[9px] font-black">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    현재 선택
                  </span>
                )}

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    active ? 'bg-[#F77019] text-white' : 'bg-white text-[#F77019]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-[13px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>
                    {c.title}
                  </span>
                  <span className="text-[10px] font-bold text-[#666] leading-relaxed">{c.desc}</span>
                </div>
                <span className="text-[9px] font-medium text-[#999] leading-snug border-t border-[#1D1C1C]/5 pt-2 mt-auto">
                  {c.example}
                </span>
              </button>
            )
          })}
        </div>

        {!data.lightQuestionStyle && (
          <div className="rounded-xl bg-[#1565C0]/5 border border-[#1565C0]/15 p-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#1565C0]">
              ⬆ 위에서 스타일을 먼저 선택하세요. 선택한 스타일로 질문을 추가할 수 있습니다.
            </span>
          </div>
        )}
      </div>

      {/* 스타일 선택 후 — 질문 빌더 */}
      {data.lightQuestionStyle && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black">
              {STYLE_CARDS.find((c) => c.value === data.lightQuestionStyle)?.title} 질문 작성
            </h3>
            <p className="text-[10px] text-[#999] font-bold">
              {Number.isFinite(LIGHT_MAX_QUESTIONS) ? `최대 ${LIGHT_MAX_QUESTIONS}개` : '무제한'} (Sean Ellis 미포함)
            </p>
          </div>

          <QuestionBuilder
            questions={data.questions}
            onChange={(qs) => onChange({ questions: qs })}
            max={LIGHT_MAX_QUESTIONS}
            allowedTypes={[data.lightQuestionStyle]}
          />
        </div>
      )}
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
