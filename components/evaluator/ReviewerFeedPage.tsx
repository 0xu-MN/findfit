'use client'

import { Briefcase, Clock, Coins, Loader2, Sparkles, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

// 피드 API 응답 타입 (app/api/projects/feed/route.ts와 동기화)
type FeedProject = {
  id: string
  title: string
  one_liner: string | null
  categories: string[]
  project_type: 'light' | 'standard' | 'deep'
  status: string
  completed_count: number
  target_count: number
  incentive_exists: boolean
  incentive_budget: number | null
  distribution_method: string | null
  created_at: string
  matchScore: number
  estimatedTime: string
}

const REVIEWER_ROLES = [
  'PM', 'PD', '마케터', '개발자', '디자이너', '기획자', '창업자', '직장인', '기타',
]

const TYPE_META: Record<string, { label: string; color: string }> = {
  light:    { label: 'Light',    color: '#1CAE66' },
  standard: { label: 'Standard', color: '#1565C0' },
  deep:     { label: 'Deep',     color: '#F77019' },
}

function fmt(n: number): string {
  return n.toLocaleString('ko-KR')
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return '오늘 등록'
  if (days === 1) return '어제 등록'
  if (days < 7) return `${days}일 전 등록`
  return new Date(iso).toLocaleDateString('ko-KR')
}

function calcReviewerNet(project: FeedProject): number {
  if (!project.incentive_exists || !project.incentive_budget) return 0
  const gross = Math.floor(project.incentive_budget / project.target_count)
  return Math.floor(gross * 0.8)
}

export default function ReviewerFeedPage() {
  const router = useRouter()
  const [myRole, setMyRole] = useState<string>('PM')
  const [projects, setProjects] = useState<FeedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'light' | 'standard'>('all')

  useEffect(() => {
    fetch('/api/projects/feed')
      .then((r) => r.json())
      .then((data) => { setProjects(data.all ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (typeFilter === 'all' ? projects : projects.filter((p) => p.project_type === typeFilter)),
    [projects, typeFilter],
  )

  const recommended = useMemo(() => filtered.filter((p) => p.matchScore >= 50), [filtered])
  const others      = useMemo(() => filtered.filter((p) => p.matchScore < 50),  [filtered])

  const go = (id: string) => router.push(`/evaluator/projects/${id}`)

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black">참여 가능 의뢰</h1>
          <p className="text-[11px] text-[#666] font-medium">
            내 직군에 매칭된 추천 의뢰부터 확인하세요 — 사례금은 수수료 20% 차감 후 실수령액으로 표시됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#1565C0]/15 bg-[#1565C0]/5">
          <Briefcase className="w-3.5 h-3.5 text-[#1565C0]" />
          <span className="text-[10px] font-bold text-[#666]">내 직군</span>
          <select
            value={myRole}
            onChange={(e) => setMyRole(e.target.value)}
            className="bg-transparent text-[12px] font-black text-[#1565C0] outline-none cursor-pointer"
          >
            {REVIEWER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
        <FilterPill active={typeFilter === 'all'}      onClick={() => setTypeFilter('all')}>전체</FilterPill>
        <FilterPill active={typeFilter === 'light'}    onClick={() => setTypeFilter('light')}>Light (설문형)</FilterPill>
        <FilterPill active={typeFilter === 'standard'} onClick={() => setTypeFilter('standard')}>Standard (설문형)</FilterPill>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-[#999] animate-spin" />
        </div>
      ) : (
        <>
          {/* 추천 섹션 */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F77019]" />
              <h2 className="text-sm font-black">
                내 분야 추천 <span className="text-[#999] text-xs font-bold">· {myRole}</span>
              </h2>
              <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-full">
                {recommended.length}건
              </span>
            </div>

            {recommended.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] p-8 text-center">
                <p className="text-[11px] font-bold text-[#999]">현재 매칭된 의뢰가 없습니다</p>
                <p className="text-[10px] font-medium text-[#CCC] mt-1">아래 전체 의뢰에서 다른 프로젝트도 확인해보세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recommended.map((p) => (
                  <ProjectCard key={p.id} project={p} recommended onClick={() => go(p.id)} />
                ))}
              </div>
            )}
          </section>

          {/* 전체 섹션 */}
          {others.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#666]" />
                <h2 className="text-sm font-black">전체 의뢰</h2>
                <span className="text-[10px] font-bold text-[#999] bg-[#F5F5F5] px-2 py-0.5 rounded-full">
                  {others.length}건
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {others.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => go(p.id)} />
                ))}
              </div>
            </section>
          )}

          {projects.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] p-12 text-center flex flex-col gap-2">
              <p className="text-sm font-black text-[#999]">아직 참여 가능한 의뢰가 없습니다</p>
              <p className="text-[11px] font-medium text-[#CCC]">크리에이터들이 의뢰를 등록하면 여기에 표시됩니다</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-8 rounded-full transition-colors ${
        active ? 'bg-[#1D1C1C] text-white' : 'bg-white border border-[#1D1C1C]/10 text-[#666] hover:border-[#1D1C1C]/30'
      }`}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────── */

function ProjectCard({
  project, recommended, onClick,
}: {
  project: FeedProject; recommended?: boolean; onClick: () => void
}) {
  const typeMeta = TYPE_META[project.project_type] ?? { label: project.project_type, color: '#999' }
  const net      = calcReviewerNet(project)
  const fillPct  = project.target_count > 0
    ? Math.round((project.completed_count / project.target_count) * 100) : 0

  return (
    <article
      onClick={onClick}
      className={`relative rounded-2xl border bg-white p-5 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${
        recommended ? 'border-[#F77019]/30 bg-[#FFF8F2]' : 'border-[#1D1C1C]/5'
      }`}
    >
      {recommended && (
        <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-[#F77019] text-white text-[9px] font-black flex items-center gap-1 shadow-sm">
          <Sparkles className="w-2.5 h-2.5" /> 추천
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white"
          style={{ background: typeMeta.color }}
        >
          {typeMeta.label}
        </span>
        {project.categories.slice(0, 2).map((c) => (
          <span key={c} className="text-[9px] font-bold text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">{c}</span>
        ))}
        <span className="text-[9px] text-[#999] font-medium ml-auto">{relativeDate(project.created_at)}</span>
      </div>

      <h3 className="text-[14px] font-black text-[#1D1C1C] leading-snug line-clamp-2 min-h-[2.6em]">
        {project.title || project.one_liner || '(제목 없음)'}
      </h3>

      <div className="flex items-center justify-between gap-4 py-2 border-y border-[#1D1C1C]/5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999] font-bold">실 수령액</span>
          {project.project_type === 'light' || !project.incentive_exists ? (
            <span className="text-[12px] font-black text-[#1D1C1C]">EXP 적립</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <Coins className="w-3 h-3 text-[#F77019]" />
              <span className="text-[13px] font-black text-[#F77019]">{fmt(net)}원</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-[9px] text-[#999] font-bold">소요 시간</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#666]" />
            <span className="text-[11px] font-bold text-[#1D1C1C]">{project.estimatedTime}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[9px] font-bold text-[#666]">
          <span>참여 현황</span>
          <span className="text-[#F77019]">{project.completed_count} / {project.target_count}명</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
          <div className="h-full rounded-full bg-[#F77019] transition-all" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      <button
        type="button"
        className="w-full py-2.5 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:bg-[#F77019] transition-colors mt-1"
      >
        자세히 보기
      </button>
    </article>
  )
}
