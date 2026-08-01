'use client'

import { Lock, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
  likert_5: '리커트 5점',
  ab_test: 'A/B 테스트',
  keyword: '키워드 선택',
  yes_no: '예/아니오',
  sean_ellis: 'Sean Ellis',
}

const TYPE_HINTS: Record<QuestionType, string> = {
  multiple_choice: '여러 선택지 중 1개 선택',
  short_answer: '평가단이 자유롭게 답변 작성',
  likert: '1점(전혀) ~ 5점(매우)',
  likert_5: '1점(전혀) ~ 5점(매우)',
  ab_test: '두 옵션 중 하나를 선택 (이미지·텍스트·카드)',
  keyword: '제시된 키워드 중 해당하는 것 선택 (최대 10개)',
  yes_no: '단순 이진 선택',
  sean_ellis: 'Sean Ellis Test 자동 포함',
}

export default function QuestionBuilder({ questions, onChange, max, allowedTypes, showFixed }: Props) {
  const writable = questions.filter((q) => !q.isFixed)
  const remaining = max - writable.length
  // 질문 문구를 다 적고 포커스를 벗어나면(onBlur), 코드 자동완성처럼 다음에
  // 올 선지를 옅게 placeholder로 미리 보여준다(qid → 제안 배열).
  const [ghostOptions, setGhostOptions] = useState<Record<string, string[]>>({})
  const [fetchingGhost, setFetchingGhost] = useState<string | null>(null)

  // optionCount를 별도로 받는 이유 — "+ 선택지 추가"로 슬롯을 늘린
  // 직후에는 q.options.length가 이미 새 길이라, 늘어난 개수만큼 다시
  // 요청해야 새로 추가된 슬롯에도 제안이 채워진다.
  const fetchGhostOptionsFor = async (q: Question, optionCount: number) => {
    if (!q.text.trim()) return
    setFetchingGhost(q.id)
    try {
      const res = await fetch('/api/questions/suggest-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: q.text, questionType: q.type, optionCount }),
      })
      if (res.ok) {
        const body = await res.json()
        if (body.options?.length) setGhostOptions((prev) => ({ ...prev, [q.id]: body.options }))
      }
    } finally {
      setFetchingGhost(null)
    }
  }

  const fetchGhostOptions = async (q: Question) => {
    if (!q.options) return
    if (q.options.some((o) => o.trim())) return // 이미 뭔가 채워져 있으면 제안 안 함
    await fetchGhostOptionsFor(q, q.options.length)
  }

  const applyGhostOptions = (qid: string) => {
    const ghosts = ghostOptions[qid]
    if (!ghosts) return
    const q = writable.find((x) => x.id === qid)
    if (!q || !q.options) return
    const next = q.options.map((o, i) => (o.trim() ? o : ghosts[i] ?? o))
    updateQuestion(qid, { options: next })
    setGhostOptions((prev) => { const n = { ...prev }; delete n[qid]; return n })
  }

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
    const newOptions = [...q.options, '']
    updateQuestion(qid, { options: newOptions })
    if (focusNew) {
      // the new input doesn't exist in the DOM until this render commits
      requestAnimationFrame(() => document.getElementById(`opt-${qid}-${newIndex}`)?.focus())
    }
    // 이 질문에 대해 이미 AI 제안 선지를 받아본 적 있으면(ghostOptions에
    // 캐시돼 있으면), 새로 추가된 슬롯에는 제안이 없어서 그 슬롯만 비어
    // 보이던 문제 — 늘어난 개수 기준으로 다시 요청해서 새 슬롯도 채운다.
    if (ghostOptions[qid]) {
      fetchGhostOptionsFor({ ...q, options: newOptions }, newOptions.length)
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

      {/* 작성된 질문들 — 세로로 끝없이 쌓이지 않도록 그리드로 배치 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        {writable.map((q, i) => (
          <div key={q.id} className="rounded-xl bg-[#F5F5F5] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">Q{i + 1}</span>
                <span className="text-[10px] font-bold text-[#666]">{TYPE_LABELS[q.type]}</span>
                {q.type === 'multiple_choice' && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none pl-1.5 ml-1 border-l border-[#1D1C1C]/10">
                    <input
                      type="checkbox"
                      checked={Boolean(q.allowMultiple)}
                      onChange={(e) => updateQuestion(q.id, { allowMultiple: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#F77019]"
                    />
                    <span className="text-[9px] font-bold text-[#666] whitespace-nowrap">복수 선택 허용</span>
                  </label>
                )}
              </div>
              <button type="button" onClick={() => removeQuestion(q.id)} className="text-[#999] hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              onBlur={() => fetchGhostOptions(q)}
              placeholder="질문을 입력하세요"
              className="w-full h-9 rounded-lg bg-white border-none outline-none px-3 text-[11px]"
            />

            {/* 객관식 / A/B / 키워드: 선택지 입력 */}
            {(q.type === 'multiple_choice' || q.type === 'ab_test' || q.type === 'keyword') && q.options && (
              <div className="flex flex-col gap-2 pl-2">
                {fetchingGhost === q.id && (
                  <span className="text-[9px] font-bold text-[#999] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-pulse" /> AI가 선지를 준비하고 있어요...
                  </span>
                )}
                {ghostOptions[q.id] && (
                  <button
                    type="button"
                    onClick={() => applyGhostOptions(q.id)}
                    className="self-start flex items-center gap-1 text-[9px] font-black text-[#F77019] bg-[#F77019]/8 px-2 py-1 rounded-lg hover:bg-[#F77019]/15 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" /> AI 제안 선지로 채우기 (Tab으로 하나씩도 가능)
                  </button>
                )}
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
                        if (e.key === 'Tab' && !opt.trim() && ghostOptions[q.id]?.[idx]) {
                          e.preventDefault()
                          updateOption(q.id, idx, ghostOptions[q.id][idx])
                          document.getElementById(`opt-${q.id}-${idx + 1}`)?.focus()
                          return
                        }
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
                        ghostOptions[q.id]?.[idx] ??
                        (q.type === 'ab_test' ? `옵션 ${idx + 1}` : q.type === 'keyword' ? `키워드 ${idx + 1}` : `선택지 ${idx + 1}`)
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
