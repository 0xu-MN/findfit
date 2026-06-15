'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { getPsfPmfType } from '@/lib/utils/psfPmf'
import PsfLockedBlock from './PsfLockedBlock'
import QuestionBuilder from './QuestionBuilder'
import { generateId } from './storage'
import { PSF_MAX_WRITABLE, SEAN_ELLIS_QUESTION, STD_DEEP_MAX_WRITABLE, type Question, type RequestFormData } from './types'

type QuestionSuggestion = {
  question_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'likert_5'
  options: string[] | null
}

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step4Standard({ data, onChange }: Props) {
  const psfPmfType = data.stage ? getPsfPmfType(data.stage) : 'pmf'
  const isPsf = psfPmfType === 'psf'
  const maxWritable = isPsf ? PSF_MAX_WRITABLE : STD_DEEP_MAX_WRITABLE
  const remaining = maxWritable - data.questions.filter((q) => !q.isFixed).length

  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([])
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchSuggestions = async () => {
    setLoadingSuggest(true)
    setSuggestions([])
    try {
      // projectId가 없는 draft 단계이므로 data를 직접 body로 전달
      const res = await fetch('/api/questions/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            title: data.productName,
            one_liner: data.oneLineDesc,
            category: data.categories[0] ?? '',
            stage: data.stage ?? '',
            problem: data.problem,
            solution: data.ourDifference,
            target_jobs: data.jobRoles,
            target_age_range: data.ageGroups.join(', '),
            project_type: data.projectType,
          },
          psf_pmf_type: psfPmfType,
          existing_count: data.questions.filter((q) => !q.isFixed).length,
          remaining_slots: remaining,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setSuggestions(json.suggestions ?? [])
      }
    } finally {
      setLoadingSuggest(false)
    }
  }

  const addSuggestion = (s: QuestionSuggestion) => {
    if (remaining <= 0) { showToast('질문을 더 추가할 수 없어요 (최대 초과)'); return }
    const q: Question = {
      id: generateId('ai'),
      type: s.question_type === 'likert_5' ? 'likert' : s.question_type,
      text: s.question_text,
      options: s.options ?? undefined,
    }
    onChange({ questions: [...data.questions.filter((x) => !x.isFixed), q] })
    setSuggestions((prev) => prev.filter((x) => x.question_text !== s.question_text))
  }

  const addAll = () => {
    const slots = remaining
    if (slots <= 0) { showToast('질문을 더 추가할 수 없어요 (최대 초과)'); return }
    const toAdd = suggestions.slice(0, slots)
    const skipped = suggestions.length - toAdd.length
    const newQs: Question[] = toAdd.map((s) => ({
      id: generateId('ai'),
      type: s.question_type === 'likert_5' ? 'likert' : s.question_type,
      text: s.question_text,
      options: s.options ?? undefined,
    }))
    onChange({ questions: [...data.questions.filter((x) => !x.isFixed), ...newQs] })
    setSuggestions([])
    if (skipped > 0) showToast(`최대 개수를 초과해서 ${toAdd.length}개만 추가했어요`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 공통 영역 — 검증 목표 + 가설 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black">검증 내용</h2>
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Standard</span>
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

      {/* Standard 질문 빌더 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black">질문 설계</h3>
            <p className="text-[10px] text-[#999] font-bold">
              평가단이 제품 설명을 읽고 바로 답변할 질문. 핵심 질문 자동 포함 · 작성 가능 최대 {maxWritable}개
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSuggestions}
            disabled={loadingSuggest || remaining <= 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#F77019] text-[#F77019] text-[11px] font-black hover:bg-[#F77019]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingSuggest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI 추천 질문 받기
          </button>
        </div>

        {/* AI 추천 질문 카드 목록 */}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#F77019]/20 bg-[#F77019]/3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#F77019]">✨ AI 추천 질문 ({suggestions.length}개)</span>
              <button
                type="button"
                onClick={addAll}
                className="h-7 px-3 rounded-lg bg-[#F77019] text-white text-[10px] font-black hover:opacity-90"
              >
                추천 전체 추가
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-[#1D1C1C]/8 p-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded w-fit">
                      {s.question_type === 'multiple_choice' ? '객관식' : s.question_type === 'short_answer' ? '주관식' : '리커트 5점'}
                    </span>
                    <p className="text-[11px] font-bold text-[#1D1C1C]">{s.question_text}</p>
                    {s.options && (
                      <p className="text-[10px] text-[#999] font-bold">{s.options.slice(0, 2).join(' / ')}{s.options.length > 2 ? ' ...' : ''}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSuggestion(s)}
                    className="h-7 px-3 rounded-lg border border-[#F77019] text-[#F77019] text-[10px] font-black hover:bg-[#F77019]/5 shrink-0"
                  >
                    + 추가하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <QuestionBuilder
          questions={data.questions}
          onChange={(qs) => onChange({ questions: qs })}
          max={maxWritable}
          allowedTypes={['multiple_choice', 'short_answer', 'likert']}
          showFixed={isPsf ? undefined : SEAN_ELLIS_QUESTION}
        />
        {isPsf && <PsfLockedBlock />}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-bold shadow-lg z-50">
          {toast}
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
