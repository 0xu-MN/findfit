'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Info,
  Loader2,
  PlusCircle,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ProjectRow = {
  id: string
  title: string
  status: string
  target_count: number
  completed_count: number
  deadline: string | null
  created_at: string
}

type FeedbackRow = {
  id: string
  answer_text: string
  created_at: string
  project_id: string
  review_questions: { question_text: string } | null
}

type ActivityRow = {
  id: string
  project_id: string
  nickname: string | null
  submitted_at: string | null
}

const PROGRESS_GRADIENT = 'linear-gradient(90deg, rgba(247,112,25,0.5) 0%, rgba(247,112,25,1) 100%)'

function relTime(iso: string | null) {
  if (!iso) return '—'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

/* ────────────────────────────────────────────── */
export default function CreatorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [creditBalance, setCreditBalance] = useState(0)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createClient()

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: userRow }, { data: projRows }, { data: creditRows }] = await Promise.all([
        supabase.from('users').select('nickname').eq('id', user.id).single(),
        supabase
          .from('projects')
          .select('id, title, status, target_count, completed_count, deadline, created_at')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('credit_transactions').select('amount').eq('user_id', user.id),
      ])

      setNickname(userRow?.nickname ?? null)
      const myProjects = (projRows ?? []) as ProjectRow[]
      setProjects(myProjects)
      setCreditBalance((creditRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0))

      const projectIds = myProjects.map((p) => p.id)
      if (projectIds.length > 0) {
        const [{ data: fbRows }, { data: actRows }] = await Promise.all([
          supabase
            .from('review_answers')
            .select('id, answer_text, created_at, project_id, review_questions(question_text)')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('project_matches')
            .select('id, project_id, nickname, submitted_at')
            .in('project_id', projectIds)
            .eq('status', 'completed')
            .order('submitted_at', { ascending: false })
            .limit(3),
        ])
        setFeedbacks((fbRows ?? []) as FeedbackRow[])
        setActivity((actRows ?? []) as ActivityRow[])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-[#F77019] animate-spin" />
      </div>
    )
  }

  const projectTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? '프로젝트'

  const activeProjects = projects.filter((p) => p.status === 'active')
  const draftProjects = projects.filter((p) => p.status === 'draft')
  const completedProjects = projects.filter((p) => p.status === 'completed')

  const topProjects = [...activeProjects]
    .sort((a, b) => (b.completed_count / (b.target_count || 1)) - (a.completed_count / (a.target_count || 1)))
    .slice(0, 3)

  const now = Date.now()
  const recruitAlerts = activeProjects
    .filter((p) => p.deadline && p.completed_count < p.target_count)
    .map((p) => ({ ...p, daysLeft: Math.ceil((new Date(p.deadline!).getTime() - now) / 86400000) }))
    .filter((p) => p.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3)

  const donutSegments = [
    { label: '진행 중', count: activeProjects.length, color: '#F77019' },
    { label: '작성 중', count: draftProjects.length, color: '#189DF7' },
    { label: '완료', count: completedProjects.length, color: '#1CAE66' },
  ]
  const donutTotal = projects.length || 1
  const avgCompletionRate = projects.length
    ? Math.round(
        (projects.reduce((s, p) => s + (p.target_count > 0 ? p.completed_count / p.target_count : 0), 0) /
          projects.length) *
          100
      )
    : 0
  const totalReviewers = projects.reduce((s, p) => s + p.completed_count, 0)

  return (
    <div className="w-full flex flex-col gap-5 text-[#1D1C1C]">
      {/* ═══ WELCOME HEADER ═══ */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Welcome, {nickname ?? '크리에이터'} 님 👋</h2>
          <p className="text-[11px] text-[#999] mt-1">오늘도 멋진 프로젝트를 만들어보세요!</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] p-16 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-black text-[#999]">아직 등록한 프로젝트가 없습니다</p>
          <button
            onClick={() => router.push('/builder/new-request')}
            className="mt-1 flex items-center gap-1.5 font-black rounded-2xl text-white text-xs px-6 py-3 hover:scale-[1.02] transition-all"
            style={{ background: 'linear-gradient(135deg,#F77019,#FF8F45)' }}
          >
            <PlusCircle className="w-4 h-4" /> 새 프로젝트 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4 items-stretch" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* ─────────── MAIN AREA ─────────── */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <OverviewCard
                donutSegments={donutSegments}
                donutTotal={donutTotal}
                totalProjects={projects.length}
                avgCompletionRate={avgCompletionRate}
                totalReviewers={totalReviewers}
              />
              <TopProjectsCard
                projects={topProjects}
                onAll={() => router.push('/builder/projects')}
                onOpen={(id) => router.push(`/builder/projects/${id}`)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <RecentFeedbackCard feedbacks={feedbacks} projectTitle={projectTitle} />
              <DraftsCard
                projects={draftProjects}
                onAll={() => router.push('/builder/projects')}
                onOpen={(id) => router.push(`/builder/projects/${id}`)}
              />
              <CompletedReportsCard
                projects={completedProjects}
                onAll={() => router.push('/builder/reports')}
                onOpen={(id) => router.push(`/builder/reports/${id}`)}
              />
            </div>
          </div>

          {/* ─────────── RIGHT SIDEBAR ─────────── */}
          <div className="flex flex-col gap-3 h-full">
            <button
              onClick={() => router.push('/builder/new-request')}
              className="w-full flex items-center justify-center gap-1.5 font-black rounded-2xl text-white text-sm py-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg,#F77019,#FF8F45)',
                boxShadow: '0 6px 16px rgba(247,112,25,0.28)',
              }}
            >
              <PlusCircle className="w-4 h-4" />새 프로젝트 등록하기
            </button>

            <FitCreditCard balance={creditBalance} onViewAll={() => router.push('/builder/wallet')} />
            <RecentActivityCard activity={activity} projectTitle={projectTitle} />
            <RecruitAlertsCard
              alerts={recruitAlerts}
              className="flex-1"
              onOpen={(id) => router.push(`/builder/projects/${id}`)}
            />
          </div>
        </div>
      )}

      {/* ═══ SYSTEM NOTICE ═══ */}
      <div className="w-full rounded-xl border border-[#1D1C1C]/5 bg-white p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertCircle className="w-4 h-4 text-[#F77019] flex-shrink-0" />
          <span className="font-extrabold text-[#1D1C1C] flex-shrink-0">시스템 공지:</span>
          <span className="text-[#666] truncate">
            전문 평가단 등급 세분화 패치가 완료되었습니다. 전문가 패널 검증 단가가 인상되었습니다.
          </span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button className="font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5 text-[10px]">
            1:1 Q&A <ChevronRight className="w-3 h-3" />
          </button>
          <button className="font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5 text-[10px]">
            가이드 북 <ChevronRight className="w-3 h-3" />
          </button>
          <button className="font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5 text-[10px]">
            FAQ 확인 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  한눈에 보기                                              */
/* ─────────────────────────────────────────────────────── */

function OverviewCard({
  donutSegments,
  donutTotal,
  totalProjects,
  avgCompletionRate,
  totalReviewers,
}: {
  donutSegments: { label: string; count: number; color: string }[]
  donutTotal: number
  totalProjects: number
  avgCompletionRate: number
  totalReviewers: number
}) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  let acc = 0
  const segments = donutSegments.map((s) => {
    const pct = (s.count / donutTotal) * 100
    const dash = (pct / 100) * circumference
    const seg = { dash, gap: circumference - dash, offset: -acc, color: s.color }
    acc += dash
    return seg
  })

  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-black text-[#1D1C1C]">한눈에 보기</span>
        <Info className="w-3 h-3 text-[#F77019]" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#F5F5F5" strokeWidth="13" />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="13"
                strokeLinecap="butt"
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={s.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-[#999] font-bold">총 프로젝트</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-[#1D1C1C] leading-none">{totalProjects}</span>
              <span className="text-sm font-bold text-[#666]">개</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2.5">
          {donutSegments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span style={{ color: s.color }}>
                {s.label} {s.count} ({donutTotal > 0 ? Math.round((s.count / donutTotal) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1D1C1C]/5">
        <MetricTile label="누적 참여 리뷰어" value={fmt(totalReviewers)} unit="명" />
        <MetricTile label="평균 모집 진행률" value={String(avgCompletionRate)} unit="%" />
      </div>
    </div>
  )
}

function MetricTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[9px] text-[#999] font-bold truncate">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-base font-black text-[#1D1C1C] leading-none">{value}</span>
        {unit && <span className="text-[9px] text-[#999] font-bold">{unit}</span>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  진행 중 프로젝트 TOP 3                                    */
/* ─────────────────────────────────────────────────────── */

function TopProjectsCard({
  projects,
  onAll,
  onOpen,
}: {
  projects: ProjectRow[]
  onAll: () => void
  onOpen: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center">
        <span className="text-xs font-black text-[#1D1C1C]">진행 중 프로젝트 TOP 3</span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {projects.length === 0 ? (
          <EmptyRow text="진행 중인 프로젝트가 없습니다" />
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate group-hover:text-[#F77019] transition-colors">
                  {p.title || '(제목 미작성)'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.target_count > 0 ? (p.completed_count / p.target_count) * 100 : 0}%`,
                        background: PROGRESS_GRADIENT,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-[#999] font-bold flex-shrink-0">
                    평가 {p.completed_count} / {p.target_count}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ViewAllBtn label="진행 중 프로젝트 전체 보기" onClick={onAll} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  최근 리뷰어 피드백                                        */
/* ─────────────────────────────────────────────────────── */

function RecentFeedbackCard({
  feedbacks,
  projectTitle,
}: {
  feedbacks: FeedbackRow[]
  projectTitle: (id: string) => string
}) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center">
        <span className="text-[11px] font-black text-[#1D1C1C]">최근 리뷰어 피드백</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {feedbacks.length === 0 ? (
          <EmptyRow text="아직 도착한 피드백이 없습니다" />
        ) : (
          feedbacks.map((f) => (
            <div
              key={f.id}
              className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-[#999] truncate">
                  {projectTitle(f.project_id)} · {f.review_questions?.question_text ?? ''}
                </span>
                <span className="text-[10px] font-extrabold text-[#1D1C1C] leading-snug line-clamp-2">
                  {f.answer_text}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  작성 중 프로젝트                                          */
/* ─────────────────────────────────────────────────────── */

function DraftsCard({
  projects,
  onAll,
  onOpen,
}: {
  projects: ProjectRow[]
  onAll: () => void
  onOpen: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#999]" />
        <span className="text-[11px] font-black text-[#666]">작성 중 프로젝트</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {projects.length === 0 ? (
          <EmptyRow text="작성 중인 프로젝트가 없습니다" />
        ) : (
          projects.map((d) => (
            <div
              key={d.id}
              onClick={() => onOpen(d.id)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate group-hover:text-[#F77019] transition-colors">
                  {d.title || '(제목 미작성)'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <ViewAllBtn label="작성 중 프로젝트 전체 보기" onClick={onAll} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  완료된 리포트                                            */
/* ─────────────────────────────────────────────────────── */

function CompletedReportsCard({
  projects,
  onAll,
  onOpen,
}: {
  projects: ProjectRow[]
  onAll: () => void
  onOpen: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#1565C0]" />
        <span className="text-[11px] font-black text-[#666]">완료된 리포트</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {projects.length === 0 ? (
          <EmptyRow text="완료된 리포트가 없습니다" />
        ) : (
          projects.map((r) => (
            <div
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold text-[#1D1C1C] truncate block group-hover:text-[#F77019] transition-colors">
                  {r.title || '(제목 미작성)'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <ViewAllBtn label="완료된 리포트 전체 보기" onClick={onAll} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  Fit Credit                                              */
/* ─────────────────────────────────────────────────────── */

function FitCreditCard({ balance, onViewAll }: { balance: number; onViewAll: () => void }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(247,112,25,0.06)', border: '1.5px solid #F77019' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-black text-[#1D1C1C]">Fit Credit</span>
        <button
          onClick={onViewAll}
          className="text-[10px] font-bold text-[#F77019] hover:underline flex items-center gap-0.5"
        >
          Fit Credit 내역 보기 <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#666] font-bold">사용 가능 잔액</span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-2xl font-black text-[#1D1C1C]">{fmt(balance)}</span>
          <Wallet className="w-4 h-4 text-[#F77019]" />
        </div>
      </div>

      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F77019] text-white text-xs font-black hover:opacity-90 transition-all shadow-sm"
        style={{ boxShadow: '0 4px 12px rgba(247,112,25,0.25)' }}
      >
        <PlusCircle className="w-3.5 h-3.5" /> 충전하기
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  최근 활동                                                */
/* ─────────────────────────────────────────────────────── */

function RecentActivityCard({
  activity,
  projectTitle,
}: {
  activity: ActivityRow[]
  projectTitle: (id: string) => string
}) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-4 flex flex-col gap-3">
      <span className="text-[12px] font-black text-[#1D1C1C]">최근 활동</span>
      <div className="flex flex-col gap-2.5">
        {activity.length === 0 ? (
          <EmptyRow text="아직 활동 내역이 없습니다" />
        ) : (
          activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-[10px]">
              <span className="text-[#1D1C1C] font-bold truncate pr-2">
                {projectTitle(a.project_id)} · {a.nickname ?? '익명 리뷰어'} 평가 완료
              </span>
              <span className="text-[#999] text-[9px] font-medium flex-shrink-0">{relTime(a.submitted_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  모집 속도 관리                                            */
/* ─────────────────────────────────────────────────────── */

function RecruitAlertsCard({
  alerts,
  className = '',
  onOpen,
}: {
  alerts: (ProjectRow & { daysLeft: number })[]
  className?: string
  onOpen: (id: string) => void
}) {
  return (
    <div className={`rounded-2xl border border-[#1D1C1C]/5 bg-white p-4 flex flex-col gap-3 ${className}`}>
      <span className="text-[12px] font-black text-[#1D1C1C]">모집 속도 관리</span>

      <div className="flex flex-col gap-2 flex-1">
        {alerts.length === 0 ? (
          <EmptyRow text="마감이 임박한 프로젝트가 없습니다" />
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-[#F77019]/15 bg-[#FFF8F2]"
            >
              <AlertTriangle className="w-4 h-4 text-[#F77019] flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-[10px] font-extrabold text-[#1D1C1C] truncate">{a.title || '(제목 미작성)'}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[#999] font-medium">
                    현재 {a.completed_count}/{a.target_count}명 참여
                  </span>
                  <span className="text-[8px] font-black text-white bg-[#E53935] px-1.5 py-0.5 rounded">
                    D-{Math.max(a.daysLeft, 0)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onOpen(a.id)}
                className="text-[9px] font-black text-white bg-[#F77019] px-2 py-1.5 rounded-md hover:opacity-90 transition-all flex-shrink-0"
              >
                확인하기
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-[#FAFAFA] p-4 text-center">
      <p className="text-[10px] font-bold text-[#999]">{text}</p>
    </div>
  )
}

function ViewAllBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="self-end text-[10px] font-bold text-[#999999] hover:text-[#666] transition-colors flex items-center gap-0.5"
    >
      {label} <ArrowRight className="w-2.5 h-2.5" />
    </button>
  )
}
