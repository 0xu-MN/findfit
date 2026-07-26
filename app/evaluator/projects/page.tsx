'use client'

import { useEffect, useMemo, useState } from 'react'
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import ProjectCardExpandable, {
  type CardMatch,
  type CardProject,
} from '@/components/evaluator/ProjectCardExpandable'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  SlidersHorizontal,
  Loader2,
  LayoutGrid,
  List,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

const CATEGORY_TABS = [
  '전체',
  '식품/음료',
  '뷰티/헬스케어',
  'IT/프로그래밍',
  '디자인',
  '마케팅',
  '반려동물',
  '패션/의류',
  '생활/홈',
  '기획',
]

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'incentive', label: '사례금 높은순' },
  { value: 'participants', label: '참여자 많은순' },
]

type MatchRow = {
  id: string
  project_id: string
  status: 'pending' | 'accepted' | 'completed' | 'dropped'
  nickname: string | null
  shipping_status: string | null
  shipping_address: string | null
  received_confirmed_at: string | null
}

export default function EvaluatorProjectsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<CardProject[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('전체')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const [matchRows, feedRes] = await Promise.all([
        user
          ? supabase
              .from('project_matches')
              .select('id, project_id, status, nickname, shipping_status, shipping_address, received_confirmed_at')
              .eq('reviewer_id', user.id)
              .then(({ data }) => data ?? [])
          : Promise.resolve([]),
        fetch('/api/projects/feed')
          .then((r) => r.json())
          .catch(() => ({ all: [] })),
      ])

      setMatches(matchRows as MatchRow[])
      setProjects((feedRes.all ?? []) as CardProject[])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const matchMap = useMemo(() => {
    const map: Record<string, MatchRow> = {}
    for (const m of matches) map[m.project_id] = m
    return map
  }, [matches])

  const filtered = useMemo(() => {
    let list = [...projects]

    // Category filter
    if (activeCategory !== '전체') {
      list = list.filter((p) => p.categories?.includes(activeCategory))
    }

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.one_liner?.toLowerCase().includes(q) ||
          p.categories?.some((c) => c.toLowerCase().includes(q))
      )
    }

    // Sort
    switch (sortBy) {
      case 'incentive':
        list = list.sort(
          (a, b) => (b.incentive_budget ?? 0) - (a.incentive_budget ?? 0)
        )
        break
      case 'participants':
        list = list.sort(
          (a, b) => (b.completed_count ?? 0) - (a.completed_count ?? 0)
        )
        break
      default:
        // newest — keep API order (already newest-first)
        break
    }

    return list
  }, [projects, activeCategory, query, sortBy])

  const handleApplied = () => {
    // Refresh match data
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('project_matches')
        .select('id, project_id, status, nickname, shipping_status, shipping_address, received_confirmed_at')
        .eq('reviewer_id', user.id)
        .then(({ data }) => setMatches((data ?? []) as MatchRow[]))
    })
  }

  return (
    <ReviewerLayout>
      <div className="flex flex-col gap-8 py-2">

        {/* ── Page Header ── */}
        <div
          className="w-full rounded-[32px] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 70%, #1A237E 100%)',
          }}
        >
          {/* Decorative glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-20 blur-3xl bg-white" />
            <Sparkles className="absolute right-10 bottom-4 w-32 h-32 text-white/10" />
          </div>

          <div className="relative z-10 flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/25 self-start">
              <TrendingUp className="w-3 h-3" />
              전체 프로젝트 탐색
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              지금 모집 중인 의뢰를 모두 둘러보세요
            </h1>
            <p className="text-sm font-medium text-white/75">
              {loading ? '로딩 중...' : `총 ${projects.length}개의 검증 의뢰가 등록되어 있습니다`}
            </p>
          </div>
        </div>

        {/* ── Filter / Search Bar ── */}
        <div className="flex flex-col gap-4">
          {/* Search + Sort + View toggle row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-[#1D1C1C]/10 rounded-xl px-4 py-2.5 focus-within:border-[#1565C0] transition-colors shadow-sm">
              <Search className="w-4 h-4 text-[#999] flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="프로젝트 제목, 카테고리 검색..."
                className="flex-1 bg-transparent outline-none text-sm font-medium text-[#1D1C1C] placeholder-[#BBB]"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white border border-[#1D1C1C]/10 text-xs font-bold text-[#1D1C1C] outline-none shadow-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                showFilters
                  ? 'bg-[#1565C0] text-white border-[#1565C0]'
                  : 'bg-white text-[#666] border-[#1D1C1C]/10 hover:border-[#1565C0]/40'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              필터
            </button>

            {/* View mode toggle */}
            <div className="flex items-center bg-[#F5F5F5] rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1D1C1C]' : 'text-[#999] hover:text-[#666]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1D1C1C]' : 'text-[#999] hover:text-[#666]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    active
                      ? 'bg-[#1565C0] text-white shadow-sm'
                      : 'bg-white text-[#666] border border-[#1D1C1C]/10 hover:border-[#1565C0]/40 hover:text-[#1565C0]'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#666]">
              <span className="text-[#1565C0] font-black">{filtered.length}</span>개의 프로젝트
              {activeCategory !== '전체' && (
                <span className="ml-1 text-[#999]">— {activeCategory}</span>
              )}
            </p>
          </div>
        )}

        {/* ── Project Cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-[#1565C0] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-white p-16 text-center">
            <p className="text-sm font-black text-[#999]">해당 조건의 프로젝트가 없습니다</p>
            <p className="text-xs text-[#BBB] font-medium mt-2">다른 카테고리나 검색어를 시도해보세요</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((project) => {
              const match = matchMap[project.id] ?? null
              return (
                <ProjectCardExpandable
                  key={project.id}
                  project={project}
                  match={match
                    ? {
                        id: match.id,
                        status: match.status,
                        nickname: match.nickname,
                        shipping_status: match.shipping_status,
                        shipping_address: match.shipping_address,
                        received_confirmed_at: match.received_confirmed_at,
                      }
                    : null}
                  onApplied={handleApplied}
                  onSubmitted={handleApplied}
                />
              )
            })}
          </div>
        ) : (
          /* List view */
          <div className="flex flex-col gap-3">
            {filtered.map((project) => {
              const match = matchMap[project.id] ?? null
              const matchedStatus = match?.status ?? null
              const net = project.incentive_exists && project.incentive_budget
                ? Math.floor(Math.floor(project.incentive_budget / project.target_count) * 0.8)
                : null
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between bg-white border border-[#1D1C1C]/8 rounded-2xl px-5 py-4 hover:border-[#1565C0]/30 hover:shadow-sm transition-all group cursor-pointer"
                  onClick={() => {}}
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {project.categories?.slice(0, 2).map((c) => (
                        <span key={c} className="text-[9px] font-bold text-[#1565C0] bg-[#1565C0]/10 px-2 py-0.5 rounded-md">{c}</span>
                      ))}
                      {matchedStatus && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          matchedStatus === 'accepted' ? 'bg-[#F77019]/10 text-[#F77019]' :
                          matchedStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {matchedStatus === 'accepted' ? '참여 중' : matchedStatus === 'completed' ? '완료' : '대기 중'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-[#1D1C1C] group-hover:text-[#1565C0] transition-colors line-clamp-1">
                      {project.title || project.one_liner || '(제목 없음)'}
                    </h3>
                    <p className="text-[11px] text-[#999] font-medium">
                      {project.completed_count}/{project.target_count}명 참여
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4 flex flex-col items-end gap-1">
                    {net ? (
                      <span className="text-sm font-black text-[#1565C0] bg-[#1565C0]/10 px-3 py-1.5 rounded-xl">
                        {net.toLocaleString('ko-KR')}원
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#999]">EXP 적립</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ReviewerLayout>
  )
}
