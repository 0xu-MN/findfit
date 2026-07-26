'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

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

export default function ReviewerBannerCarousel() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full max-w-[680px] mx-auto overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-h-[200px]">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
      >
        {BANNERS.map((b) => (
          <div
            key={b.id}
            className="w-full shrink-0 p-6 sm:p-8 flex flex-col justify-center text-white relative"
            style={{ background: b.bg, minHeight: '200px' }}
          >
            <div className="max-w-2xl relative z-10 flex flex-col items-start gap-2.5">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                {b.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight break-keep">
                {b.title}
              </h2>
              <p className="text-xs font-medium text-white/80 break-keep">
                {b.subtitle}
              </p>
              <button className="mt-1 px-4 py-2 rounded-full bg-white text-[#1565C0] text-[11px] font-black hover:bg-white/90 transition-all shadow-md">
                {b.btnText}
              </button>
            </div>
            <div className="absolute right-8 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none hidden md:flex items-center justify-center">
              <Sparkles className="w-36 h-36 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        onClick={() => setCurrentBannerIndex((p) => (p === 0 ? BANNERS.length - 1 : p - 1))}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => setCurrentBannerIndex((p) => (p + 1) % BANNERS.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentBannerIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${currentBannerIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
