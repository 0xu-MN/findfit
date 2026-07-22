'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { AGE_GROUPS, DECISION_FACTORS, JOB_ROLES, OCCUPATIONS, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step3Target({ data, onChange }: Props) {
  const [interestInput, setInterestInput] = useState('')
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([])
  const [loadingSuggest, setLoadingSuggest] = useState(false)

  const toggle = (key: 'ageGroups' | 'occupations' | 'jobRoles', val: string) => {
    const arr = data[key]
    onChange({ [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] } as Partial<RequestFormData>)
  }

  // "활동 상태"에서 일하는 부류(직장인/프리랜서/자영업자/창업자)를 선택했을 때만 직군 입력이 의미 있음
  const showJobRoles = ['직장인', '프리랜서', '자영업자', '창업자'].some((s) => data.occupations.includes(s))

  const addInterest = () => {
    const v = interestInput.trim()
    if (!v) return
    if (data.interests.length >= 5) return
    if (data.interests.includes(v)) {
      setInterestInput('')
      return
    }
    onChange({ interests: [...data.interests, v] })
    setInterestInput('')
  }

  const removeInterest = (v: string) => onChange({ interests: data.interests.filter((i) => i !== v) })

  const fetchInterestSuggestions = async () => {
    setLoadingSuggest(true)
    setInterestSuggestions([])
    try {
      const res = await fetch('/api/interests/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            title: data.productName,
            one_liner: data.oneLineDesc,
            category: data.categories[0] ?? '',
            problem: data.problem,
            solution: data.ourDifference,
          },
          existing: data.interests,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setInterestSuggestions((json.suggestions ?? []).filter((k: string) => !data.interests.includes(k)))
      }
    } finally {
      setLoadingSuggest(false)
    }
  }

  const addInterestValue = (v: string) => {
    if (data.interests.length >= 5 || data.interests.includes(v)) return
    onChange({ interests: [...data.interests, v] })
    setInterestSuggestions((prev) => prev.filter((k) => k !== v))
  }

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black">타겟 고객</h2>
        <p className="text-[10px] text-[#999] font-bold">매칭 알고리즘이 적합한 평가단을 찾는 기준입니다</p>
      </div>

      {/* 연령대 */}
      <Field label="연령대" hint="복수 선택">
        <div className="flex items-center gap-2 flex-wrap">
          {AGE_GROUPS.map((g) => {
            const active = data.ageGroups.includes(g)
            return (
              <Chip key={g} active={active} onClick={() => toggle('ageGroups', g)}>
                {g}
              </Chip>
            )
          })}
        </div>
      </Field>

      {/* 활동 상태 — 고용 형태/현재 무엇을 하고 있는지 */}
      <Field label="활동 상태" hint="복수 선택">
        <div className="flex items-center gap-2 flex-wrap">
          {OCCUPATIONS.map((g) => {
            const active = data.occupations.includes(g)
            return (
              <Chip key={g} active={active} onClick={() => toggle('occupations', g)}>
                {g}
              </Chip>
            )
          })}
        </div>
      </Field>

      {/* 직군 — 활동 상태가 일하는 부류일 때만 의미 있게 노출 */}
      {showJobRoles && (
        <Field label="직군" hint="복수 선택 · 실제 하는 일">
          <div className="flex items-center gap-2 flex-wrap">
            {JOB_ROLES.map((r) => {
              const active = data.jobRoles.includes(r)
              return (
                <Chip key={r} active={active} onClick={() => toggle('jobRoles', r)}>
                  {r}
                </Chip>
              )
            })}
          </div>
        </Field>
      )}

      {/* 관심사 키워드 */}
      <Field label="관심사 키워드" hint={`${data.interests.length}/5`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              // 한글 입력은 마지막 글자를 조합 중일 때 Enter를 누르면 브라우저가
              // 조합 확정용 keydown을 한 번 더 보내는 경우가 있어, 이걸 그대로
              // 처리하면 조합이 끝나지 않은 완성 전 글자(예: "사업계획서" 확정
              // 직후의 "서")가 별도 키워드로 한 번 더 추가돼버린다. isComposing
              // 동안엔 Enter를 무시해서 막는다.
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                addInterest()
              }
            }}
            placeholder="키워드 입력 후 Enter (매칭 알고리즘에 사용)"
            className="flex-1 h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
          />
          <button
            type="button"
            onClick={addInterest}
            className="h-10 px-4 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:opacity-90"
          >
            추가
          </button>
          <button
            type="button"
            onClick={fetchInterestSuggestions}
            disabled={loadingSuggest || data.interests.length >= 5 || !data.productName}
            title={!data.productName ? '1단계 서비스명을 먼저 입력해주세요' : undefined}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[#F77019] text-[#F77019] text-[11px] font-black hover:bg-[#F77019]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loadingSuggest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI 추천
          </button>
        </div>

        {interestSuggestions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {interestSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addInterestValue(tag)}
                className="inline-flex items-center gap-1 px-3 h-7 rounded-full border border-dashed border-[#F77019]/50 text-[#F77019] text-[10px] font-black hover:bg-[#F77019]/5"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}

        {data.interests.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {data.interests.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-[#F77019]/10 text-[#F77019] text-[10px] font-black">
                {tag}
                <button type="button" onClick={() => removeInterest(tag)} className="hover:opacity-70">×</button>
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* 타겟 맥락 */}
      <Field label="타겟이 처한 상황·맥락" hint={`${data.targetContext.length}/100`}>
        <textarea
          rows={2}
          maxLength={100}
          value={data.targetContext}
          onChange={(e) => onChange({ targetContext: e.target.value })}
          placeholder='어떤 순간에 이 제품이 필요한지 — 예: "야근 후 퇴근길 대중교통 안에서"'
          className="w-full rounded-xl bg-[#F5F5F5] border-none outline-none px-4 py-3 text-[11px] resize-none leading-relaxed"
        />
      </Field>

      {/* 결정 요인 */}
      <Field label="구매·사용 결정 요인" hint="복수 선택">
        <div className="flex items-center gap-2 flex-wrap">
          {DECISION_FACTORS.map((d) => {
            const active = data.decisionFactors.includes(d.value)
            return (
              <Chip
                key={d.value}
                active={active}
                onClick={() =>
                  onChange({
                    decisionFactors: active
                      ? data.decisionFactors.filter((v) => v !== d.value)
                      : [...data.decisionFactors, d.value],
                  })
                }
              >
                {d.label}
              </Chip>
            )
          })}
        </div>
      </Field>
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-8 rounded-full text-[11px] font-bold transition-colors ${
        active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
      }`}
    >
      {children}
    </button>
  )
}
