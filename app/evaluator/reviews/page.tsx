'use client'

import DashboardLayout from '@/components/shared/DashboardLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, Loader2, Pencil, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type MatchStatus = 'pending' | 'accepted' | 'completed' | 'dropped'

type Match = {
  id: string
  project_id: string
  nickname: string | null
  status: MatchStatus
  applied_at: string | null
  accepted_at: string | null
  completed_at: string | null
  projects?: {
    title: string
    project_type: string | null
  } | null
}

const STATUS_CONFIG: Record<MatchStatus, {
  label: string; color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: any
}> = {
  pending:   { label: '검토 중',       color: '#1565C0', Icon: Clock        },
  accepted:  { label: '평가 작성 필요', color: '#F77019', Icon: Pencil       },
  completed: { label: '제출 완료',     color: '#2E7D32', Icon: CheckCircle2 },
  dropped:   { label: '거절됨',        color: '#999',    Icon: XCircle      },
}

function dateStr(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR')
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
        .select('id, project_id, nickname, status, applied_at, accepted_at, completed_at, projects(title, project_type)')
        .eq('reviewer_id', user.id)
        .order('applied_at', { ascending: false })

      setMatches(data ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const accepted  = matches.filter((m) => m.status === 'accepted')
  const pending   = matches.filter((m) => m.status === 'pending')
  const completed = matches.filter((m) => m.status === 'completed')
  const dropped   = matches.filter((m) => m.status === 'dropped')

  const renderGroup = (title: string, items: Match[], clickable: boolean) => {
    if (items.length === 0) return null
    return (
      <section className="flex flex-col gap-2">
        <p className="text-[11px] font-black text-[#999] uppercase tracking-wider">
          {title} ({items.length})
        </p>
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="divide-y divide-[#1D1C1C]/5">
            {items.map((m) => {
              const cfg = STATUS_CONFIG[m.status]
              const Tag = clickable ? 'button' : 'div'
              return (
                <Tag
                  key={m.id}
                  onClick={clickable ? () => router.push(`/evaluator/review/${m.project_id}`) : undefined}
                  className={`w-full flex items-center gap-3 px-6 py-4 transition-colors text-left ${
                    clickable ? 'hover:bg-[#FAFAFA] cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-[#1D1C1C] truncate">
                      {m.projects?.title ?? '프로젝트'}
                    </p>
                    <p className="text-[10px] text-[#999] font-bold mt-0.5">
                      {m.nickname && `${m.nickname} · `}
                      {m.status === 'pending'   && `지원일 ${dateStr(m.applied_at)}`}
                      {m.status === 'accepted'  && `수락일 ${dateStr(m.accepted_at)}`}
                      {m.status === 'completed' && `제출일 ${dateStr(m.completed_at)}`}
                      {m.status === 'dropped'   && '이번에는 매칭이 어려웠어요'}
                    </p>
                  </div>

                  <span
                    className="text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ color: cfg.color, background: `${cfg.color}12` }}
                  >
                    {cfg.label}
                  </span>
                </Tag>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

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
          {renderGroup('평가 작성 필요', accepted, true)}
          {renderGroup('검토 중', pending, false)}
          {renderGroup('제출 완료', completed, false)}
          {renderGroup('거절됨', dropped, false)}
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
