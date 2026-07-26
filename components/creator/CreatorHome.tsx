'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, TrendingUp, ChevronRight } from 'lucide-react'
import Step0Modal from '../builder/new-request/Step0Modal'
import SharedLoungeFeed from '../shared/SharedLoungeFeed'
import SharedFeedPanel from '../shared/SharedFeedPanel'
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

  // 마법사 등 다른 곳에서 ?agent=explore로 들어오는 기존 링크 호환 —
  // 홈에 도착하면 바로 버블을 열어준다.
  useEffect(() => {
    if (searchParams.get('agent') === 'explore') agentBubble.open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startValidation = () => {
    if (!keyword.trim()) return
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
      </div>

      {/* ── 지금 FindFit에서 일어나고 있어요 (라운지/피드 미리보기) ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black text-[#1D1C1C]">지금 FindFit에서 일어나고 있어요</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PreviewSection title="라운지" onMore={() => router.push('/builder/lounge')}>
            <SharedLoungeFeed />
          </PreviewSection>
          <PreviewSection title="피드" onMore={() => router.push('/builder/feed')}>
            <SharedFeedPanel />
          </PreviewSection>
        </div>
      </div>

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
    </div>
  )
}

function PreviewSection({ title, onMore, children }: { title: string; onMore: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#1D1C1C]/8 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-black text-[#1D1C1C]">{title}</h3>
        <button
          onClick={onMore}
          className="flex items-center gap-0.5 text-[10px] font-bold text-[#999] hover:text-[#F77019] transition-colors"
        >
          더보기 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="max-h-[420px] overflow-hidden relative">
        {children}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
