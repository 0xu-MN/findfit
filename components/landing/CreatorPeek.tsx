'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function CreatorPeek({ onEnter }: { onEnter: () => void }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => setExpanded(e.clientX < 130)
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      className="fixed left-0 z-40 cursor-pointer"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        width: expanded ? '240px' : '42px',
        transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0 14px 14px 0',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        borderLeft: 'none',
        boxShadow: expanded ? '8px 0 40px rgba(0,0,0,0.3)' : '4px 0 16px rgba(0,0,0,0.15)',
      }}
      onClick={onEnter}
    >
      {/* Collapsed: vertical text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: expanded ? 0 : 1,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      >
        <span
          className="text-white/45 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Creator
        </span>
      </div>

      {/* Expanded: preview */}
      <div
        className="flex flex-col justify-center px-6"
        style={{
          height: '200px',
          minWidth: '240px',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s',
          pointerEvents: expanded ? 'auto' : 'none',
        }}
      >
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-[0.18em] mb-3">Creator</p>
        <p className="text-white font-bold leading-snug mb-4" style={{ fontSize: '18px' }}>
          아이디어를<br />검증하고 싶다면?
        </p>
        <div className="flex items-center gap-2 text-[#F77019] text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          크리에이터 페이지 보기
        </div>
      </div>
    </div>
  )
}
