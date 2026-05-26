'use client'

import { useState } from 'react'
import { AGE_GROUPS, DECISION_FACTORS, OCCUPATIONS, type RequestFormData } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step3Target({ data, onChange }: Props) {
  const [interestInput, setInterestInput] = useState('')

  const toggle = (key: 'ageGroups' | 'occupations', val: string) => {
    const arr = data[key]
    onChange({ [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] } as Partial<RequestFormData>)
  }

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

      {/* 직군 */}
      <Field label="직군" hint="복수 선택">
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

      {/* 관심사 키워드 */}
      <Field label="관심사 키워드" hint={`${data.interests.length}/5`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addInterest()
              }
            }}
            placeholder="키워드 입력 후 Enter"
            className="flex-1 h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
          />
          <button
            type="button"
            onClick={addInterest}
            className="h-10 px-4 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:opacity-90"
          >
            추가
          </button>
        </div>
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
          placeholder='예: "야근 후 퇴근길 대중교통 안에서"'
          className="w-full rounded-xl bg-[#F5F5F5] border-none outline-none px-4 py-3 text-[11px] resize-none leading-relaxed"
        />
      </Field>

      {/* 결정 요인 */}
      <Field label="구매·사용 결정 요인">
        <div className="flex items-center gap-2 flex-wrap">
          {DECISION_FACTORS.map((d) => (
            <Chip key={d.value} active={data.decisionFactor === d.value} onClick={() => onChange({ decisionFactor: d.value })}>
              {d.label}
            </Chip>
          ))}
        </div>
      </Field>

      {/* 대체 방법 */}
      <Field label="지금 이 문제를 해결하는 대체 방법">
        <div className="flex items-center gap-2 flex-wrap">
          <Chip active={data.hasAlternative === true} onClick={() => onChange({ hasAlternative: true })}>있음</Chip>
          <Chip active={data.hasAlternative === false} onClick={() => onChange({ hasAlternative: false, alternativeDetail: '' })}>없음</Chip>
        </div>
        {data.hasAlternative === true && (
          <input
            type="text"
            value={data.alternativeDetail}
            onChange={(e) => onChange({ alternativeDetail: e.target.value })}
            placeholder="어떤 방법인가요?"
            className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px] mt-2"
          />
        )}
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
