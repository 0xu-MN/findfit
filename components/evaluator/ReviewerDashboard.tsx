'use client'

import {
  Sparkles,
  Wallet,
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Coins,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FeedProject = {
  id: string
  title: string
  one_liner: string | null
  categories: string[]
  target_count: number
  completed_count: number
  incentive_exists: boolean
  incentive_budget: number | null
  matchScore: number
  estimatedTime: string
}

type ActiveMatch = {
  id: string
  project_id: string
  status: string
  accepted_at: string | null
  projects: { title: string } | null
}

type PastMatch = {
  id: string
  project_id: string
  submitted_at: string | null
  projects: { title: string } | null
}

const LEVEL_LABEL: Record<string, string> = {
  general: '일반 평가단',
  expert: '전문가',
  domain: '도메인 전문가',
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

function calcNet(p: FeedProject): number {
  if (!p.incentive_exists || !p.incentive_budget) return 0
  return Math.floor(Math.floor(p.incentive_budget / p.target_count) * 0.8)
}

function relDate(iso: string | null) {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function ReviewerDashboard() {
  const router = useRouter()
  const [nickname, setNickname] = useState<string | null>(null)
  const [level, setLevel] = useState<string>('general')
  const [feed, setFeed] = useState<FeedProject[]>([])
  const [active, setActive] = useState<ActiveMatch[]>([])
  const [past, setPast] = useState<PastMatch[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createClient()

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [
        { data: userRow },
        { data: profile },
        { data: matches },
        { data: distributions },
        feedRes,
      ] = await Promise.all([
        supabase.from('users').select('nickname').eq('id', user.id).single(),
        supabase.from('reviewer_profiles').select('level').eq('user_id', user.id).single(),
        supabase
          .from('project_matches')
          .select('id, project_id, status, accepted_at, submitted_at, projects(title)')
          .eq('reviewer_id', user.id)
          .order('applied_at', { ascending: false }),
        supabase.from('distributions').select('amount, net_amount, status').eq('reviewer_id', user.id),
        fetch('/api/projects/feed').then((r) => r.json()).catch(() => ({ all: [] })),
      ])

      setNickname(userRow?.nickname ?? null)
      setLevel(profile?.level ?? 'general')

      const allMatches = (matches ?? []) as (ActiveMatch & { submitted_at: string | null })[]
      setActive(allMatches.filter((m) => m.status === 'accepted'))
      setPast(
        allMatches
          .filter((m) => m.status === 'completed')
          .slice(0, 5)
      )

      const dists = (distributions ?? []) as { amount: number; net_amount: number | null; status: string }[]
      setTotalEarned(
        dists.filter((d) => d.status === 'completed').reduce((s, d) => s + (d.net_amount ?? d.amount), 0)
      )
      setPendingTotal(
        dists.filter((d) => d.status !== 'completed').reduce((s, d) => s + d.amount, 0)
      )

      setFeed(((feedRes.all ?? []) as FeedProject[]).slice(0, 3))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-[#1565C0] animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6 select-none text-[#1D1C1C] pr-2">

      {/* ── Welcome Banner Card ── */}
      <div
        className="w-full rounded-[32px] border p-8 flex items-center justify-between relative overflow-hidden group shadow-[0_8px_32px_rgba(21,101,192,0.06)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.85) 100%)',
          borderColor: 'rgba(21,101,192,0.15)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col max-w-[700px] z-10">
          <div className="inline-flex items-center gap-1 text-[10px] font-black text-[#1565C0] mb-3 bg-[#1565C0]/10 px-2.5 py-1 rounded-full uppercase tracking-wider self-start border border-[#1565C0]/15">
            <Sparkles className="w-3 h-3 animate-pulse" /> Reviewer Dashboard
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Welcome, {nickname ?? '리뷰어'} 님! 🌟
          </h2>
          <p className="text-xs text-[#666] leading-relaxed">
            세상에 없던 신제품과 혁신적인 스타트업 아이디어를 누구보다 먼저 체험하세요. 날카롭고 구조적인 리뷰를 남기면, 창업자의 인생 의사결정이 변하고 확실한 포인트 보상이 찾아옵니다.
          </p>
        </div>

        <button
          onClick={() => router.push('/evaluator/available')}
          className="flex items-center gap-2 font-black rounded-full text-white text-xs px-6 py-4 hover:scale-[1.03] active:scale-[0.98] transition-all z-10 cursor-pointer shadow-md"
          style={{
            background: 'linear-gradient(135deg, #1565C0 0%, #1e5bb0 100%)',
            boxShadow: '0 8px 24px rgba(21,101,192,0.25)',
          }}
        >
          <BookOpen className="w-4 h-4" />
          오늘의 신제품 리뷰하기
        </button>
      </div>

      {/* ── Main Dashboard Grids ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Widget 1: Earnings Wallet */}
        <div
          className="col-span-4 rounded-[28px] border p-6 flex flex-col justify-between"
          style={{ background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(21,101,192,0.08)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-[#666] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#1565C0]" />
              내 정산 현황
            </h3>
          </div>

          <div className="flex flex-col mb-4">
            <span className="text-3xl font-black text-[#1565C0] tracking-tight">{fmt(totalEarned)}원</span>
            <span className="text-[9px] text-[#999] font-bold mt-1">정산 대기 중: {fmt(pendingTotal)}원</span>
          </div>

          <div className="h-px bg-[#1D1C1C]/5 w-full my-2" />

          <button
            onClick={() => router.push('/evaluator/wallet')}
            className="w-full py-3.5 rounded-2xl text-[10px] font-black border border-[#1565C0] text-[#1565C0] bg-[#1565C0]/5 hover:bg-[#1565C0] hover:text-white transition-all"
          >
            포인트 지갑 자세히 보기
          </button>
        </div>

        {/* Widget 2: Level */}
        <div
          className="col-span-8 rounded-[28px] border p-6 flex flex-col justify-between shadow-sm"
          style={{ background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(21,101,192,0.12)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#1D1C1C] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#1565C0]" />
              평가 등급 및 전문 분야
            </h3>
            <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-md border border-[#F77019]/15">
              {LEVEL_LABEL[level] ?? level}
            </span>
          </div>

          <p className="text-[11px] text-[#666] font-semibold">
            전문 분야 관심 태그는 프로필에서 설정할 수 있어요 — 매칭 점수에 반영됩니다.
          </p>
          <button
            onClick={() => router.push('/evaluator/profile')}
            className="w-fit mt-3 text-[10px] font-black text-[#1565C0] hover:underline flex items-center gap-0.5"
          >
            프로필 설정하기 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* ── Secondary Grids ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Widget 3: Available Review Tasks */}
        <div
          className="col-span-7 rounded-[28px] border p-6 flex flex-col justify-between"
          style={{ background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(21,101,192,0.08)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#1D1C1C] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#1565C0]" />
              참여 가능한 오늘의 신제품 검증 의뢰
            </h3>
            <button
              onClick={() => router.push('/evaluator/available')}
              className="text-[10px] font-black text-[#1565C0] hover:underline flex items-center gap-0.5"
            >
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {feed.length === 0 ? (
              <div className="rounded-2xl bg-[#1D1C1C]/3 p-6 text-center">
                <p className="text-[11px] font-bold text-[#999]">현재 참여 가능한 의뢰가 없습니다</p>
              </div>
            ) : (
              feed.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/evaluator/projects/${p.id}`)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1D1C1C]/3 border border-[#1D1C1C]/5 hover:border-[#1565C0]/30 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex flex-col max-w-[340px]">
                    <span className="text-xs font-black text-[#1D1C1C] group-hover:text-[#1565C0] transition-colors leading-snug line-clamp-1">
                      {p.title || p.one_liner || '(제목 없음)'}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      {p.categories.slice(0, 2).map((c) => (
                        <span key={c} className="text-[9px] text-[#999] font-bold">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs font-black text-[#1565C0] bg-[#1565C0]/10 px-2.5 py-1 rounded-lg">
                      {p.incentive_exists ? `${fmt(calcNet(p))}원` : 'EXP 적립'}
                    </span>
                    <span className="text-[9px] text-[#666] mt-1.5 flex items-center gap-0.5 font-bold">
                      <Clock className="w-3 h-3 text-[#999]" />
                      {p.completed_count}/{p.target_count}명 참여
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 4: 진행 중 + 최근 완료 */}
        <div
          className="col-span-5 rounded-[28px] border p-6 flex flex-col justify-between"
          style={{ background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(21,101,192,0.08)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#1D1C1C] uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#1565C0]" />
              내 참여 현황
            </h3>
            <button
              onClick={() => router.push('/evaluator/reviews')}
              className="text-[10px] font-black text-[#1565C0] hover:underline flex items-center gap-0.5"
            >
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {active.length === 0 && past.length === 0 ? (
            <div className="rounded-2xl bg-[#1D1C1C]/3 p-6 text-center">
              <p className="text-[11px] font-bold text-[#999]">아직 참여한 리뷰가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {active.map((m) => (
                <div
                  key={m.id}
                  onClick={() => router.push(`/evaluator/review/${m.project_id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F77019]/5 border border-[#F77019]/15 text-[10px] cursor-pointer hover:border-[#F77019]/30 transition-colors"
                >
                  <span className="font-extrabold text-[#1D1C1C] truncate max-w-[180px]">
                    {m.projects?.title ?? '프로젝트'}
                  </span>
                  <span className="text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded font-black text-[9px] flex-shrink-0">
                    평가 작성 필요
                  </span>
                </div>
              ))}
              {past.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1D1C1C]/3 border border-[#1D1C1C]/5 text-[10px]"
                >
                  <div className="flex flex-col max-w-[200px]">
                    <span className="font-extrabold text-[#1D1C1C] truncate">{m.projects?.title ?? '프로젝트'}</span>
                    <span className="text-[#999] mt-0.5 text-[9px] font-bold">{relDate(m.submitted_at)} 제출</span>
                  </div>
                  <span className="text-[#2E7D32] bg-[#2E7D32]/10 px-1.5 py-0.5 rounded font-black text-[9px] flex-shrink-0">
                    제출 완료
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
