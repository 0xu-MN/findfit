'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function ReviewerPeek({ onEnter }: { onEnter: () => void }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setExpanded(window.innerWidth - e.clientX < 130)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      className="fixed right-0 z-40 cursor-pointer"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        width: expanded ? '240px' : '42px',
        transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
        background: '#1D1C1C',
        borderRadius: '14px 0 0 14px',
        overflow: 'hidden',
        boxShadow: expanded ? '-8px 0 40px rgba(0,0,0,0.18)' : '-4px 0 16px rgba(0,0,0,0.1)',
      }}
      onClick={onEnter}
    >
      {/* 접힌 상태: 수직 텍스트 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: expanded ? 0 : 1,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      >
        <span
          className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Reviewer
        </span>
      </div>

      {/* 펼쳐진 상태: 프리뷰 카드 */}
      <div
        className="flex flex-col justify-center px-6"
        style={{
          height: '200px',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateX(0)' : 'translateX(20px)',
          transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s',
          pointerEvents: expanded ? 'auto' : 'none',
          minWidth: '240px',
        }}
      >
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-[0.18em] mb-3">
          Reviewer
        </p>
        <p className="text-white font-bold leading-snug mb-4" style={{ fontSize: '18px' }}>
          신제품을 먼저<br />경험하고 싶다면?
        </p>
        <div className="flex items-center gap-2 text-[#42A5F5] text-sm font-semibold">
          리뷰어 페이지 보기 <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
