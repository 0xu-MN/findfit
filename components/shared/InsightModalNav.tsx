'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// 인사이트 오버레이 전용 — 화면 양 끝에 크게 떠 있는 이전/다음/닫기 버튼.
// 예전엔 글 카드 위에 작은 텍스트 버튼으로만 있어서 안 보인다는 피드백이
// 있었다 — Agent 위젯 토글 버튼(FloatingAgentBubble.tsx)과 같은 톤(원형,
// 강한 그림자, 확실한 대비)으로 맞춘다.
export default function InsightModalNav({
  onClose,
  onNext,
  onPrev,
}: {
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
}) {
  return (
    <>
      <button
        onClick={onClose}
        title="닫기 (Esc)"
        className="fixed top-6 right-6 z-[210] w-12 h-12 rounded-full bg-white text-[#1D1C1C] shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <X className="w-6 h-6" />
      </button>

      {onPrev && (
        <button
          onClick={onPrev}
          title="이전 글 (←)"
          className="fixed left-3 md:left-8 top-1/2 -translate-y-1/2 z-[210] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(247,112,25,0.35)] hover:scale-105 active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }}
        >
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          title="다음 글 (→)"
          className="fixed right-3 md:right-8 top-1/2 -translate-y-1/2 z-[210] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(247,112,25,0.35)] hover:scale-105 active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }}
        >
          <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
        </button>
      )}
    </>
  )
}
