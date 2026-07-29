'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import Step0Modal from '../builder/new-request/Step0Modal'
import HappeningSection from '../shared/HappeningSection'
import ReviewerBannerCarousel from '../shared/ReviewerBannerCarousel'
import ItemDiscoveryFlow from './ItemDiscoveryFlow'
import { useAgentBubble } from '../agent/AgentBubbleContext'
import CoachTour from '../onboarding/CoachTour'

const CREATOR_COACH_STEPS = [
  {
    target: '[data-coach="creator-search"]',
    title: '아이디어를 검색해보세요',
    text: '검증하고 싶은 제품·서비스 키워드를 입력하면, 비슷한 아이템을 찾아 등록까지 이어줘요.',
  },
  {
    target: '[data-coach="creator-trend"]',
    title: '요즘 뜨는 아이템도 확인해요',
    text: '실제 검색 트렌드를 참고해 어떤 아이디어가 요즘 주목받는지 미리 볼 수 있어요.',
  },
  {
    target: '[data-coach="role-toggle"]',
    title: '리뷰어로도 전환할 수 있어요',
    text: '다른 크리에이터의 아이디어를 체험하고 리뷰를 남기고 싶을 땐 여기서 리뷰어로 전환하세요.',
  },
  {
    target: '[data-coach="agent-bubble"]',
    title: 'FindFit Agent에게 물어보세요',
    text: '아이디어가 막연해도 괜찮아요. Agent와 대화하면서 하나씩 구체화하고 등록까지 도와드려요.',
    placement: 'top' as const,
  },
]

const TREND_CHIP = '강아지 간식'

// 크리에이터 "홈" — 예전엔 대시보드 위젯(한눈에 보기 등)이었지만, 그 위젯들은
// 프로젝트 탭(ProjectsWorkspace)으로 옮기고 여기는 검증 시작 입력창 +
// Agent 온보딩 진입점으로 재구성했다.
export default function CreatorHome() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentBubble = useAgentBubble()
  const [keyword, setKeyword] = useState('')
  const [step0Open, setStep0Open] = useState(false)
  const [discoveryOpen, setDiscoveryOpen] = useState(false)

  // 마법사 등 다른 곳에서 ?agent=explore로 들어오는 기존 링크 호환 —
  // 홈에 도착하면 바로 버블을 열어준다.
  useEffect(() => {
    if (searchParams.get('agent') === 'explore') agentBubble.open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startValidation = () => {
    if (!keyword.trim()) return
    // 검색어 입력 → "어떻게 검증을 시작할까요?" 모달이 항상 먼저 뜨고,
    // 거기서 "아이템 탐색부터 시작"을 골라야 ItemDiscoveryFlow(유사 아이템
    // 찾는 중 → 핫한 아이템)가 열린다 — 예전엔 이 모달을 완전히 건너뛰고
    // 바로 ItemDiscoveryFlow로 가서 순서가 뒤바뀌어 보였다.
    setStep0Open(true)
  }

  return (
    <div className="flex flex-col gap-14 py-10">
      {/* ── 히어로 ── */}
      <div className="flex flex-col items-center text-center gap-6">
        <span className="text-[11px] font-bold text-[#999] bg-white border border-[#1D1C1C]/8 px-4 py-1.5 rounded-full">
          크리에이터와 리뷰어가 함께 만드는 가치
        </span>
        <h1 className="text-[34px] sm:text-[40px] font-black leading-tight text-[#1D1C1C]">
          좋은 브랜드는<br />
          <span className="text-[#F77019]">실제 소비자를 듣는 것</span> 에서 시작됩니다.
        </h1>

        <div className="w-full max-w-[820px] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
          <div data-coach="creator-search" className="flex-1 flex items-center gap-3 h-16 rounded-3xl border-2 border-[#1D1C1C]/10 bg-white px-6 focus-within:border-[#F77019] transition-colors min-w-0">
            <Search className="w-5 h-5 text-[#999] flex-shrink-0" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startValidation()}
              placeholder="어떤 제품을 검증하고 싶으신가요?"
              className="flex-1 bg-transparent outline-none text-[15px] font-bold text-[#1D1C1C] placeholder-[#BBB]"
            />
            <button
              onClick={startValidation}
              disabled={!keyword.trim()}
              className="h-10 px-5 rounded-2xl bg-[#F77019] text-white text-[12px] font-black disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              검증 시작
            </button>
          </div>
          <button
            data-coach="creator-trend"
            onClick={() => { setKeyword(TREND_CHIP); setStep0Open(true) }}
            className="h-16 px-5 rounded-3xl border-2 border-[#1565C0]/20 bg-[#1565C0]/5 flex items-center gap-2 flex-shrink-0 hover:bg-[#1565C0]/10 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-[#1565C0]" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-[#1565C0]/70">트렌드</span>
              <span className="text-[12px] font-black text-[#1565C0]">{TREND_CHIP}</span>
            </div>
          </button>
        </div>

        {/* ── 검색창 하단 리뷰어 광고 배너 (요청 1번 반영) ── */}
        <div className="w-full mt-2">
          <ReviewerBannerCarousel />
        </div>
      </div>

      {/* ── 지금 FindFit에서 일어나고 있어요 (1번 전달 이미지 UI 반영) ── */}
      <HappeningSection basePath="builder" />

      <Step0Modal
        isOpen={step0Open}
        onClose={() => setStep0Open(false)}
        onExplore={() => {
          setStep0Open(false)
          setDiscoveryOpen(true)
        }}
        onHasItem={() => {
          setStep0Open(false)
          // skipIntro — 이미 여기서 "아이템이 있어요"를 골랐으므로 마법사에
          // 들어가서 같은 질문(Step0Modal)을 또 물어보지 않는다.
          router.push('/builder/new-request?skipIntro=1')
        }}
      />

      {discoveryOpen && (
        <ItemDiscoveryFlow keyword={keyword} onClose={() => setDiscoveryOpen(false)} />
      )}

      <CoachTour steps={CREATOR_COACH_STEPS} storageKey="findfit_coach_seen_creator" accentColor="#F77019" />
    </div>
  )
}
