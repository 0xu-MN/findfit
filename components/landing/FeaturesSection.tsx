'use client'

import { useEffect, useRef, useState } from 'react'

const BRAND = '#F77019'

/* ── Skeleton UIs (무채색 — 오렌지 완전 제거) ──── */

function WizardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 h-full bg-white">
      <div className="flex items-center gap-1.5 mb-1">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: n <= 2 ? '#1D1C1C' : '#E5E7EB', color: n <= 2 ? '#fff' : '#9CA3AF' }}>
              {n}
            </div>
            {n < 6 && <div className="w-3 h-px" style={{ background: n < 2 ? '#9CA3AF' : '#E5E7EB' }} />}
          </div>
        ))}
      </div>
      {[20, 28, 16].map((w, i) => (
        <div key={i} className="rounded-xl bg-gray-50 px-4 py-3">
          <div className="h-2 rounded mb-2 bg-gray-200" style={{ width: `${w * 4}px` }} />
          <div className="h-3 rounded bg-gray-100 w-full" />
        </div>
      ))}
      <div className="flex gap-2 mt-1">
        {['SaaS', '커머스', '헬스', '에듀'].map(t => (
          <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-500 bg-gray-100">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-auto self-end px-4 py-1.5 rounded-full text-[10px] font-bold text-white bg-[#1D1C1C]">
        다음 단계 →
      </div>
    </div>
  )
}

function MatchSkeleton() {
  const items = [
    { score: 98, active: true },
    { score: 91, active: true },
    { score: 84, active: false },
    { score: 77, active: false },
  ]
  return (
    <div className="flex flex-col gap-2.5 p-5 h-full bg-white">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-[10px] font-medium text-gray-400">매칭 진행 중...</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200" />
          <div className="flex-1">
            <div className="h-2 w-20 rounded mb-1.5 bg-gray-200" />
            <div className="h-1.5 w-14 rounded bg-gray-100" />
          </div>
          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: item.active ? '#1D1C1C' : '#E5E7EB', color: item.active ? '#fff' : '#9CA3AF' }}>
            {item.score}%
          </div>
        </div>
      ))}
    </div>
  )
}

function TrackerSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 h-full bg-white">
      <div>
        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-1.5">
          <span>진행률</span>
          <span className="font-bold text-gray-600">14 / 20명</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gray-100">
          <div className="h-2.5 rounded-full bg-gray-400" style={{ width: '70%' }} />
        </div>
      </div>
      {[
        { done: true, active: false },
        { done: true, active: false },
        { done: false, active: true },
        { done: false, active: false },
      ].map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
            style={{
              background: step.done ? '#6B7280' : step.active ? '#E5E7EB' : '#F3F4F6',
              color: step.done ? '#fff' : step.active ? '#374151' : '#9CA3AF',
              border: step.active ? '1.5px solid #9CA3AF' : 'none',
            }}>
            {step.done ? '✓' : i + 1}
          </div>
          <div className="flex-1 h-2 rounded"
            style={{ background: step.done ? '#D1D5DB' : step.active ? '#E5E7EB' : '#F3F4F6' }} />
        </div>
      ))}
      <div className="mt-auto bg-gray-50 rounded-xl px-3 py-2 text-[10px] font-medium text-gray-500 border border-gray-100">
        ⏱ 예상 완료: 약 18시간 후
      </div>
    </div>
  )
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 h-full bg-white">
      <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#6B7280" strokeWidth="3"
              strokeDasharray="62 94" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-gray-600">
            66%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Sean Ellis Score</div>
          <div className="text-[11px] font-bold text-gray-600">PMF 접근 중</div>
        </div>
      </div>
      <div className="flex items-end gap-1.5 bg-gray-50 rounded-xl px-4 py-3" style={{ height: '80px' }}>
        {[40, 65, 55, 80, 45, 70, 60, 50, 75, 62].map((h, i) => (
          <div key={i} className="flex-1 rounded-t"
            style={{ height: `${h}%`, background: i === 3 ? '#6B7280' : '#E5E7EB' }} />
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        {['계속', '피봇', '중단'].map((t, i) => (
          <div key={t} className="flex-1 text-center py-1.5 rounded-xl text-[10px] font-bold"
            style={{ background: i === 0 ? '#1D1C1C' : '#F3F4F6', color: i === 0 ? '#fff' : '#9CA3AF' }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Card data ──────────────────────────────────── */

const cards = [
  { label: '의뢰 등록 위자드', desc: '5분 안에 6단계로 검증 의뢰 등록 — 방법론을 몰라도 쉽게 시작할 수 있어요.', skeleton: <WizardSkeleton />, col: 'col-span-3', fx: -56, fy: -44 },
  { label: '스마트 매칭 푸시', desc: '관심 카테고리가 일치하는 전문 리뷰어에게 자동으로 알림이 전달돼요.', skeleton: <MatchSkeleton />, col: 'col-span-2', fx: 56, fy: -44 },
  { label: '실시간 진행 트래커', desc: '의뢰 등록 후 리뷰가 쌓이는 과정을 실시간으로 확인할 수 있어요.', skeleton: <TrackerSkeleton />, col: 'col-span-2', fx: -56, fy: 44 },
  { label: 'AI 리포트', desc: 'GPT-4o가 정량·정성 데이터를 분석해 계속/피봇/중단 신호를 제공해요.', skeleton: <ReportSkeleton />, col: 'col-span-3', fx: 56, fy: 44 },
]

/* ── Section ────────────────────────────────────── */

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = gridRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const wh = window.innerHeight
      const raw = (wh - rect.top) / (wh * 0.75)
      const eased = 1 - Math.pow(1 - Math.max(0, Math.min(1, raw)), 2)
      setProgress(eased)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full bg-[#F8F8F8]"
      style={{ scrollSnapAlign: 'start' }}>

      {/* 상하 페이드 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, #F8F8F8 0%, transparent 12%, transparent 88%, #F8F8F8 100%)',
      }} />

      <div className="relative max-w-[1440px] mx-auto px-16">

        {/* 헤더 */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: BRAND }}>
            Core Features
          </p>
          <h2 className="text-5xl font-bold tracking-tight text-[#1D1C1C] mb-4">검증에 필요한 모든 것</h2>
          <p className="text-[#999] text-base max-w-[440px] mx-auto leading-relaxed">
            의뢰 등록부터 AI 리포트 수령까지<br /> 복잡한 과정 없이 72시간 안에 완료돼요.
          </p>
        </div>

        {/* 비대칭 벤토 그리드 */}
        <div ref={gridRef} className="grid grid-cols-5 gap-4 max-w-[960px] mx-auto">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`${card.col} rounded-2xl overflow-hidden bg-white`}
              style={{
                boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                transform: `translate(${card.fx * (1 - progress)}px, ${card.fy * (1 - progress)}px)`,
                opacity: Math.min(1, progress * 1.4),
                willChange: 'transform, opacity',
              }}
            >
              {/* 카드 헤더 */}
              <div className="px-6 pt-6 pb-3 bg-white">
                <h3 className="text-base font-bold text-[#1D1C1C] mb-1">{card.label}</h3>
                <p className="text-[13px] text-[#888] leading-relaxed max-w-[320px]">{card.desc}</p>
              </div>

              {/* 스켈레톤 프리뷰 */}
              <div className="mx-4 mb-4 rounded-xl overflow-hidden" style={{ height: '200px' }}>
                {card.skeleton}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
