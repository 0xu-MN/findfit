'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import Step0Modal from '../builder/new-request/Step0Modal'
import HappeningSection from '../shared/HappeningSection'
import ReviewerBannerCarousel from '../shared/ReviewerBannerCarousel'
import ItemDiscoveryFlow from './ItemDiscoveryFlow'
import { useAgentBubble } from '../agent/AgentBubbleContext'

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
    setDiscoveryOpen(true)
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

        <div className="w-full max-w-[820px] flex items-center gap-3 mt-4">
          <div className="flex-1 flex items-center gap-3 h-16 rounded-3xl border-2 border-[#1D1C1C]/10 bg-white px-6 focus-within:border-[#F77019] transition-colors">
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
          agentBubble.openWithSeed(keyword)
          setStep0Open(false)
        }}
        onHasItem={() => {
          setStep0Open(false)
          router.push('/builder/new-request')
        }}
      />

      {discoveryOpen && (
        <ItemDiscoveryFlow keyword={keyword} onClose={() => setDiscoveryOpen(false)} />
      )}
    </div>
  )
}
