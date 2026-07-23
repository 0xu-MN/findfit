'use client'

import { Lock, Plus, Trash2 } from 'lucide-react'
import { SEAN_ELLIS_DESC } from '@/lib/constants/plainLanguage'
import { generateId } from './storage'
import type { Question, QuestionType } from './types'

type Props = {
  questions: Question[]
  onChange: (next: Question[]) => void
  max: number
  allowedTypes: QuestionType[]
  showFixed?: Question
}

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '주관식',
  likert: '리커트 5점',
  ab_test: 'A/B 테스트',
  keyword: '키워드 선택',
  yes_no: '예/아니오',
  sean_ellis: 'Sean Ellis',
}

const TYPE_HINTS: Record<QuestionType, string> = {
  multiple_choice: '여러 선택지 중 1개 선택',
  short_answer: '평가단이 자유롭게 답변 작성',
  likert: '1점(전혀) ~ 5점(매우)',
  ab_test: '두 옵션 중 하나를 선택 (이미지·텍스트·카드)',
  keyword: '제시된 키워드 중 해당하는 것 선택 (최대 10개)',
  yes_no: '단순 이진 선택',
  sean_ellis: 'Sean Ellis Test 자동 포함',
}

export default function QuestionBuilder({ questions, onChange, max, allowedTypes, showFixed }: Props) {
  const writable = questions.filter((q) => !q.isFixed)
  const remaining = max - writable.length

  const addQuestion = (type: QuestionType) => {
    if (remaining <= 0) return
    const next: Question = {
      id: generateId('q'),
      type,
      text: '',
      options:
        type === 'multiple_choice' || type === 'ab_test'
          ? ['', '']
          : type === 'keyword'
            ? ['', '', '']
            : undefined,
    }
    onChange([...writable, next])
  }

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    onChange(writable.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const removeQuestion = (id: string) => onChange(writable.filter((q) => q.id !== id))

  const updateOption = (qid: string, idx: number, val: string) => {
    const q = writable.find((x) => x.id === qid)
    if (!q || !q.options) return
    const next = [...q.options]
    next[idx] = val
    updateQuestion(qid, { options: next })
  }

  const addOption = (qid: string, focusNew = false) => {
    const q = writable.find((x) => x.id === qid)
    if (!q || !q.options) return
    const maxOptions = q.type === 'ab_test' ? 2 : q.type === 'keyword' ? 10 : 6
    if (q.options.length >= maxOptions) return
    const newIndex = q.options.length
    updateQuestion(qid, { options: [...q.options, ''] })
    if (focusNew) {
      // the new input doesn't exist in the DOM until this render commits
      requestAnimationFrame(() => document.getElementById(`opt-${qid}-${newIndex}`)?.focus())
    }
  }

  const removeOption = (qid: string, idx: number) => {
    const q = writable.find((x) => x.id === qid)
    if (!q || !q.options) return
    const minOptions = q.type === 'keyword' ? 2 : 2
    if (q.options.length <= minOptions) return
    updateQuestion(qid, { options: q.options.filter((_, i) => i !== idx) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold">질문 목록</span>
        <span className="text-[9px] text-[#999] font-bold">
          {Number.isFinite(max) ? `최대 ${max}개 · 남은 ${remaining}개` : '무제한'}
        </span>
      </div>

      {/* 작성된 질문들 */}
      <div className="flex flex-col gap-3">
        {writable.map((q, i) => (
          <div key={q.id} className="rounded-xl bg-[#F5F5F5] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">Q{i + 1}</span>
                <span className="text-[10px] font-bold text-[#666]">{TYPE_LABELS[q.type]}</span>
              </div>
              <button type="button" onClick={() => removeQuestion(q.id)} className="text-[#999] hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              placeholder="질문을 입력하세요"
              className="w-full h-9 rounded-lg bg-white border-none outline-none px-3 text-[11px]"
            />

            {/* 객관식 / A/B / 키워드: 선택지 입력 */}
            {(q.type === 'multiple_choice' || q.type === 'ab_test' || q.type === 'keyword') && q.options && (
              <div className="flex flex-col gap-2 pl-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#999] w-4">{idx + 1}.</span>
                    <input
                      id={`opt-${q.id}-${idx}`}
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(q.id, idx, e.target.value)}
                      onKeyDown={(e) => {
                        // Enter on the last option row adds (and jumps into) a
                        // new one, so typing several options in a row doesn't
                        // need a mouse click on "+ 옵션 추가" between each one.
                        if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
                        e.preventDefault()
                        const isLast = idx === q.options!.length - 1
                        if (isLast && q.type !== 'ab_test') {
                          addOption(q.id, true)
                        } else {
                          document.getElementById(`opt-${q.id}-${idx + 1}`)?.focus()
                        }
                      }}
                      placeholder={
                        q.type === 'ab_test' ? `옵션 ${idx + 1}` : q.type === 'keyword' ? `키워드 ${idx + 1}` : `선택지 ${idx + 1}`
                      }
                      className="flex-1 h-8 rounded-lg bg-white border-none outline-none px-3 text-[11px]"
                    />
                    {q.options!.length > 2 && (
                      <button type="button" onClick={() => removeOption(q.id, idx)} className="text-[#999] hover:text-red-500 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {/* + 옵션 추가 (A/B는 2개 고정) */}
                {q.type !== 'ab_test' && (
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="self-start text-[10px] font-bold text-[#F77019] hover:underline mt-1 ml-6"
                  >
                    + {q.type === 'keyword' ? '키워드' : '선택지'} 추가
                  </button>
                )}

                {/* 객관식만 — 복수 선택 허용 여부 */}
                {q.type === 'multiple_choice' && (
                  <label className="flex items-center gap-2 mt-1 ml-6 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(q.allowMultiple)}
                      onChange={(e) => updateQuestion(q.id, { allowMultiple: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#F77019]"
                    />
                    <span className="text-[10px] font-bold text-[#666]">
                      복수 선택 허용 (체크박스로 여러 개 고를 수 있게)
                    </span>
                  </label>
                )}
              </div>
            )}

            {q.type === 'likert' && (
              <div className="flex items-center gap-2 pl-2 text-[10px] text-[#999] font-bold">
                <span>1점 (전혀)</span>
                <div className="flex-1 h-[1px] bg-[#EEEEEE]" />
                <span>5점 (매우)</span>
              </div>
            )}

            {q.type === 'short_answer' && (
              <div className="pl-2 text-[10px] text-[#999] font-bold">{TYPE_HINTS.short_answer}</div>
            )}

            {q.type === 'yes_no' && (
              <div className="flex items-center gap-2 pl-2">
                <span className="px-3 py-1 rounded-lg bg-white text-[10px] font-bold text-[#666]">예</span>
                <span className="px-3 py-1 rounded-lg bg-white text-[10px] font-bold text-[#666]">아니오</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 질문 추가 버튼들 — allowedTypes 기반 */}
      {remaining > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {allowedTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addQuestion(t)}
              className="flex flex-col items-start gap-0.5 p-3 rounded-xl border border-dashed border-[#1D1C1C]/15 text-left hover:border-[#F77019] hover:bg-[#F77019]/5 transition-colors group"
            >
              <span className="flex items-center gap-1 text-[11px] font-black text-[#666] group-hover:text-[#F77019]">
                <Plus className="w-3 h-3" />
                {TYPE_LABELS[t]}
              </span>
              <span className="text-[9px] font-medium text-[#999] leading-snug">{TYPE_HINTS[t]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sean Ellis 고정 질문 (Standard/Deep만) */}
      {showFixed && (
        <div className="rounded-xl border border-[#F77019]/30 bg-[#F77019]/5 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#F77019]" />
            <span className="text-[10px] font-black text-[#F77019]">만족도 핵심 질문 · 자동 포함 (삭제·수정 불가)</span>
          </div>
          <p className="text-[11px] font-bold text-[#1D1C1C]">{showFixed.text}</p>
          <ul className="text-[10px] text-[#666] font-bold pl-3 flex flex-col gap-0.5">
            {showFixed.options?.map((o, i) => <li key={i}>· {o}</li>)}
          </ul>
          <p className="text-[10px] font-bold text-[#F77019]/70 leading-relaxed mt-1">{SEAN_ELLIS_DESC}</p>
        </div>
      )}
    </div>
  )
}
