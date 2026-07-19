'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause } from 'lucide-react'

const BRAND = '#F77019'

/* ── Skeleton UIs — each animates into place when its card becomes active,
   so the illustration itself demonstrates the feature instead of sitting
   static. Driven purely by the `active` boolean, no internal timers. ──── */

function WizardSkeleton({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col gap-2.5 p-5 h-full bg-white">
      <div className="flex items-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-1">
            <motion.div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              animate={{
                background: active && n <= 2 ? '#1D1C1C' : '#E5E7EB',
                color: active && n <= 2 ? '#fff' : '#9CA3AF',
                scale: active && n === 2 ? [1, 1.18, 1] : 1,
              }}
              transition={{ duration: 0.4, delay: n * 0.08 }}
            >
              {n}
            </motion.div>
            {n < 5 && <div className="w-2.5 h-px" style={{ background: active && n < 2 ? '#9CA3AF' : '#E5E7EB' }} />}
          </div>
        ))}
      </div>
      {[20, 28].map((w, i) => (
        <motion.div
          key={i}
          className="rounded-xl bg-gray-50 px-3.5 py-2.5"
          initial={{ opacity: 0, x: -8 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
        >
          <div className="h-1.5 rounded mb-1.5 bg-gray-200" style={{ width: `${w * 4}px` }} />
          <div className="h-2 rounded bg-gray-100 w-full" />
        </motion.div>
      ))}
      <div className="flex gap-1.5 mt-0.5">
        {['SaaS', '커머스', '헬스'].map((t, i) => (
          <motion.span
            key={t}
            className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-gray-500 bg-gray-100"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: 0.55 + i * 0.08 }}
          >
            {t}
          </motion.span>
        ))}
      </div>
      <motion.div
        className="mt-auto self-end px-3.5 py-1 rounded-full text-[9px] font-bold text-white bg-[#1D1C1C]"
        animate={active ? { opacity: 1, scale: [1, 1.06, 1] } : { opacity: 0 }}
        transition={{ opacity: { duration: 0.3, delay: 0.75 }, scale: { duration: 1.4, repeat: Infinity, delay: 1 } }}
      >
        다음 단계 →
      </motion.div>
    </div>
  )
}

function MatchSkeleton({ active }: { active: boolean }) {
  const items = [
    { score: 98, hi: true },
    { score: 91, hi: true },
    { score: 80, hi: false },
  ]
  return (
    <div className="flex flex-col gap-2 p-5 h-full bg-white">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-[9px] font-medium text-gray-400">매칭 진행 중...</span>
      </div>
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-2.5 py-2"
          initial={{ opacity: 0, x: 16 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.22 }}
        >
          <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gray-200" />
          <div className="flex-1">
            <div className="h-1.5 w-16 rounded mb-1 bg-gray-200" />
            <div className="h-1 w-11 rounded bg-gray-100" />
          </div>
          <div className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: item.hi ? '#1D1C1C' : '#E5E7EB', color: item.hi ? '#fff' : '#9CA3AF' }}>
            {item.score}%
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function TrackerSkeleton({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col gap-2.5 p-5 h-full bg-white">
      <div>
        <div className="flex justify-between text-[9px] font-medium text-gray-400 mb-1">
          <span>진행률</span>
          <span className="font-bold text-gray-600">14 / 20명</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-2 rounded-full bg-gray-400"
            initial={{ width: '0%' }}
            animate={{ width: active ? '70%' : '0%' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      {[
        { done: true, hi: false },
        { done: false, hi: true },
        { done: false, hi: false },
      ].map((step, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2.5"
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
        >
          <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold"
            style={{
              background: step.done ? '#6B7280' : step.hi ? '#E5E7EB' : '#F3F4F6',
              color: step.done ? '#fff' : step.hi ? '#374151' : '#9CA3AF',
              border: step.hi ? '1px solid #9CA3AF' : 'none',
            }}>
            {step.done ? '✓' : i + 1}
          </div>
          <div className="flex-1 h-1.5 rounded"
            style={{ background: step.done ? '#D1D5DB' : step.hi ? '#E5E7EB' : '#F3F4F6' }} />
        </motion.div>
      ))}
      <div className="mt-auto bg-gray-50 rounded-xl px-3 py-1.5 text-[9px] font-medium text-gray-500 border border-gray-100">
        ⏱ 예상 완료: 약 18시간 후
      </div>
    </div>
  )
}

function ReportSkeleton({ active }: { active: boolean }) {
  const bars = [40, 65, 55, 80, 45, 70, 60, 50, 75, 62]
  return (
    <div className="flex flex-col gap-2.5 p-5 h-full bg-white">
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
        <div className="relative w-11 h-11 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15" fill="none" stroke="#6B7280" strokeWidth="3"
              strokeDasharray="94.2" strokeLinecap="round"
              initial={{ strokeDashoffset: 94.2 }}
              animate={{ strokeDashoffset: active ? 94.2 - 62 : 94.2 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-600">
            66%
          </div>
        </div>
        <div>
          <div className="text-[8px] text-gray-400">Sean Ellis Score</div>
          <div className="text-[10px] font-bold text-gray-600">PMF 접근 중</div>
        </div>
      </div>
      <div className="flex items-end gap-1 bg-gray-50 rounded-xl px-3 py-2" style={{ height: '52px' }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t"
            style={{ background: i === 3 ? '#6B7280' : '#E5E7EB' }}
            initial={{ height: '0%' }}
            animate={{ height: active ? `${h}%` : '0%' }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="flex gap-1.5 mt-auto">
        {['계속', '피봇', '중단'].map((t, i) => (
          <div key={t} className="flex-1 text-center py-1 rounded-xl text-[9px] font-bold"
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
  { label: '의뢰 등록 위자드', desc: '5분 안에 6단계로 검증 의뢰 등록 — 방법론을 몰라도 쉽게 시작할 수 있어요.', Skeleton: WizardSkeleton },
  { label: '스마트 매칭 푸시', desc: '관심 카테고리가 일치하는 전문 리뷰어에게 자동으로 알림이 전달돼요.', Skeleton: MatchSkeleton },
  { label: '실시간 진행 트래커', desc: '의뢰 등록 후 리뷰가 쌓이는 과정을 실시간으로 확인할 수 있어요.', Skeleton: TrackerSkeleton },
  { label: 'AI 리포트', desc: 'GPT-4o가 정량·정성 데이터를 분석해 계속/피봇/중단 신호를 제공해요.', Skeleton: ReportSkeleton },
]

const N = cards.length
const AUTO_MS = 4500

function circularDelta(i: number, active: number, n: number) {
  let d = i - active
  if (d > n / 2) d -= n
  if (d <= -n / 2) d += n
  return d
}

/* ── Section — Apple-style auto-playing carousel ──────────────────────── */

export default function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)
  const startRef = useRef(0)

  useEffect(() => {
    if (!playing) return
    startRef.current = performance.now() - progress * AUTO_MS
    const tick = (t: number) => {
      const elapsed = t - startRef.current
      const p = Math.min(1, elapsed / AUTO_MS)
      setProgress(p)
      if (p >= 1) {
        setActive((a) => (a + 1) % N)
        setProgress(0)
        startRef.current = t
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const goTo = (i: number) => {
    setActive(i)
    setProgress(0)
    startRef.current = performance.now()
  }

  return (
    <section className="relative w-full min-h-[100vh] bg-[#0A0A0C] flex flex-col justify-center py-16 md:py-20 overflow-hidden"
      style={{ scrollSnapAlign: 'start' }}>

      <div className="relative max-w-[1440px] mx-auto px-6 md:px-16 w-full">

        {/* 헤더 */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND }}>
            Core Features
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-3">검증에 필요한 모든 것</h2>
          <p className="text-white/40 text-sm max-w-[440px] mx-auto leading-relaxed">
            의뢰 등록부터 AI 리포트 수령까지<br /> 복잡한 과정 없이 72시간 안에 완료돼요.
          </p>
        </div>

        {/* 캐러셀 */}
        <div className="relative flex items-center justify-center" style={{ height: 'min(56vh, 520px)' }}>
          {cards.map((card, i) => {
            const d = circularDelta(i, active, N)
            const isActive = d === 0
            const dist = Math.abs(d)
            const Skeleton = card.Skeleton
            return (
              <motion.div
                key={card.label}
                className="absolute rounded-[28px] overflow-hidden"
                style={{
                  width: 'min(880px, 84vw)',
                  height: '100%',
                  background: '#151517',
                  border: '1px solid rgba(255,255,255,0.08)',
                  zIndex: 10 - dist,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                animate={{
                  x: d * (dist > 1 ? 620 : 560),
                  scale: isActive ? 1 : 0.86,
                  opacity: dist > 1 ? 0 : isActive ? 1 : 0.45,
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid md:grid-cols-2 h-full items-center gap-8 p-8 md:p-12">
                  <div>
                    <h3 className="text-white font-bold mb-4 break-keep" style={{ fontSize: 'clamp(22px, 2.4vw, 32px)' }}>
                      {card.label}
                    </h3>
                    <p className="text-white/50 text-[15px] leading-relaxed break-keep max-w-[320px]">
                      {card.desc}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)', height: 'min(40vh, 320px)' }}
                  >
                    <Skeleton active={isActive} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 페이지네이션 — 점 + 진행바 + 재생/일시정지 */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {cards.map((card, i) => (
            <button
              key={card.label}
              onClick={() => goTo(i)}
              className="relative rounded-full overflow-hidden transition-all duration-300"
              style={{
                width: i === active ? 56 : 8,
                height: 8,
                background: 'rgba(255,255,255,0.15)',
              }}
              aria-label={card.label}
            >
              {i === active && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${progress * 100}%`, background: BRAND }}
                />
              )}
            </button>
          ))}
          <button
            onClick={() => setPlaying((p) => !p)}
            className="ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            aria-label={playing ? '일시정지' : '재생'}
          >
            {playing ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5" fill="currentColor" />}
          </button>
        </div>

      </div>
    </section>
  )
}
