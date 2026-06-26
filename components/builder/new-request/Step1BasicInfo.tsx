'use client'

import { getCompatibility } from '@/lib/constants/compatibilityMatrix'
import {
  CATEGORIES,
  PROJECT_TYPE_OPTIONS,
  STAGE_OPTIONS,
  getFlow,
  getStepKey,
  type ProjectType,
  type RequestFormData,
  type Stage,
} from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step1BasicInfo({ data, onChange }: Props) {
  const toggleCategory = (cat: string) => {
    const has = data.categories.includes(cat)
    if (has) onChange({ categories: data.categories.filter((c) => c !== cat) })
    else if (data.categories.length < 3) onChange({ categories: [...data.categories, cat] })
  }

  const selectType = (type: ProjectType) => {
    // 타입이 변경되는 경우 (null → 선택 또는 다른 타입 전환)
    const typeChanged = data.projectType !== type
    const opt = PROJECT_TYPE_OPTIONS.find((o) => o.value === type)!

    const patch: Partial<RequestFormData> = {
      projectType: type,
      deadlineDays: opt.maxDays,
    }

    // Standard/Deep는 최소 10명
    if (type !== 'light' && data.evaluatorCount < 10) {
      patch.evaluatorCount = 10
    }
    // Light는 사례금 0
    if (type === 'light') {
      patch.feePerEvaluator = 0
    } else if (data.feePerEvaluator === 0) {
      patch.feePerEvaluator = 5000
    }

    // 타입이 실제로 변경되었을 때 — 질문 데이터 초기화 (타입별 질문 타입이 다름)
    if (typeChanged && data.projectType !== null) {
      patch.questions = []
      patch.postQuestions = []
      patch.lightQuestionStyle = null
    }

    // 현재 단계가 새 흐름에 존재하지 않으면 같은 'key'를 새 흐름에서 찾아 매핑
    if (typeChanged) {
      const currentKey = getStepKey(data.projectType, data.currentStep)
      const newFlow = getFlow(type)
      const newIdx = newFlow.indexOf(currentKey)
      if (newIdx >= 0) {
        patch.currentStep = newIdx + 1
      } else {
        // 새 흐름에 없는 step(target/attachments)이면 가장 가까운 이전 step으로
        patch.currentStep = Math.min(data.currentStep, newFlow.length)
      }
      // 안전 클램프
      patch.currentStep = Math.max(1, Math.min(patch.currentStep!, newFlow.length))
    }

    onChange(patch)
  }

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h2 className="text-lg font-black">기본 정보</h2>

      {/* 제품명 */}
      <Field label="서비스/제품명" hint={`${data.productName.length}/30`}>
        <input
          type="text"
          maxLength={30}
          value={data.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          placeholder="핵심만 압축한 제품/서비스 이름"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </Field>

      {/* 한 줄 설명 */}
      <Field label="한 줄 소개" hint={`${data.oneLineDesc.length}/60`}>
        <input
          type="text"
          maxLength={60}
          value={data.oneLineDesc}
          onChange={(e) => onChange({ oneLineDesc: e.target.value })}
          placeholder="누구를 위한 어떤 솔루션인지 한 줄로 — Reviewer 카드에 그대로 노출"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </Field>

      {/* 카테고리 */}
      <Field label="카테고리" hint={`${data.categories.length}/3`}>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const active = data.categories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-4 h-8 rounded-full text-[11px] font-bold transition-colors ${
                  active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </Field>

      {/* 현재 단계 */}
      <Field label="현재 단계">
        <div className="grid grid-cols-4 gap-3">
          {STAGE_OPTIONS.map((s) => {
            const active = data.stage === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  const newStage = s.value as Stage
                  const patch: Partial<RequestFormData> = { stage: newStage }
                  // 아이디어 단계로 변경 시 Deep이 선택돼 있으면 자동 해제
                  onChange(patch)
                }}
                className={`flex flex-col p-4 rounded-xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <span className={`text-[11px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{s.title}</span>
                <span className={`text-[9px] mt-1 ${active ? 'text-[#F77019]/80' : 'text-[#999]'}`}>{s.sub}</span>
              </button>
            )
          })}
        </div>
      </Field>

      {/* 랜딩 URL */}
      <Field label="랜딩·소개 URL (선택)">
        <input
          type="url"
          value={data.landingUrl}
          onChange={(e) => onChange({ landingUrl: e.target.value })}
          placeholder="https://"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </Field>

      {/* 프로젝트 타입 — Light / Standard / Deep */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold">프로젝트 타입</span>
          <span className="text-[9px] text-[#F77019] font-black bg-[#F77019]/10 px-2 py-0.5 rounded">
            필수 · Step 4 분기 결정
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PROJECT_TYPE_OPTIONS.map((opt) => {
            const active = data.projectType === opt.value
            const compat = getCompatibility(data.stage, opt.value as ProjectType)
            const isDisabled = compat === 'disabled'
            const isDiscouraged = compat === 'discouraged'
            return (
              <div key={opt.value} className="relative group">
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && selectType(opt.value)}
                  className={`w-full flex flex-col p-5 rounded-2xl text-left transition-colors ${
                    isDisabled
                      ? 'bg-[#F5F5F5] border border-transparent opacity-40 cursor-not-allowed'
                      : active
                        ? 'bg-[#F77019]/10 border border-[#F77019]'
                        : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                  }`}
                >
                  <span className={`text-sm font-black ${active && !isDisabled ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{opt.title}</span>
                  <span className={`text-[11px] mt-2 font-bold ${active && !isDisabled ? 'text-[#F77019]/80' : 'text-[#666]'}`}>
                    {opt.shortDesc}
                  </span>
                  <span className={`text-[10px] mt-1 ${active && !isDisabled ? 'text-[#F77019]/60' : 'text-[#999]'}`}>{opt.detail}</span>
                  <div className="h-[1px] bg-[#1D1C1C]/5 my-3" />
                  <div className="flex flex-col gap-1 text-[10px] font-bold">
                    <div className="flex items-center justify-between">
                      <span className={active && !isDisabled ? 'text-[#F77019]/60' : 'text-[#999]'}>이용료</span>
                      <span className={active && !isDisabled ? 'text-[#F77019]' : 'text-[#1D1C1C]'}>{opt.cashCost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={active && !isDisabled ? 'text-[#F77019]/60' : 'text-[#999]'}>사례금</span>
                      <span className={active && !isDisabled ? 'text-[#F77019]' : 'text-[#1D1C1C]'}>{opt.honorariumNote}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={active && !isDisabled ? 'text-[#F77019]/60' : 'text-[#999]'}>최대 기간</span>
                      <span className={active && !isDisabled ? 'text-[#F77019]' : 'text-[#1D1C1C]'}>{opt.maxDays}일</span>
                    </div>
                  </div>
                  {isDiscouraged && (
                    <p className="text-[9px] text-[#F77019]/80 mt-2 border-t border-[#F77019]/20 pt-2">
                      실제로 운영 중인 서비스라면, 더 꼼꼼하게 확인하는 Standard를 추천해요
                    </p>
                  )}
                </button>
                {/* 아이디어 단계에서 Deep 선택 시도 시 툴팁 */}
                {isDisabled && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-[#1D1C1C] text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    체험할 대상이 필요해 아이디어 단계에서는 선택할 수 없어요
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D1C1C]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
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
