'use client'

import { Lock, Plus, Trash2 } from 'lucide-react'
import { generateId } from './storage'
import type { Question, QuestionType } from './types'

type Props = {
  questions: Question[]
  onChange: (next: Question[]) => void
  max: number
  showFixed?: Question
}

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple: '객관식',
  text: '주관식',
  likert: '리커트 5점',
}

export default function QuestionBuilder({ questions, onChange, max, showFixed }: Props) {
  const writable = questions.filter((q) => !q.isFixed)
  const remaining = max - writable.length

  const addQuestion = (type: QuestionType) => {
    if (remaining <= 0) return
    const next: Question = {
      id: generateId('q'),
      type,
      text: '',
      options: type === 'multiple' ? ['', ''] : undefined,
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

  const addOption = (qid: string) => {
    const q = writable.find((x) => x.id === qid)
    if (!q || !q.options) return
    if (q.options.length >= 6) return
    updateQuestion(qid, { options: [...q.options, ''] })
  }

  const removeOption = (qid: string, idx: number) => {
    const q = writable.find((x) => x.id === qid)
    if (!q || !q.options || q.options.length <= 2) return
    updateQuestion(qid, { options: q.options.filter((_, i) => i !== idx) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold">질문 목록</span>
        <span className="text-[9px] text-[#999] font-bold">최대 {max}개 · 남은 {remaining}개</span>
      </div>

      {/* 작성한 질문들 */}
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

            {q.type === 'multiple' && q.options && (
              <div className="flex flex-col gap-2 pl-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#999] w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(q.id, idx, e.target.value)}
                      placeholder={`선택지 ${idx + 1}`}
                      className="flex-1 h-8 rounded-lg bg-white border-none outline-none px-3 text-[11px]"
                    />
                    {q.options!.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(q.id, idx)}
                        className="text-[#999] hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="self-start text-[10px] font-bold text-[#F77019] hover:underline mt-1 ml-6"
                  >
                    + 선택지 추가
                  </button>
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

            {q.type === 'text' && (
              <div className="pl-2 text-[10px] text-[#999] font-bold">평가단이 자유롭게 답변 작성</div>
            )}
          </div>
        ))}
      </div>

      {/* 질문 추가 버튼들 */}
      {remaining > 0 && (
        <div className="flex items-center gap-2">
          {(['multiple', 'text', 'likert'] as QuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addQuestion(t)}
              className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl border border-dashed border-[#1D1C1C]/15 text-[11px] font-bold text-[#666] hover:border-[#F77019] hover:text-[#F77019] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {/* Sean Ellis 고정 질문 */}
      {showFixed && (
        <div className="rounded-xl border border-[#F77019]/30 bg-[#F77019]/5 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#F77019]" />
            <span className="text-[10px] font-black text-[#F77019]">Sean Ellis Test · 자동 포함 (삭제·수정 불가)</span>
          </div>
          <p className="text-[11px] font-bold text-[#1D1C1C]">{showFixed.text}</p>
          <ul className="text-[10px] text-[#666] font-bold pl-3 flex flex-col gap-0.5">
            {showFixed.options?.map((o, i) => <li key={i}>· {o}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
