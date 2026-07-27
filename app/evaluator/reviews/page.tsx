'use client'

import { CheckCircle2, Clock, Loader2, PlayCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'

type MyReview = {
  matchId: string
  projectId: string | null
  status: 'pending' | 'accepted' | 'completed' | 'dropped'
  appliedAt: string | null
  acceptedAt: string | null
  submittedAt: string | null
  project: { id: string; title: string; one_liner: string | null; target_count: number; completed_count: number } | null
  payout: { status: string; paidAt: string | null; amount: number } | null
}

type Tab = 'pending' | 'todo' | 'done'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR')
}

function PayoutBadge({ payout }: { payout: MyReview['payout'] }) {
  if (!payout) {
    return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1D1C1C]/5 text-[#999]">정산 대기</span>
  }
  if (payout.status === 'completed') {
    return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32]">입금 완료 · {payout.amount.toLocaleString()}원</span>
  }
  return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#F77019]/10 text-[#F77019]">정산 처리 중</span>
}

// "내 리뷰" — 헤더 nav에서 클릭하면 그냥 리뷰어 홈으로 튕기던 걸(구 리다이렉트
// 스텁) 실제 페이지로 교체. 지원했지만 아직 승인 안 된 것 / 시작해야 하는
// 리뷰(승인됐지만 아직 제출 전) / 지난 완료 리뷰 3개 탭 + 각 행에 사례금
// 입금 여부(distributions 테이블 기준)를 보여준다.
export default function MyReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('todo')

  useEffect(() => {
    fetch('/api/evaluator/my-reviews')
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews ?? []))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const pending = reviews.filter((r) => r.status === 'pending')
    const todo = reviews.filter((r) => r.status === 'accepted' && !r.submittedAt)
    const done = reviews.filter((r) => r.status === 'completed' || (r.status === 'accepted' && r.submittedAt))
    return { pending, todo, done }
  }, [reviews])

  const TABS: { key: Tab; label: string; icon: typeof Clock; list: MyReview[] }[] = [
    { key: 'pending', label: '지원했지만 미승인', icon: Clock, list: grouped.pending },
    { key: 'todo', label: '시작해야 하는 리뷰', icon: PlayCircle, list: grouped.todo },
    { key: 'done', label: '지난 참여 리뷰', icon: CheckCircle2, list: grouped.done },
  ]

  const activeList = TABS.find((t) => t.key === tab)?.list ?? []

  return (
    <ReviewerLayout>
      <div className="w-full flex flex-col gap-6 py-6">
        <div>
          <h1 className="text-xl font-black text-[#1D1C1C]">내 리뷰</h1>
          <p className="text-[11px] font-bold text-[#999] mt-1">지원 현황, 시작할 리뷰, 지난 참여 내역과 사례금 입금 여부를 한눈에 확인하세요</p>
        </div>

        <div className="flex gap-1 bg-white border border-[#1D1C1C]/8 rounded-2xl p-1 w-fit shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                tab === t.key ? 'bg-[#1D1C1C] text-white shadow-sm' : 'text-[#999] hover:text-[#1D1C1C]'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label} {t.list.length > 0 && `(${t.list.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
          </div>
        ) : activeList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-[#1D1C1C]/15 p-12 text-center">
            <p className="text-[12px] font-bold text-[#999]">해당하는 리뷰가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeList.map((r) => (
              <div
                key={r.matchId}
                onClick={() => r.projectId && router.push(`/evaluator/projects/${r.projectId}`)}
                className="bg-white rounded-2xl border border-[#1D1C1C]/8 p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-[#189DF7]/30 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[13px] font-black text-[#1D1C1C] truncate">{r.project?.title ?? '(삭제된 프로젝트)'}</span>
                  <span className="text-[10px] font-bold text-[#999] truncate">{r.project?.one_liner}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-[#999]">지원 {fmtDate(r.appliedAt)}</span>
                    {r.acceptedAt && <span className="text-[9px] font-bold text-[#999]">· 승인 {fmtDate(r.acceptedAt)}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {tab === 'done' ? <PayoutBadge payout={r.payout} /> : (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#189DF7]/10 text-[#189DF7]">
                      {r.status === 'pending' ? '승인 대기 중' : '리뷰 작성하기 →'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ReviewerLayout>
  )
}
