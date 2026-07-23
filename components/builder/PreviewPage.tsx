'use client'

import { ChevronLeft, Lock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import Spinner from './new-request/Spinner'
import { deleteDraft, getDraft, saveDraft } from './new-request/storage'
import { submitProject } from './new-request/submitProject'
import {
  PROJECT_TYPE_OPTIONS,
  PSF_STANDARD_QUESTIONS,
  REVIEWER_COMMISSION_RATE,
  SEAN_ELLIS_QUESTION,
  STAGE_OPTIONS,
  calculateCost,
  type RequestFormData,
} from './new-request/types'
import { getPsfPmfType } from '@/lib/utils/psfPmf'

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
  const [submitError, setSubmitError] = useState('')

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
    setSubmitError('')
    try {
      const { projectId } = await submitProject(data)
      deleteDraft(data.id)
      router.push(`/builder/new-request/preview/complete?id=${projectId}`)
    } catch (err) {
      setSubmitting(false)
      setConfirmOpen(false)
      setSubmitError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.')
    }
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

      {submitError && (
        <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 px-4 py-3 text-[11px] font-bold text-[#EF4444]">
          {submitError}
        </div>
      )}

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
          Reviewer에게 보이는 모습
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
              ) : data.projectType === 'light' ? (
                '프로젝트 시작하기'
              ) : (
                '제출하기 (사전 승인)'
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
  const typeMeta = PROJECT_TYPE_OPTIONS.find((o) => o.value === data.projectType)
  const stage = STAGE_OPTIONS.find((s) => s.value === data.stage)
  const cost = calculateCost(data)

  const questions = data.questions
  const includeSeanEllis = data.projectType === 'standard'

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="grid grid-cols-2 gap-4 text-[11px]">
        <SummaryItem label="제품명" value={data.productName || '—'} />
        <SummaryItem label="프로젝트 타입" value={typeMeta?.title ?? '—'} />
        <SummaryItem label="단계" value={stage?.title ?? '—'} />
        <SummaryItem label="카테고리" value={data.categories.join(', ') || '—'} />
        {data.projectType === 'standard' && (
          <>
            <SummaryItem label="평가단" value={`${data.evaluatorCount}명`} />
            <SummaryItem label="1인당 사례금" value={`${fmt(data.feePerEvaluator)}원`} />
          </>
        )}
        <SummaryItem label="완료 기한" value={`최대 ${data.deadlineDays}일`} />
        <SummaryItem label="한 줄 소개" value={data.oneLineDesc || '—'} />
      </div>

      <div className="h-[1px] bg-[#EEEEEE]" />

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black">
          질문 목록 ({questions.length + (includeSeanEllis ? 1 : 0)}개{includeSeanEllis ? ' · Sean Ellis 포함' : ''})
        </h3>
        <ol className="flex flex-col gap-2 text-[11px]">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-2">
              <span className="text-[#F77019] font-black w-6">Q{i + 1}.</span>
              <div className="flex-1">
                <span className="text-[10px] font-black bg-[#F5F5F5] text-[#666] px-1.5 py-0.5 rounded mr-2">
                  {typeLabel(q.type)}
                </span>
                <span className="font-bold">{q.text || '(작성되지 않음)'}</span>
              </div>
            </li>
          ))}
          {includeSeanEllis && (
            <li className="flex items-start gap-2">
              <span className="text-[#F77019] font-black w-6">Q{questions.length + 1}.</span>
              <div className="flex-1 flex items-start gap-2">
                <Lock className="w-3 h-3 text-[#F77019] mt-0.5 flex-shrink-0" />
                <span className="font-bold">{SEAN_ELLIS_QUESTION.text}</span>
              </div>
            </li>
          )}
        </ol>
      </div>


      <div className="h-[1px] bg-[#EEEEEE]" />

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-black">비용 명세</h3>
        <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-5 flex flex-col gap-2 text-[11px] font-bold">
          <Row label="플랫폼 이용료 (캐시)" value={`${fmt(cost.cashCost)}C  (잔여 ${fmt(WALLET_BALANCE - cost.cashCost)}C)`} />
          {cost.preAuthAmount > 0 && (
            <>
              <Row
                label="사전 승인액"
                value={`${fmt(data.feePerEvaluator)}원 × ${data.evaluatorCount}명 = ${fmt(cost.preAuthAmount)}원`}
              />
              <div className="flex items-center justify-between text-[10px] font-medium text-[#999]">
                <span>└ 평가단 실 수령 (1인당)</span>
                <span>{fmt(cost.reviewerNetPerPerson)}원</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-[#999]">
                <span>└ FindFit 수수료 ({Math.round(REVIEWER_COMMISSION_RATE * 100)}%, Reviewer 차감)</span>
                <span>{fmt(cost.platformCommissionTotal)}원</span>
              </div>
              <div className="h-[1px] bg-[#EEEEEE] my-1" />
              <div className="rounded-lg bg-[#F77019]/5 border border-[#F77019]/15 px-3 py-2">
                <p className="text-[10px] font-bold text-[#F77019] leading-relaxed">
                  💡 사전 승인 = 카드 잠금. 리뷰 완료 후 실제 청구되며 미완료분은 자동 잠금 해제됩니다.
                </p>
              </div>
            </>
          )}
          {data.projectType === 'light' && (
            <Row label="사례금" value="없음" />
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewerView({ data }: { data: RequestFormData }) {
  const stage = STAGE_OPTIONS.find((s) => s.value === data.stage)
  const cost = calculateCost(data)
  const psfPmfType = data.stage ? getPsfPmfType(data.stage) : 'psf'
  // submitProject.ts의 buildQuestionRows와 동일한 규칙 — Standard/psf는 PSF
  // 고정 4문항이 맨 앞에, Standard/pmf는 Sean Ellis 문항이 맨 뒤에 자동으로
  // 붙는다. 실제 제출 시 서버가 만드는 문항 순서와 여기 미리보기가 다르면
  // "결제 직전 화면이랑 실제 리뷰어 화면 내용이 다르다"는 문제가 생긴다.
  const fixedLead = data.projectType === 'standard' && psfPmfType === 'psf' ? PSF_STANDARD_QUESTIONS : []
  const includeSeanEllis = data.projectType === 'standard' && psfPmfType === 'pmf'
  const questions = data.questions

  const expectedTime = data.projectType === 'standard' ? '10~15분' : '3~5분 (Light)'

  return (
    <div className="rounded-3xl border-2 border-dashed border-[#1565C0]/40 bg-gradient-to-br from-[#F8FBFF] to-white p-8 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 text-[10px] font-black text-[#1565C0]">
        <Lock className="w-3 h-3" /> 블라인드 뷰 · Reviewer에게 실제로 보이는 화면
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
      <p className="text-xl font-black leading-snug">&ldquo;{data.oneLineDesc || '(한 줄 소개 미작성)'}&rdquo;</p>

      {/* 메타 — Light vs Standard/Deep */}
      <div className="flex items-center justify-between text-[11px] font-bold text-[#666] border-y border-[#1D1C1C]/5 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999]">예상 소요시간</span>
          <span className="text-[#1D1C1C]">{expectedTime}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999]">사례금</span>
          {data.projectType === 'light' ? (
            <span className="text-[#1D1C1C]">EXP 적립</span>
          ) : (
            <div className="flex flex-col items-start">
              <span className="text-[#1D1C1C] line-through text-[10px] font-medium">
                {fmt(data.feePerEvaluator)}원
              </span>
              <span className="text-[#F77019] font-black">실 수령 {fmt(cost.reviewerNetPerPerson)}원</span>
              <span className="text-[8px] text-[#999] font-medium">(플랫폼 수수료 {Math.round(REVIEWER_COMMISSION_RATE * 100)}% 차감 후)</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999]">마감</span>
          <span className="text-[#1D1C1C]">{data.deadlineDays}일 후</span>
        </div>
      </div>

      {/* 질문 목록 — 크리에이터가 작성한 문항 + 필수 고정 문항(PSF/Sean Ellis)을
          실제 제출 순서 그대로 합쳐서 보여준다 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black">질문 목록</h3>
        <ol className="flex flex-col gap-2 text-[11px]">
          {fixedLead.map((q, i) => (
            <li key={q.id} className="flex items-start gap-2">
              <span className="text-[#1565C0] font-black w-6">{i + 1}.</span>
              <div className="flex-1 flex items-start gap-2">
                <Lock className="w-3 h-3 text-[#F77019] mt-0.5 flex-shrink-0" />
                <span className="font-bold">{q.text}</span>
              </div>
            </li>
          ))}
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-2">
              <span className="text-[#1565C0] font-black w-6">{fixedLead.length + i + 1}.</span>
              <span className="font-bold flex-1">
                {q.text || '(작성되지 않음)'}
                {q.type === 'likert' && <span className="text-[#999] ml-1">(1~5점)</span>}
                {q.type === 'yes_no' && <span className="text-[#999] ml-1">(예/아니오)</span>}
                {q.type === 'ab_test' && <span className="text-[#999] ml-1">(A/B 선택)</span>}
              </span>
            </li>
          ))}
          {includeSeanEllis && (
            <li className="flex items-start gap-2">
              <span className="text-[#1565C0] font-black w-6">{fixedLead.length + questions.length + 1}.</span>
              <div className="flex-1 flex items-start gap-2">
                <Lock className="w-3 h-3 text-[#F77019] mt-0.5 flex-shrink-0" />
                <span className="font-bold">{SEAN_ELLIS_QUESTION.text}</span>
              </div>
            </li>
          )}
        </ol>
        {(fixedLead.length > 0 || includeSeanEllis) && (
          <p className="text-[9px] text-[#999] font-bold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-[#F77019]" /> 표시된 문항은 검증 방법론상 필수로 자동 포함되는 질문입니다
          </p>
        )}
      </div>

      <div className="h-[1px] bg-[#1D1C1C]/5" />

      <div className="text-[10px] font-bold text-[#999]">
        의뢰인: <span className="text-[#1D1C1C]">비공개</span> · 평가단은 의뢰인의 실명·회사명을 볼 수 없습니다
      </div>
    </div>
  )
}

function typeLabel(t: string): string {
  return (
    {
      multiple_choice: '객관식',
      short_answer: '주관식',
      likert: '리커트 5점',
      ab_test: 'A/B 테스트',
      keyword: '키워드 선택',
      yes_no: '예/아니오',
      sean_ellis: 'Sean Ellis',
    } as Record<string, string>
  )[t] ?? t
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
  const cost = calculateCost(data)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black">진짜 제출하시겠어요?</h2>
          <p className="text-[12px] font-bold text-[#666] leading-relaxed">
            {data.projectType === 'light'
              ? '제출 즉시 캐시가 차감되고 평가단 매칭이 시작됩니다.'
              : '제출 즉시 캐시 차감 + PortOne 카드 사전 승인이 진행됩니다. 미완료분은 자동 잠금 해제되어 청구되지 않습니다.'}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-4 flex flex-col gap-1.5 text-[11px] font-bold">
          <div className="flex items-center justify-between">
            <span className="text-[#666]">제품명</span>
            <span className="text-[#1D1C1C]">{data.productName || '—'}</span>
          </div>
          {data.projectType === 'standard' && (
            <div className="flex items-center justify-between">
              <span className="text-[#666]">평가단</span>
              <span className="text-[#1D1C1C]">{data.evaluatorCount}명</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#EEEEEE]">
            <span className="text-[#1D1C1C]">캐시 차감</span>
            <span className="text-[#F77019] text-[13px] font-black">{fmt(cost.cashCost)}C</span>
          </div>
          {cost.preAuthAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[#1D1C1C]">카드 사전 승인</span>
              <span className="text-[#F77019] text-[13px] font-black">{fmt(cost.preAuthAmount)}원</span>
            </div>
          )}
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
