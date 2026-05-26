'use client'

import { ChevronLeft, Lock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import Spinner from './new-request/Spinner'
import {
  EVALUATOR_TIERS,
  SEAN_ELLIS_QUESTION,
  STAGE_OPTIONS,
  type RequestFormData,
} from './new-request/types'
import { getDraft, saveDraft, submitRequest } from './new-request/storage'

const WALLET_BALANCE = 80000

function fmt(n: number): string {
  return n.toLocaleString('ko-KR')
}

export default function PreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId')

  const [data, setData] = useState<RequestFormData | null>(null)
  const [tab, setTab] = useState<'mine' | 'reviewer'>('mine')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (!draftId) {
      setNotFound(true)
      return
    }
    const found = getDraft(draftId)
    if (!found) setNotFound(true)
    else setData(found)
  }, [draftId])

  if (notFound) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 py-20 text-[#1D1C1C]">
        <p className="text-lg font-black">미리볼 의뢰를 찾을 수 없습니다</p>
        <button
          onClick={() => router.push('/builder/new-request')}
          className="px-4 py-2 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90"
        >
          새 의뢰 등록으로
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className="w-full h-64 rounded-3xl bg-white animate-pulse" />
  }

  const handleEdit = () => {
    if (saving || submitting) return
    router.push(`/builder/new-request?draftId=${data.id}`)
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

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    submitRequest(data)
    setTimeout(() => {
      router.push(`/builder/new-request/preview/complete?id=${data.id}`)
    }, 700)
  }

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black">결제 전 미리보기</h1>
          <p className="text-[11px] text-[#666] font-medium">의뢰 내용을 마지막으로 점검해주세요</p>
        </div>
        {savedFlash && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-black">
            ✓ 임시 저장됨
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-xl w-fit text-[11px] font-black">
        <button
          onClick={() => setTab('mine')}
          className={`px-5 py-2 rounded-lg transition-colors ${tab === 'mine' ? 'bg-white text-[#1D1C1C] shadow-sm' : 'text-[#999] hover:text-[#1D1C1C]'}`}
        >
          내 요약
        </button>
        <button
          onClick={() => setTab('reviewer')}
          className={`px-5 py-2 rounded-lg transition-colors ${tab === 'reviewer' ? 'bg-white text-[#1D1C1C] shadow-sm' : 'text-[#999] hover:text-[#1D1C1C]'}`}
        >
          리뷰어에게 보이는 모습
        </button>
      </div>

      {/* Content */}
      <div className="flex items-start gap-6 w-full">
        <div className="flex-1 min-w-0">
          {tab === 'mine' ? <CreatorView data={data} /> : <ReviewerView data={data} />}
        </div>

        {/* Right action panel */}
        <div className="w-[260px] flex flex-col gap-3 flex-shrink-0">
          <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-3">
            <h3 className="text-xs font-black">마지막 확인</h3>
            <p className="text-[10px] font-bold text-[#666] leading-relaxed">
              제출하면 평가단 매칭이 시작됩니다. 매칭 시작 후에는 수정이 어려우니 두 탭을 모두 확인해주세요.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleEdit}
              disabled={saving || submitting}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#1D1C1C]/10 text-[11px] font-black text-[#1D1C1C] hover:border-[#1D1C1C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> 한번 더 확인하기
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={saving || submitting}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Spinner size={14} /> 제출 중...
                </>
              ) : (
                '제출하기 (결제하기)'
              )}
            </button>
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

      {confirmOpen && (
        <ConfirmModal
          data={data}
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  )
}

function CreatorView({ data }: { data: RequestFormData }) {
  const tier = EVALUATOR_TIERS.find((t) => t.value === data.evaluatorTier)!
  const stage = STAGE_OPTIONS.find((s) => s.value === data.stage)
  const typeLabel = data.requestType === 'survey' ? '설문형' : '체험형'

  const cashCost = tier.cash * data.evaluatorCount + (data.aiReport === 'deep' ? 5000 : 0)
  const feeSubtotal = data.feePerEvaluator * data.evaluatorCount
  const platformFee = Math.round(feeSubtotal * 0.075)
  const vat = Math.round(platformFee * 0.1)
  const totalCash = feeSubtotal + platformFee + vat

  const questions = data.requestType === 'survey' ? data.questions : data.postQuestions

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="grid grid-cols-2 gap-4 text-[11px]">
        <SummaryItem label="제품명" value={data.productName || '—'} />
        <SummaryItem label="의뢰 타입" value={typeLabel} />
        <SummaryItem label="단계" value={stage?.title ?? '—'} />
        <SummaryItem label="카테고리" value={data.categories.join(', ') || '—'} />
        <SummaryItem label="평가단" value={`${tier.label} ${data.evaluatorCount}명`} />
        <SummaryItem label="AI 리포트" value={data.aiReport === 'deep' ? '심층 포함' : '기본'} />
        <SummaryItem label="완료 기한" value={`${data.deadlineHours}시간`} />
        <SummaryItem label="한 줄 소개" value={data.oneLineDesc || '—'} />
      </div>

      <div className="h-[1px] bg-[#EEEEEE]" />

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black">질문 목록 ({questions.length + 1}개 · Sean Ellis 포함)</h3>
        <ol className="flex flex-col gap-2 text-[11px]">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-2">
              <span className="text-[#F77019] font-black w-6">Q{i + 1}.</span>
              <div className="flex-1">
                <span className="text-[10px] font-black bg-[#F5F5F5] text-[#666] px-1.5 py-0.5 rounded mr-2">
                  {q.type === 'multiple' ? '객관식' : q.type === 'text' ? '주관식' : '리커트'}
                </span>
                <span className="font-bold">{q.text || '(작성되지 않음)'}</span>
              </div>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <span className="text-[#F77019] font-black w-6">Q{questions.length + 1}.</span>
            <div className="flex-1 flex items-start gap-2">
              <Lock className="w-3 h-3 text-[#F77019] mt-0.5 flex-shrink-0" />
              <span className="font-bold">{SEAN_ELLIS_QUESTION.text}</span>
            </div>
          </li>
        </ol>
      </div>

      {data.requestType === 'experience' && (
        <>
          <div className="h-[1px] bg-[#EEEEEE]" />
          <div className="flex flex-col gap-2 text-[11px]">
            <h3 className="text-xs font-black">체험 설계</h3>
            <SummaryItem label="체험 링크" value={data.experienceUrl || '—'} />
            <SummaryItem label="예상 체험 시간" value={data.experienceTime < 60 ? `${data.experienceTime}분` : '1시간+'} />
            <SummaryItem label="체험 기한" value={`${data.experienceDeadline}시간`} />
            <SummaryItem label="스크린샷 요청" value={data.screenshotRequired ? '예' : '아니오'} />
          </div>
        </>
      )}

      <div className="h-[1px] bg-[#EEEEEE]" />

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-black">비용 명세서</h3>
        <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-5 flex flex-col gap-2 text-[11px] font-bold">
          <Row label="캐시 차감" value={`${fmt(cashCost)}C  (잔여: ${fmt(WALLET_BALANCE - cashCost)}C)`} />
          <Row label="사례금 소계" value={`${fmt(data.feePerEvaluator)}원 × ${data.evaluatorCount}명 = ${fmt(feeSubtotal)}원`} />
          <Row label="수수료 7.5%" value={`${fmt(platformFee)}원`} />
          <Row label="부가세" value={`${fmt(vat)}원`} />
          <div className="h-[1px] bg-[#EEEEEE] my-1" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black text-[#1D1C1C]">총 현금 결제</span>
            <span className="text-[14px] font-black text-[#F77019]">{fmt(totalCash)}원</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewerView({ data }: { data: RequestFormData }) {
  const stage = STAGE_OPTIONS.find((s) => s.value === data.stage)
  const questions = data.requestType === 'survey' ? data.questions : data.postQuestions

  // 평가단이 실제로 수령하는 금액: 사례금 - 평가단 측 수수료 7.5%
  const evaluatorReceive = Math.round(data.feePerEvaluator * 0.925)

  return (
    <div className="rounded-3xl border-2 border-dashed border-[#1565C0]/40 bg-gradient-to-br from-[#F8FBFF] to-white p-8 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 text-[10px] font-black text-[#1565C0]">
        <Lock className="w-3 h-3" /> 블라인드 뷰 · 평가단에게 실제로 보이는 화면
      </div>

      {/* 태그 */}
      <div className="flex items-center gap-2 flex-wrap">
        {data.categories.map((c) => (
          <span key={c} className="text-[10px] font-black bg-[#1D1C1C] text-white px-2 py-1 rounded">
            {c}
          </span>
        ))}
        {stage && (
          <span className="text-[10px] font-black bg-[#1565C0]/10 text-[#1565C0] px-2 py-1 rounded">· {stage.title}</span>
        )}
      </div>

      {/* 한 줄 소개 */}
      <p className="text-xl font-black leading-snug">"{data.oneLineDesc || '(한 줄 소개 미작성)'}"</p>

      {/* 메타 */}
      <div className="flex items-center justify-between text-[11px] font-bold text-[#666] border-y border-[#1D1C1C]/5 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999]">예상 소요시간</span>
          <span className="text-[#1D1C1C]">
            {data.requestType === 'experience'
              ? data.experienceTime < 60
                ? `체험 ${data.experienceTime}분 + 평가`
                : '체험 1시간+ 평가'
              : '10~15분'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999]">사례금 (수수료 차감 후)</span>
          <span className="text-[#F77019] font-black">{fmt(evaluatorReceive)}원</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999]">마감</span>
          <span className="text-[#1D1C1C]">{data.deadlineHours}시간 후</span>
        </div>
      </div>

      {/* 질문 목록 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black">질문 목록</h3>
        <ol className="flex flex-col gap-2 text-[11px]">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-2">
              <span className="text-[#1565C0] font-black w-6">{i + 1}.</span>
              <span className="font-bold flex-1">
                {q.text || '(작성되지 않음)'}
                {q.type === 'likert' && <span className="text-[#999] ml-1">(1~5점)</span>}
              </span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <span className="text-[#1565C0] font-black w-6">{questions.length + 1}.</span>
            <div className="flex-1 flex items-start gap-2">
              <Lock className="w-3 h-3 text-[#F77019] mt-0.5 flex-shrink-0" />
              <span className="font-bold">{SEAN_ELLIS_QUESTION.text}</span>
            </div>
          </li>
        </ol>
      </div>

      <div className="h-[1px] bg-[#1D1C1C]/5" />

      <div className="text-[10px] font-bold text-[#999]">
        의뢰인: <span className="text-[#1D1C1C]">비공개</span> · 평가단은 의뢰인의 실명·회사명을 볼 수 없습니다
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-[#999]">{label}</span>
      <span className="text-[11px] font-bold text-[#1D1C1C]">{value}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#666]">{label}</span>
      <span className="text-[#1D1C1C]">{value}</span>
    </div>
  )
}

function ConfirmModal({
  data,
  submitting,
  onCancel,
  onConfirm,
}: {
  data: RequestFormData
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const feeSubtotal = data.feePerEvaluator * data.evaluatorCount
  const platformFee = Math.round(feeSubtotal * 0.075)
  const vat = Math.round(platformFee * 0.1)
  const totalCash = feeSubtotal + platformFee + vat

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black">진짜 제출하시겠어요?</h2>
          <p className="text-[12px] font-bold text-[#666] leading-relaxed">
            제출 즉시 평가단 매칭이 시작되며, 매칭이 시작된 후에는 의뢰 내용 수정이 어렵습니다.
            <br />
            한 번 더 점검할 것이 있다면 취소하고 돌아가 편집할 수 있어요.
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-4 flex flex-col gap-1.5 text-[11px] font-bold">
          <div className="flex items-center justify-between">
            <span className="text-[#666]">제품명</span>
            <span className="text-[#1D1C1C]">{data.productName || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#666]">평가단</span>
            <span className="text-[#1D1C1C]">{data.evaluatorCount}명</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#EEEEEE]">
            <span className="text-[12px] font-black text-[#1D1C1C]">결제 금액</span>
            <span className="text-[14px] font-black text-[#F77019]">{fmt(totalCash)}원</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-[#1D1C1C]/10 text-[11px] font-black text-[#666] hover:text-[#1D1C1C] hover:border-[#1D1C1C]/30 transition-all disabled:opacity-50"
          >
            한번 더 확인할게요
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner size={14} /> 제출 중...
              </>
            ) : (
              '제출할게요'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
