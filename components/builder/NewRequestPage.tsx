'use client'

import { Check, ChevronLeft, ChevronRight, Send, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import RequestSummaryPanel from './new-request/RequestSummaryPanel'
import Spinner from './new-request/Spinner'
import Step1BasicInfo from './new-request/Step1BasicInfo'
import Step2Problem from './new-request/Step2Problem'
import Step3Target from './new-request/Step3Target'
import Step4Light from './new-request/Step4Light'
import Step4Standard from './new-request/Step4Standard'
import Step5Attachments from './new-request/Step5Attachments'
import Step6Pricing from './new-request/Step6Pricing'
import Stepper, { type StepperEntry } from './new-request/Stepper'
import { getDraft, saveDraft } from './new-request/storage'
import {
  STEP_KEY_LABELS,
  createEmptyDraft,
  getFlow,
  getStepKey,
  type RequestFormData,
  CATEGORIES,
} from './new-request/types'
import Step0Modal from './new-request/Step0Modal'
import { useAgentBubble } from '../agent/AgentBubbleContext'
import CoachTour from '../onboarding/CoachTour'

const WALLET_BALANCE = 80000 // 임시: 추후 Supabase wallet 테이블에서 조회

const WIZARD_COACH_STEPS = [
  {
    target: '[data-coach="wizard-stepper"]',
    title: '단계별로 하나씩 채워가요',
    text: '기본정보부터 비용 확인까지 순서대로 진행돼요. 이미 지난 단계는 눌러서 바로 돌아갈 수 있어요.',
  },
  {
    target: '[data-coach="wizard-summary"]',
    title: '입력한 내용을 한눈에 확인해요',
    text: '지금까지 채운 내용이 여기 요약돼서 보여요. 빠진 항목이 있으면 바로 알 수 있어요.',
  },
  {
    target: '[data-coach="wizard-save-draft"]',
    title: '중간에 저장하고 나가도 괜찮아요',
    text: '임시 저장을 누르면 나중에 이어서 작성할 수 있어요. 프로젝트 목록에서 다시 열 수 있어요.',
    placement: 'top' as const,
  },
]

export default function NewRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentBubble = useAgentBubble()
  const draftIdFromUrl = searchParams.get('draftId')

  const [data, setData] = useState<RequestFormData>(() => createEmptyDraft())
  const [hydrated, setHydrated] = useState(false)
  // Agent와의 대화로 프로젝트 타입(Light/Standard)을 미리 선택해줬을 때만
  // "Agent 추천이에요" 배지를 보여준다 — 사용자가 직접 고른 경우엔 안 뜸.
  const [agentSuggestedType, setAgentSuggestedType] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isStep0Open, setIsStep0Open] = useState(false)

  useEffect(() => {
    if (draftIdFromUrl) {
      const found = getDraft(draftIdFromUrl)
      if (found) setData(found)
    } else {
      // Only show Step0Modal on fresh creation: no draftId, no agentSession,
      // and no skipIntro (호출한 쪽에서 이미 "탐색부터/아이템 있어요" 선택을
      // 마쳤다는 뜻 — 홈 화면 Step0Modal이나 ItemDiscoveryFlow를 거쳐 왔을
      // 때 여기서 같은 질문을 또 띄우면 순서가 뒤죽박죽으로 보인다).
      const agentSession = searchParams.get('agentSession')
      const skipIntro = searchParams.get('skipIntro')
      if (!agentSession && !skipIntro) {
        setIsStep0Open(true)
      }
    }
    setHydrated(true)
  }, [draftIdFromUrl, searchParams])

  // Agent 대화 컨텍스트에서 정보 자동 기입
  //
  // ⚠️ 예전 버전은 AgentContext에 존재한 적도 없는 context.keywords 필드를
  // 참조하고 있었다 — 항상 undefined라 이 분기가 절대 실행되지 않았고,
  // 결과적으로 대화에서 실제로 파악한 아이디어 요약(ideaSummary)/타겟
  // (targetCustomer)이 마법사로 전혀 안 넘어오고 있었다(카테고리 추정만
  // 겨우 반영됨). 그래서 사용자 입장에선 Agent가 "파악했다"고 해놓고 정작
  // 등록 화면엔 아무 내용도 안 채워진 것처럼 보였다 — 실제 필드(ideaSummary,
  // targetCustomer)를 기준으로 다시 연결한다.
  useEffect(() => {
    const agentSession = searchParams.get('agentSession')
    if (agentSession && hydrated) {
      try {
        const rawContext = sessionStorage.getItem(`agent_context_${agentSession}`)
        if (rawContext) {
          const context = JSON.parse(rawContext)
          setData(prev => {
            const patch: Partial<RequestFormData> = { agentSessionId: agentSession }
            if (context.category) {
              const matchedCat = CATEGORIES.find((c) => c.toLowerCase() === context.category.toLowerCase()) || '기타'
              patch.categories = [matchedCat]
            }
            if (context.ideaSummary) {
              if (!prev.productName) patch.productName = context.ideaSummary.slice(0, 40)
              patch.oneLineDesc = context.ideaSummary
            }
            if (context.targetCustomer) {
              patch.targetContext = context.targetCustomer
            }
            // 단계/타입은 여기서 그친 게 아니라, 대화에서 파악한 내용을
            // 근거로 "이게 좋을 것 같아요" 정도의 추천까지 미리 선택해준다
            // — 사용자가 원하면 자유롭게 바꿀 수 있으므로 강제는 아니다.
            if (context.stage && !prev.stage) {
              const stageMap: Record<string, RequestFormData['stage']> = {
                idea: 'idea',
                building: 'prototype',
                launched: 'launched',
              }
              patch.stage = stageMap[context.stage] ?? undefined
            }
            if (!prev.projectType) {
              // 아직 아이디어 단계거나 만들고 있는 중이면 빠르게 방향성만
              // 확인하는 Light를, 이미 출시해서 구체적인 가설이 있으면
              // 심층 설문인 Standard를 추천한다.
              patch.projectType = context.stage === 'launched' ? 'standard' : 'light'
              setAgentSuggestedType(true)
            }
            return { ...prev, ...patch }
          })
        }
      } catch (err) {
        console.error('Failed to parse agent context', err)
      }
    }
  }, [searchParams, hydrated])

  // 동적 단계 흐름 — Light는 4단계, Standard/Deep는 6단계
  const flow = getFlow(data.projectType)
  const totalSteps = flow.length
  const currentKey = getStepKey(data.projectType, data.currentStep)
  const isLastStep = data.currentStep === totalSteps

  const stepperEntries: StepperEntry[] = flow.map((key, i) => ({
    step: i + 1,
    label: STEP_KEY_LABELS[key],
  }))

  // Agent가 "이 부분 어떻게 쓰면 좋을까?" 질문을 받았을 때 지금 마법사가
  // 몇 단계인지 몰라서 검증 문항 설계 안내와 헷갈려 엉뚱한 답을 하던 문제
  // 수정 — 현재 단계를 버블 컨텍스트에 실시간으로 알려준다.
  useEffect(() => {
    const fieldsHint =
      currentKey === 'basic' ? `제품명: ${data.productName || '(비어있음)'} / 한줄소개: ${data.oneLineDesc || '(비어있음)'}` :
      currentKey === 'problem' ? `문제: ${data.problem || '(비어있음)'} / 기존 대안·한계: ${data.alternativeAndLimit || '(비어있음)'} / 우리 차별점: ${data.ourDifference || '(비어있음)'}` :
      currentKey === 'target' ? `타겟 맥락: ${data.targetContext || '(비어있음)'}` :
      currentKey === 'cost' ? `검증 목표: ${data.validationGoal || '(비어있음)'} / 가설: ${data.hypothesis || '(비어있음)'}` :
      undefined
    agentBubble.setActiveWizardStep({ stepKey: currentKey, stepLabel: STEP_KEY_LABELS[currentKey], fieldsHint })
    return () => agentBubble.setActiveWizardStep(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, data.productName, data.oneLineDesc, data.problem, data.alternativeAndLimit, data.ourDifference, data.targetContext, data.validationGoal, data.hypothesis])

  const updateData = (patch: Partial<RequestFormData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }

  const goToStep = (step: number) => {
    if (step < 1 || step > totalSteps) return
    setData((prev) => ({ ...prev, currentStep: step }))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    if (saving || submitting) return
    if (isLastStep) {
      setSubmitting(true)
      const saved = saveDraft(data)
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

  const nextDisabledReason = useMemo(() => {
    switch (currentKey) {
      case 'basic':
        if (!data.productName.trim()) return '제품/서비스명을 입력하세요'
        if (!data.oneLineDesc.trim()) return '한 줄 소개를 입력하세요'
        if (data.categories.length === 0) return '카테고리를 선택하세요'
        if (!data.stage) return '현재 단계를 선택하세요'
        if (!data.projectType) return '프로젝트 타입을 선택하세요'
        return null
      case 'questions':
        if (!data.projectType) return 'Step 1에서 프로젝트 타입을 먼저 선택하세요'
        if (data.projectType === 'light' && !data.lightQuestionStyle) {
          return '질문 스타일을 먼저 선택하세요 (A/B · 키워드 · 예/아니오 중 하나)'
        }
        return null
      case 'cost':
        if (!data.projectType) return null
        if (data.projectType === 'light') {
          if (data.evaluatorCount < 1) return '평가단 수는 1명 이상이어야 합니다'
          if (WALLET_BALANCE < 4900) return '캐시가 부족합니다. 충전이 필요합니다.'
        } else {
          if (data.evaluatorCount < 1) return '최소 평가단 수는 1명입니다'
          if (data.feePerEvaluator < 1000) return '1인당 사례금은 최소 1,000원 이상'
          if (data.accessMethod === 'web_link' && !data.landingUrl.trim()) {
            return '리뷰어가 체험할 웹 링크를 입력하세요'
          }
          if (data.accessMethod === 'app_download' && !data.appStoreUrl.trim() && !data.playStoreUrl.trim()) {
            return 'App Store 또는 Google Play 링크를 하나 이상 입력하세요'
          }
          const cashNeeded = 1800 * data.evaluatorCount
          if (WALLET_BALANCE < cashNeeded) return '캐시가 부족합니다. 충전이 필요합니다.'
        }
        return null
      default:
        return null
    }
  }, [currentKey, data])

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      <Step0Modal
        isOpen={isStep0Open}
        onClose={() => setIsStep0Open(false)}
        onExplore={() => {
          setIsStep0Open(false)
          agentBubble.open()
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black">새 의뢰 등록</h1>
          <p className="text-[11px] text-[#666] font-medium">
            {data.projectType === 'light'
              ? '간단히 4단계로 빠른 반응을 확인해보세요'
              : '6단계로 검증 가설을 명확히 정리해보세요'}
          </p>
        </div>
        {savedFlash && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-black">
            <Check className="w-3 h-3" /> 임시 저장됨
          </div>
        )}
      </div>

      {/* Stepper — 동적 단계 */}
      <div data-coach="wizard-stepper">
        <Stepper steps={stepperEntries} currentStep={data.currentStep} onJump={(s) => goToStep(s)} />
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
        {/* Left Form Area */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {!hydrated ? (
            <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 h-64 animate-pulse" />
          ) : (
            <>
              {currentKey === 'basic' && agentSuggestedType && (
                <div className="rounded-xl bg-[#F77019]/5 border border-[#F77019]/20 px-4 py-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#F77019] flex-shrink-0" />
                  <p className="text-[11px] font-bold text-[#1D1C1C]">
                    Agent와의 대화를 참고해서 <strong className="text-[#F77019]">{data.projectType === 'standard' ? 'Standard' : 'Light'}</strong> 타입과 단계를 미리 골라뒀어요. 마음에 안 들면 자유롭게 바꾸세요.
                  </p>
                </div>
              )}
              {currentKey === 'basic' && <Step1BasicInfo data={data} onChange={updateData} />}
              {currentKey === 'problem' && <Step2Problem data={data} onChange={updateData} />}
              {currentKey === 'target' && <Step3Target data={data} onChange={updateData} />}

              {/* questions — 타입별 분기 */}
              {currentKey === 'questions' && data.projectType === 'light' && (
                <Step4Light data={data} onChange={updateData} />
              )}
              {currentKey === 'questions' && data.projectType === 'standard' && (
                <Step4Standard data={data} onChange={updateData} />
              )}
              {currentKey === 'questions' && !data.projectType && (
                <div className="rounded-3xl border border-[#F77019]/30 bg-[#F77019]/5 p-8 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm font-black text-[#F77019]">프로젝트 타입을 먼저 선택해주세요</p>
                  <p className="text-[11px] font-bold text-[#666]">
                    Step 1에서 Light / Standard 중 하나를 선택해야 검증 내용을 설계할 수 있습니다.
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

              {currentKey === 'attachments' && <Step5Attachments data={data} onChange={updateData} />}
              {currentKey === 'cost' && (
                <Step6Pricing data={data} walletBalance={WALLET_BALANCE} onChange={updateData} />
              )}
            </>
          )}
        </div>

        {/* Right Panel — 질문이 길어져 왼쪽 폼이 길어져도 요약/이전·다음
            버튼은 항상 화면에 붙어있도록 sticky 처리(데스크톱 lg+에서만 —
            모바일에서는 폼 아래로 자연스럽게 쌓이도록 sticky 해제) */}
        <div className="w-full lg:w-[260px] flex flex-col gap-4 flex-shrink-0 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <div data-coach="wizard-summary">
            <RequestSummaryPanel data={data} />
          </div>

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
                {isLastStep ? (
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
              data-coach="wizard-save-draft"
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

      {/* Step0Modal("어떻게 검증을 시작할까요?")이 열려 있는 동안 코치마크가
          같이 시작되면, 실제 강조 대상(임시저장 버튼 등)이 모달 뒤에 가려져
          있어서 스포트라이트가 엉뚱한 곳(모달 밑 실제 DOM 좌표)을 가리키는
          것처럼 보였다 — 모달이 완전히 닫힌 뒤에만 코치마크를 시작한다. */}
      {!isStep0Open && (
        <CoachTour steps={WIZARD_COACH_STEPS} storageKey="findfit_coach_seen_wizard" accentColor="#F77019" />
      )}
    </div>
  )
}
