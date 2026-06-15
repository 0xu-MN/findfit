'use client'

import DashboardLayout from '@/components/shared/DashboardLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Match = {
  id: string
  project_id: string
  nickname: string | null
  accepted_at: string | null
  submitted_at: string | null
  projects?: {
    title: string
    status: string
    review_type: string | null
    deadline: string | null
  } | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: '진행 중',   color: '#1565C0' },
  closed:    { label: '마감',      color: '#999' },
  completed: { label: '완료',      color: '#2E7D32' },
  draft:     { label: '준비 중',   color: '#999' },
}

function ReviewsContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('project_matches')
        .select('*, projects(title, status, review_type, deadline)')
        .eq('reviewer_id', user.id)
        .order('accepted_at', { ascending: false })

      setMatches(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const pending = matches.filter((m) => !m.submitted_at)
  const done = matches.filter((m) => m.submitted_at)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">참여 리뷰</h1>
        <span className="text-[11px] font-bold text-[#999]">총 {matches.length}건</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-[#999] animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-12 text-center">
          <p className="text-[11px] font-bold text-[#999]">참여한 리뷰가 없습니다</p>
          <button
            onClick={() => router.push('/evaluator/available')}
            className="mt-4 h-9 px-5 rounded-xl bg-[#1565C0] text-white text-[11px] font-black hover:opacity-90"
          >
            의뢰 둘러보기
          </button>
        </div>
      ) : (
        <>
          {/* 미제출 */}
          {pending.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-[11px] font-black text-[#999] uppercase tracking-wider">리뷰 작성 필요 ({pending.length})</p>
              <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="divide-y divide-[#1D1C1C]/5">
                  {pending.map((m) => {
                    const s = STATUS_LABEL[m.projects?.status ?? ''] ?? { label: m.projects?.status ?? '—', color: '#999' }
                    const deadline = m.projects?.deadline
                    return (
                      <button
                        key={m.id}
                        onClick={() => router.push(`/evaluator/review/${m.project_id}`)}
                        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-[#FAFAFA] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#1565C0]/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-[#1565C0]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-[#1D1C1C] truncate">
                            {m.projects?.title ?? '프로젝트'}
                          </p>
                          <p className="text-[10px] text-[#999] font-bold mt-0.5">
                            닉네임: {m.nickname ?? '—'}
                            {deadline && ` · 마감 ${new Date(deadline).toLocaleDateString('ko-KR')}`}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0"
                          style={{ color: s.color, background: `${s.color}10` }}
                        >
                          {s.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 제출 완료 */}
          {done.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-[11px] font-black text-[#999] uppercase tracking-wider">제출 완료 ({done.length})</p>
              <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="divide-y divide-[#1D1C1C]/5">
                  {done.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-[#1D1C1C] truncate">
                          {m.projects?.title ?? '프로젝트'}
                        </p>
                        <p className="text-[10px] text-[#999] font-bold mt-0.5">
                          제출 {m.submitted_at ? new Date(m.submitted_at).toLocaleDateString('ko-KR') : '—'}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                        제출 완료
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default function EvaluatorReviewsPage() {
  return (
    <DashboardLayout role="reviewer" rightPanel={<SharedLoungeFeed />}>
      <ReviewsContent />
    </DashboardLayout>
  )
}
