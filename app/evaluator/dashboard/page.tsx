'use client'

import { Loader2, ChevronLeft, ChevronRight, Sparkles, Activity } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import ProjectCardExpandable, { type CardMatch, type CardProject } from '@/components/evaluator/ProjectCardExpandable'
import LiveActivityTicker from '@/components/evaluator/LiveActivityTicker'
import HappeningSection from '@/components/shared/HappeningSection'
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

// Banner Carousel Data
const BANNERS = [
  {
    id: 1,
    title: '리뷰어 활동하고 맞춤 포트폴리오를 만들어보세요',
    subtitle: '관심 분야의 미출시 서비스를 먼저 경험하고 진짜 피드백을 전달하세요.',
    badge: '인기 이벤트',
    bg: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1A237E 100%)',
    btnText: '관심 분야 설정하기',
  },
  {
    id: 2,
    title: '이번 주 우수 리뷰어 특별 사례금 보너스 혜택',
    subtitle: '정성스러운 피드백을 작성해주신 50분께 추가 10,000 포인트 지급!',
    badge: '사례금 혜택',
    bg: 'linear-gradient(135deg, #F77019 0%, #E65100 50%, #BF360C 100%)',
    btnText: '사례금 의뢰 보기',
  },
  {
    id: 3,
    title: 'IT/프로그래밍 & 디자인 맞춤 의뢰 대거 신규 등록',
    subtitle: '내 아이디에 맞는 프로젝트에 참여하고 경험을 쌓아보세요.',
    badge: 'NEW 서비스',
    bg: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #004D40 100%)',
    btnText: '신규 프로젝트 확인',
  },
]

// Live activities sample data (Matching 2nd image UI)
const LIVE_ACTIVITIES = [
  {
    id: 1,
    tag: '사용자 후기',
    tagColor: 'bg-purple-100 text-purple-700',
    title: '퀵뷰에 사례금 얼마가 적당할까요?',
    time: '10분 전',
    comments: 12,
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 2,
    tag: '리뷰 모집',
    tagColor: 'bg-amber-100 text-amber-700',
    title: '비건 에너지바 리뷰 모집',
    desc: '30,000 FC · 20명 모집',
    time: '20분 전',
    img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 3,
    tag: '의뢰 등록',
    tagColor: 'bg-blue-100 text-blue-700',
    title: '스킨케어 3종 세트 리서치',
    time: '15분 전',
    img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=120&q=80',
  },
]

export default function EvaluatorDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [projectsById, setProjectsById] = useState<Record<string, CardProject>>({})
  const [feedIds, setFeedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [userNickname, setUserNickname] = useState('리뷰어')
  const [userInterests, setUserInterests] = useState<string[]>([])
  const [selectedInterestTab, setSelectedInterestTab] = useState('맞춤 추천')

  // Banner carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: userInfo }, { data: profile }, { data: matchRows }, feedRes] = await Promise.all([
      supabase.from('users').select('nickname').eq('id', user.id).maybeSingle(),
      supabase.from('reviewer_profiles').select('domain_tags').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('project_matches')
        .select('id, project_id, status, nickname, shipping_status, shipping_address, received_confirmed_at')
        .eq('reviewer_id', user.id)
        .order('applied_at', { ascending: false }),
      fetch('/api/projects/feed').then((r) => r.json()).catch(() => ({ all: [] })),
    ])

    if (userInfo?.nickname) setUserNickname(userInfo.nickname)
    if (profile?.domain_tags && profile.domain_tags.length > 0) {
      setUserInterests(profile.domain_tags)
    } else {
      setUserInterests(['디자인', '마케팅', 'IT·프로그래밍', '기획'])
    }

    const myMatches = (matchRows ?? []) as MatchRow[]
    setMatches(myMatches)

    const feedProjects = (feedRes.all ?? []) as CardProject[]
    const matchedIds = new Set(myMatches.map((m) => m.project_id))
    const availableFeed = feedProjects.filter((p) => !matchedIds.has(p.id))
    setFeedIds(availableFeed.map((p) => p.id))

    const byId: Record<string, CardProject> = {}
    for (const p of feedProjects) byId[p.id] = p

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

  const handleApplied = () => { load() }
  const handleSubmitted = () => { load() }

  const interestTabs = useMemo(() => {
    return ['맞춤 추천', ...userInterests]
  }, [userInterests])

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

    let all = [...matchCards, ...availableCards]

    // Category filtering based on Kmong biz tab selection
    if (selectedInterestTab !== '맞춤 추천') {
      all = all.filter((c) => c.project.categories?.includes(selectedInterestTab))
    }

    const filtered = query
      ? all.filter((c) => c.project.title?.toLowerCase().includes(query.toLowerCase()))
      : all

    return filtered.sort((a, b) => {
      const sa = STATUS_ORDER[a.match?.status ?? 'available']
      const sb = STATUS_ORDER[b.match?.status ?? 'available']
      return sa - sb
    })
  }, [matches, projectsById, feedIds, query, selectedInterestTab])

  return (
    <ReviewerLayout>
      <div className="flex flex-col gap-10 py-2">
        {/* 1. 상단 배너 광고 캐러셀 — 화면 전체 폭이 아니라 중앙 정렬된
            좁은 폭(약 40%)으로 축소. 1700px 와이드 레이아웃에서 배너만
            가장자리까지 꽉 차서 부담스러웠던 것을 수정. */}
        <div className="relative w-full max-w-[680px] mx-auto overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-h-[220px]">
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {BANNERS.map((b) => (
              <div
                key={b.id}
                className="w-full shrink-0 p-8 sm:p-10 flex flex-col justify-center text-white relative"
                style={{ background: b.bg, minHeight: '220px' }}
              >
                <div className="max-w-2xl relative z-10 flex flex-col items-start gap-3">
                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                    {b.badge}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight break-keep">
                    {b.title}
                  </h2>
                  <p className="text-sm font-medium text-white/80 break-keep">
                    {b.subtitle}
                  </p>
                  <button className="mt-2 px-5 py-2.5 rounded-full bg-white text-[#1565C0] text-xs font-black hover:bg-white/90 transition-all shadow-md">
                    {b.btnText}
                  </button>
                </div>
                {/* Decorative visual elements */}
                <div className="absolute right-10 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none hidden md:flex items-center justify-center">
                  <Sparkles className="w-48 h-48 text-white" />
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            onClick={() => setCurrentBannerIndex((p) => (p === 0 ? BANNERS.length - 1 : p - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentBannerIndex((p) => (p + 1) % BANNERS.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`h-2 rounded-full transition-all ${currentBannerIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* 2. OOO 맞춤 프로젝트 섹션 (3번 이미지 Kmong Biz 스타일 반영) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-[#1D1C1C] flex items-center gap-2">
              <span className="text-[#1565C0]">{userNickname}님</span>을 위해 엄선한 맞춤 프로젝트
            </h2>
            <p className="text-xs font-medium text-[#666]">
              설정하신 관심 분야({userInterests.join(', ')})를 기반으로 딱 맞는 프로젝트를 추천해 드려요.
            </p>
          </div>

          {/* Interest Filter Tabs (Kmong Biz Style Pill Tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {interestTabs.map((tab) => {
              const active = selectedInterestTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedInterestTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${active
                      ? 'bg-[#1565C0] text-white shadow-sm'
                      : 'bg-white text-[#666] border border-[#1D1C1C]/10 hover:border-[#1565C0]/40'
                    }`}
                >
                  {tab === '맞춤 추천' ? '✨ 맞춤 추천' : tab}
                </button>
              )
            })}
          </div>

          {/* Project List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-[#1565C0] animate-spin" />
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-white p-16 text-center">
              <p className="text-sm font-black text-[#999]">해당 조건의 참여 가능한 의뢰가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </section>

        {/* 3. 지금 FindFit에서 일어나고 있어요 섹션 (실시간 활동 + HappeningSection) */}
        <section className="flex flex-col gap-5 pt-4 border-t border-[#1D1C1C]/8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#666] font-medium mt-0.5">
                실시간으로 이뤄지고 있는 리뷰어 활동 및 프로젝트 동향
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1565C0]/10 text-[#1565C0] text-xs font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>실시간 동향</span>
            </div>
          </div>

          {/* 물 흐르는 듯한 무한 티커 (4번 요청) */}
          <LiveActivityTicker />

          {/* 라운지 & findfit news 카드 그리드 (HappeningSection — 1번 이미지 UI) */}
          <HappeningSection basePath="evaluator" />
        </section>
      </div>
    </ReviewerLayout>
  )
}

