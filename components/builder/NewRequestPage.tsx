'use client'

import { Check, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import RequestSummaryPanel from './new-request/RequestSummaryPanel'
import Spinner from './new-request/Spinner'
import Step1BasicInfo from './new-request/Step1BasicInfo'
import Step2Problem from './new-request/Step2Problem'
import Step3Target from './new-request/Step3Target'
import Step4Experience from './new-request/Step4Experience'
import Step4Survey from './new-request/Step4Survey'
import Step5Attachments from './new-request/Step5Attachments'
import Step6Pricing from './new-request/Step6Pricing'
import Stepper from './new-request/Stepper'
import { getDraft, saveDraft } from './new-request/storage'
import { createEmptyDraft, type RequestFormData } from './new-request/types'

const WALLET_BALANCE = 80000 // 임시: 추후 Supabase wallet 테이블에서 조회

export default function NewRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftIdFromUrl = searchParams.get('draftId')

  const [data, setData] = useState<RequestFormData>(() => createEmptyDraft())
  const [hydrated, setHydrated] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // localStorage는 클라이언트 전용이라 mount 후 로드
  useEffect(() => {
    if (draftIdFromUrl) {
      const found = getDraft(draftIdFromUrl)
      if (found) setData(found)
    }
    setHydrated(true)
  }, [draftIdFromUrl])

  const updateData = (patch: Partial<RequestFormData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }

  const goToStep = (step: number) => {
    if (step < 1 || step > 6) return
    setData((prev) => ({ ...prev, currentStep: step }))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    if (saving || submitting) return
    if (data.currentStep === 6) {
      // Step 6 → 미리보기. 임시저장 한 뒤 이동.
      setSubmitting(true)
      const saved = saveDraft(data)
      // 약간의 지연으로 스피너 노출 (UX)
      setTimeout(() => {
        router.push(`/builder/new-request/preview?draftId=${saved.id}`)
      }, 400)
      return
    }
    goToStep(data.currentStep + 1)
  }

  const handlePrev = () => {
    if (saving || submitting) return
    goToStep(data.currentStep - 1)
  }

  const handleSaveDraft = () => {
    if (saving || submitting) return
    setSaving(true)
    saveDraft(data)
    setTimeout(() => {
      setSaving(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1800)
    }, 500)
  }

  const isStep4Survey = data.requestType === 'survey'
  const isStep4Experience = data.requestType === 'experience'

  const nextDisabledReason = useMemo(() => {
    switch (data.currentStep) {
      case 1:
        if (!data.productName.trim()) return '제품/서비스명을 입력하세요'
        if (!data.oneLineDesc.trim()) return '한 줄 소개를 입력하세요'
        if (data.categories.length === 0) return '카테고리를 선택하세요'
        if (!data.stage) return '현재 단계를 선택하세요'
        if (!data.requestType) return '의뢰 타입을 선택하세요'
        return null
      case 4:
        if (!data.requestType) return 'Step 1에서 의뢰 타입을 먼저 선택하세요'
        return null
      default:
        return null
    }
  }, [data])

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black">새 의뢰 등록</h1>
          <p className="text-[11px] text-[#666] font-medium">6단계로 검증 가설을 명확히 정리해보세요</p>
        </div>
        {savedFlash && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-black">
            <Check className="w-3 h-3" /> 임시 저장됨
          </div>
        )}
      </div>

      {/* Stepper */}
      <Stepper currentStep={data.currentStep} onJump={(s) => goToStep(s)} />

      {/* Main Content Area */}
      <div className="flex items-start gap-6 w-full">
        {/* Left Form Area */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {!hydrated ? (
            <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 h-64 animate-pulse" />
          ) : (
            <>
              {data.currentStep === 1 && <Step1BasicInfo data={data} onChange={updateData} />}
              {data.currentStep === 2 && <Step2Problem data={data} onChange={updateData} />}
              {data.currentStep === 3 && <Step3Target data={data} onChange={updateData} />}
              {data.currentStep === 4 && isStep4Survey && <Step4Survey data={data} onChange={updateData} />}
              {data.currentStep === 4 && isStep4Experience && <Step4Experience data={data} onChange={updateData} />}
              {data.currentStep === 4 && !data.requestType && (
                <div className="rounded-3xl border border-[#F77019]/30 bg-[#F77019]/5 p-8 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm font-black text-[#F77019]">의뢰 타입을 먼저 선택해주세요</p>
                  <p className="text-[11px] font-bold text-[#666]">
                    Step 1에서 설문형 / 체험형 중 하나를 선택해야 검증 내용을 설계할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90"
                  >
                    Step 1로 이동
                  </button>
                </div>
              )}
              {data.currentStep === 5 && <Step5Attachments data={data} onChange={updateData} />}
              {data.currentStep === 6 && <Step6Pricing data={data} walletBalance={WALLET_BALANCE} onChange={updateData} />}
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-[260px] flex flex-col gap-4 flex-shrink-0">
          <RequestSummaryPanel data={data} />

          {nextDisabledReason && (
            <div className="rounded-xl bg-[#F77019]/5 border border-[#F77019]/20 p-3">
              <p className="text-[10px] font-bold text-[#F77019] leading-relaxed">⚠ {nextDisabledReason}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={data.currentStep === 1 || saving || submitting}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[#1D1C1C]/10 text-[11px] font-black text-[#999] hover:text-[#1D1C1C] hover:border-[#1D1C1C]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#999] disabled:hover:border-[#1D1C1C]/10"
              >
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!!nextDisabledReason || saving || submitting}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
              >
                {data.currentStep === 6 ? (
                  submitting ? (
                    <>
                      <Spinner size={14} /> 이동 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> 제출하기
                    </>
                  )
                ) : (
                  <>
                    다음 <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#1D1C1C]/10 text-[11px] font-bold text-[#999] hover:text-[#1D1C1C] hover:border-[#1D1C1C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Spinner size={12} /> 저장 중...
                </>
              ) : (
                '임시 저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
