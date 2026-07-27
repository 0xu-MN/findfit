'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Banner = {
  id: string
  title: string
  subtitle: string | null
  badge: string | null
  bg_gradient: string
  image_url: string | null
  button_text: string | null
  button_link: string | null
}

// 관리자가 없거나 API가 실패해도 화면이 비지 않도록 남겨두는 기본값 —
// 예전에 하드코딩돼 있던 것과 동일한 문구다.
const FALLBACK_BANNERS: Banner[] = [
  {
    id: 'fallback-1',
    title: '리뷰어 활동하고 맞춤 포트폴리오를 만들어보세요',
    subtitle: '관심 분야의 미출시 서비스를 먼저 경험하고 진짜 피드백을 전달하세요.',
    badge: '인기 이벤트',
    bg_gradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1A237E 100%)',
    image_url: null,
    button_text: '관심 분야 설정하기',
    button_link: null,
  },
]

// 크리에이터 홈의 리뷰어 모집 배너 — 예전엔 컴포넌트 안에 하드코딩된 배열을
// 그대로 순환 노출했지만, 관리자가 /admin/banners에서 직접 작성·교체할 수
// 있도록 DB(ad_banners, placement='creator_home')에서 불러오는 방식으로 바꿨다.
export default function ReviewerBannerCarousel() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  useEffect(() => {
    fetch('/api/banners?placement=creator_home')
      .then((r) => r.json())
      .then((data) => {
        if (data?.banners?.length > 0) setBanners(data.banners)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  return (
    <div className="relative w-full max-w-[680px] mx-auto overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-h-[200px]">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
      >
        {banners.map((b) => (
          <div
            key={b.id}
            className="w-full shrink-0 p-6 sm:p-8 flex flex-col justify-center text-white relative overflow-hidden"
            style={{ background: b.image_url ? undefined : b.bg_gradient, minHeight: '200px' }}
          >
            {b.image_url && (
              <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <div className="max-w-2xl relative z-10 flex flex-col items-start gap-2.5">
              {b.badge && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                  {b.badge}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-black leading-tight break-keep">
                {b.title}
              </h2>
              {b.subtitle && (
                <p className="text-xs font-medium text-white/80 break-keep">
                  {b.subtitle}
                </p>
              )}
              {b.button_text && (
                <button
                  onClick={() => b.button_link && router.push(b.button_link)}
                  className="mt-1 px-4 py-2 rounded-full bg-white text-[#1565C0] text-[11px] font-black hover:bg-white/90 transition-all shadow-md"
                >
                  {b.button_text}
                </button>
              )}
            </div>
            <div className="absolute right-8 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none hidden md:flex items-center justify-center">
              <Sparkles className="w-36 h-36 text-white" />
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          {/* Controls */}
          <button
            onClick={() => setCurrentBannerIndex((p) => (p === 0 ? banners.length - 1 : p - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentBannerIndex((p) => (p + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${currentBannerIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
