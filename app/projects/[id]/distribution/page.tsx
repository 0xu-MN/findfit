'use client'

import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, Clock, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer, useState } from 'react'

type Reviewer = {
  reviewer_id: string
  nickname: string
  answers: Record<string, unknown>
}

type Allocation = {
  reviewer_id: string
  nickname: string
  amount: number
}

type DistributionMethod = 'equal' | 'differential' | 'top_n' | 'custom'

const METHOD_TABS: { value: DistributionMethod; label: string }[] = [
  { value: 'equal',        label: '균등 배분' },
  { value: 'differential', label: '차등 직접 배분' },
  { value: 'top_n',        label: '상위 N명 지정' },
  { value: 'custom',       label: '완전 자율' },
]

const MIN_AMOUNT = 5000

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export default function DistributionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [method, setMethod] = useState<DistributionMethod>('equal')
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [topN, setTopN] = useState(3)
  const [topNTotal, setTopNTotal] = useState(0)
  const [expanded, setExpanded] = useReducer(
    (s: Set<string>, id: string) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    },
    new Set<string>()
  )
  const [timeLeft, setTimeLeft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase: any = createClient()
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()
      setProject(proj)

      const { data: revs } = await supabase
        .from('reviews')
        .select('reviewer_id, nickname, answers')
        .eq('project_id', params.id)
        .eq('is_passed', true)
      setReviewers(revs ?? [])
    }
    load()
  }, [params.id])

  // 마감 타이머
  useEffect(() => {
    if (!project?.distribution_deadline) return
    const tick = () => {
      const diff = new Date(project.distribution_deadline as string).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('마감됨'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`${h}시간 ${m}분 남음`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [project])

  // 배분 계산
  useEffect(() => {
    if (!project || reviewers.length === 0) return
    const budget = project.incentive_budget as number

    if (method === 'equal') {
      const per = Math.floor(budget / reviewers.length)
      const remainder = budget - per * reviewers.length
      setAllocations(reviewers.map((r, i) => ({
        reviewer_id: r.reviewer_id,
        nickname: r.nickname,
        amount: per + (i === 0 ? remainder : 0),
      })))
    } else if (method === 'differential' || method === 'custom') {
      setAllocations((prev) =>
        reviewers.map((r) => ({
          reviewer_id: r.reviewer_id,
          nickname: r.nickname,
          amount: prev.find((a) => a.reviewer_id === r.reviewer_id)?.amount ?? Math.floor(budget / reviewers.length),
        }))
      )
    } else if (method === 'top_n') {
      const n = Math.min(topN, reviewers.length)
      const perTop = n > 0 ? Math.floor(topNTotal / n) : 0
      const perRest = reviewers.length - n > 0
        ? Math.floor((budget - topNTotal) / (reviewers.length - n))
        : 0
      setAllocations(reviewers.map((r, i) => ({
        reviewer_id: r.reviewer_id,
        nickname: r.nickname,
        amount: i < n ? perTop : perRest,
      })))
    }
  }, [method, reviewers, project, topN, topNTotal])

  const budget = (project?.incentive_budget as number) ?? 0
  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0)
  const isValid = totalAllocated === budget && allocations.every((a) => a.amount >= MIN_AMOUNT)

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    const res = await fetch(`/api/projects/${params.id}/distribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, allocations }),
    })
    if (res.ok) {
      router.push(`/projects/${params.id}/report`)
    } else {
      alert('배분 처리 중 오류가 발생했습니다')
      setSubmitting(false)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-[11px] font-bold text-[#999]">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
        <h1 className="text-xl font-black">사례금 배분</h1>

        {/* 상단 요약 */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard icon={<Users className="w-4 h-4" />} label="완료 인원" value={`${reviewers.length}명`} />
          <SummaryCard icon={<span className="text-sm font-black">₩</span>} label="총 예산" value={`${fmt(budget)}원`} />
          <SummaryCard icon={<Clock className="w-4 h-4" />} label="마감까지" value={timeLeft || '—'} />
        </div>

        {/* AI 리포트 링크 */}
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-[11px] font-black">AI 리포트</p>
            <p className="text-[10px] text-[#999] font-bold">AI가 분석한 품질 높은 응답 보기</p>
          </div>
          <button
            onClick={() => router.push(`/projects/${params.id}/report`)}
            className="h-9 px-4 rounded-xl bg-[#F77019] text-white text-[10px] font-black"
          >
            리포트 보기
          </button>
        </div>

        {/* 배분 방법 탭 */}
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">배분 방법 선택</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {METHOD_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setMethod(t.value)}
                className={`h-9 rounded-xl text-[11px] font-black transition-colors ${
                  method === t.value
                    ? 'bg-[#F77019] text-white'
                    : 'bg-[#F5F5F5] text-[#666] hover:bg-[#F77019]/10 hover:text-[#F77019]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 방법별 입력 UI */}
          {method === 'equal' && (
            <div className="rounded-xl bg-[#F5F5F5] px-4 py-3">
              <p className="text-[11px] font-bold text-[#666]">
                1인당 <span className="text-[#F77019] font-black">{fmt(Math.floor(budget / Math.max(reviewers.length, 1)))}원</span>씩 지급됩니다
              </p>
            </div>
          )}

          {method === 'top_n' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#666]">상위 N명</span>
                  <input
                    type="number"
                    min={1}
                    max={reviewers.length}
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="h-10 rounded-xl bg-[#F5F5F5] border border-[#1D1C1C]/10 outline-none px-3 text-[11px] font-bold"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#666]">상위 N명 총액 (원)</span>
                  <input
                    type="number"
                    min={0}
                    max={budget}
                    value={topNTotal}
                    onChange={(e) => setTopNTotal(Number(e.target.value))}
                    className="h-10 rounded-xl bg-[#F5F5F5] border border-[#1D1C1C]/10 outline-none px-3 text-[11px] font-bold"
                  />
                </label>
              </div>
              <p className="text-[10px] text-[#999] font-bold">
                나머지 {reviewers.length - topN}명은 자동 균등 배분됩니다
              </p>
            </div>
          )}
        </div>

        {/* 닉네임별 응답 + 배분 */}
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">평가단 응답 목록</h3>
          <div className="flex flex-col gap-3">
            {allocations.map((a, i) => {
              const rev = reviewers.find((r) => r.reviewer_id === a.reviewer_id)
              const isExpanded = expanded.has(a.reviewer_id)
              return (
                <div key={a.reviewer_id} className="rounded-2xl border border-[#1D1C1C]/8 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#FAFAFA]">
                    <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">
                      #{i + 1}
                    </span>
                    <span className="text-[11px] font-bold flex-1">{a.nickname}</span>
                    {(method === 'differential' || method === 'custom') ? (
                      <input
                        type="number"
                        value={a.amount}
                        min={0}
                        onChange={(e) =>
                          setAllocations((prev) =>
                            prev.map((x) =>
                              x.reviewer_id === a.reviewer_id ? { ...x, amount: Number(e.target.value) } : x
                            )
                          )
                        }
                        className="w-28 h-8 rounded-lg bg-white border border-[#1D1C1C]/10 outline-none px-2 text-[11px] font-bold text-right"
                      />
                    ) : (
                      <span className="text-[11px] font-black text-[#1D1C1C]">{fmt(a.amount)}원</span>
                    )}
                    <button
                      onClick={() => setExpanded(a.reviewer_id)}
                      className="text-[#999] hover:text-[#1D1C1C]"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {isExpanded && rev && (
                    <div className="px-4 py-3 border-t border-[#1D1C1C]/5">
                      <p className="text-[10px] font-bold text-[#999] mb-2">원문 응답</p>
                      <pre className="text-[10px] text-[#666] font-bold whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(rev.answers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 하단 검증 + 확정 버튼 */}
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-2 mb-4">
            <ValidationBadge
              ok={totalAllocated === budget}
              label={`합계 ${fmt(totalAllocated)} / ${fmt(budget)}원`}
            />
            <ValidationBadge
              ok={allocations.every((a) => a.amount >= MIN_AMOUNT)}
              label={`인당 최소 ${fmt(MIN_AMOUNT)}원 충족`}
            />
          </div>
          <button
            disabled={!isValid || submitting}
            onClick={handleSubmit}
            className={`w-full h-12 rounded-xl text-[13px] font-black transition-colors ${
              isValid && !submitting
                ? 'bg-[#F77019] text-white hover:bg-[#E05A00]'
                : 'bg-[#F5F5F5] text-[#999] cursor-not-allowed'
            }`}
          >
            {submitting ? '처리 중...' : '배분 확정'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/10 bg-white p-4 flex flex-col gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="text-[#F77019]">{icon}</div>
      <p className="text-[10px] font-bold text-[#999]">{label}</p>
      <p className="text-sm font-black text-[#1D1C1C]">{value}</p>
    </div>
  )
}

function ValidationBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${ok ? 'bg-green-50' : 'bg-[#F5F5F5]'}`}>
      <span className={`text-[11px] font-black ${ok ? 'text-green-600' : 'text-[#999]'}`}>
        {ok ? '✅' : '○'}
      </span>
      <span className={`text-[11px] font-bold ${ok ? 'text-green-700' : 'text-[#999]'}`}>{label}</span>
    </div>
  )
}
