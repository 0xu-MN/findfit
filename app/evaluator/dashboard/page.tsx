'use client'

import { Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import ProjectCardExpandable, { type CardMatch, type CardProject } from '@/components/evaluator/ProjectCardExpandable'
import { createClient } from '@/lib/supabase/client'

type MatchRow = {
  id: string
  project_id: string
  status: 'pending' | 'accepted' | 'completed' | 'dropped'
  nickname: string | null
  shipping_status: string | null
  shipping_address: string | null
  received_confirmed_at: string | null
}

const STATUS_ORDER: Record<string, number> = { accepted: 0, pending: 1, available: 2, completed: 3, dropped: 4 }

export default function EvaluatorDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [projectsById, setProjectsById] = useState<Record<string, CardProject>>({})
  const [feedIds, setFeedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: matchRows }, feedRes] = await Promise.all([
      supabase
        .from('project_matches')
        .select('id, project_id, status, nickname, shipping_status, shipping_address, received_confirmed_at')
        .eq('reviewer_id', user.id)
        .order('applied_at', { ascending: false }),
      fetch('/api/projects/feed').then((r) => r.json()).catch(() => ({ all: [] })),
    ])

    const myMatches = (matchRows ?? []) as MatchRow[]
    setMatches(myMatches)

    const feedProjects = (feedRes.all ?? []) as CardProject[]
    const matchedIds = new Set(myMatches.map((m) => m.project_id))
    const availableFeed = feedProjects.filter((p) => !matchedIds.has(p.id))
    setFeedIds(availableFeed.map((p) => p.id))

    const byId: Record<string, CardProject> = {}
    for (const p of feedProjects) byId[p.id] = p

    // 피드(status='active'만)엔 없지만 내가 지원한 프로젝트(완료/거절/모집마감된
    // 것 포함)는 projects_public에서 따로 채워야 카드에 제목 등이 표시된다.
    const missingIds = myMatches.map((m) => m.project_id).filter((id) => !byId[id])
    if (missingIds.length > 0) {
      const { data: extraProjects } = await supabase
        .from('projects_public')
        .select('*')
        .in('id', missingIds)
      for (const p of (extraProjects ?? []) as CardProject[]) byId[p.id] = p
    }

    setProjectsById(byId)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplied = (matchId: string, nickname: string) => {
    // 낙관적 업데이트 — project_id는 이 시점에 알 수 없으니 전체 재조회로 확정
    load()
  }

  const handleSubmitted = () => {
    load()
  }

  const cards = useMemo(() => {
    const matchCards = matches.map((m) => ({
      project: projectsById[m.project_id],
      match: {
        id: m.id,
        status: m.status,
        nickname: m.nickname,
        shipping_status: m.shipping_status,
        shipping_address: m.shipping_address,
        received_confirmed_at: m.received_confirmed_at,
      } as CardMatch,
    })).filter((c) => c.project)

    const availableCards = feedIds.map((id) => ({ project: projectsById[id], match: null })).filter((c) => c.project)

    const all = [...matchCards, ...availableCards]
    const filtered = query
      ? all.filter((c) => c.project.title?.toLowerCase().includes(query.toLowerCase()))
      : all

    return filtered.sort((a, b) => {
      const sa = STATUS_ORDER[a.match?.status ?? 'available']
      const sb = STATUS_ORDER[b.match?.status ?? 'available']
      return sa - sb
    })
  }, [matches, projectsById, feedIds, query])

  return (
    <ReviewerLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black">참여 가능한 의뢰</h1>
            <p className="text-[11px] text-[#666] font-medium mt-1">
              지원부터 리뷰 작성, 결과 확인까지 카드 하나에서 진행할 수 있어요
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#1D1C1C]/10 bg-white w-64">
            <Search className="w-3.5 h-3.5 text-[#999]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="프로젝트 검색"
              className="flex-1 text-[12px] font-bold outline-none bg-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-[#1565C0] animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-white p-16 text-center">
            <p className="text-sm font-black text-[#999]">아직 참여 가능한 의뢰가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map(({ project, match }) => (
              <ProjectCardExpandable
                key={project.id}
                project={project}
                match={match}
                onApplied={handleApplied}
                onSubmitted={handleSubmitted}
              />
            ))}
          </div>
        )}
      </div>
    </ReviewerLayout>
  )
}
