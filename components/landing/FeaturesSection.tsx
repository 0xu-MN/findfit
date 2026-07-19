'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause } from 'lucide-react'

const BRAND = '#F77019'

/* ── Skeleton UIs — each animates into place when its card becomes active,
   then keeps a small loop of motion running for as long as it stays active,
   so it reads as a living product demo rather than a one-shot reveal. ──── */

function WizardSkeleton({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col gap-3.5 p-7 h-full bg-white">
      <div className="flex items-center gap-1.5 mb-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <motion.div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              animate={{
                background: active && n <= 2 ? '#1D1C1C' : '#E5E7EB',
                color: active && n <= 2 ? '#fff' : '#9CA3AF',
                scale: active && n === 2 ? [1, 1.22, 1] : 1,
              }}
              transition={{
                background: { duration: 0.4, delay: n * 0.08 },
                color: { duration: 0.4, delay: n * 0.08 },
                scale: active && n === 2 ? { duration: 1.6, repeat: Infinity, repeatDelay: 0.6 } : { duration: 0.3 },
              }}
            >
              {n}
            </motion.div>
            {n < 5 && <div className="w-4 h-px" style={{ background: active && n < 2 ? '#9CA3AF' : '#E5E7EB' }} />}
          </div>
        ))}
      </div>
      {[20, 28].map((w, i) => (
        <motion.div
          key={i}
          className="rounded-2xl bg-gray-50 px-5 py-3.5"
          initial={{ opacity: 0, x: -10 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
        >
          <div className="h-2 rounded mb-2 bg-gray-200" style={{ width: `${w * 5}px` }} />
          <div className="h-2.5 rounded bg-gray-100 w-full" />
        </motion.div>
      ))}
      <div className="flex gap-2 mt-0.5">
        {['SaaS', '커머스', '헬스'].map((t, i) => (
          <motion.span
            key={t}
            className="px-3 py-1 rounded-full text-[11px] font-semibold text-gray-500 bg-gray-100"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: 0.55 + i * 0.08 }}
          >
            {t}
          </motion.span>
        ))}
      </div>
      <motion.div
        className="mt-auto self-end px-4 py-2 rounded-full text-[11px] font-bold text-white bg-[#1D1C1C]"
        animate={active ? { opacity: 1, scale: [1, 1.07, 1] } : { opacity: 0 }}
        transition={{ opacity: { duration: 0.3, delay: 0.75 }, scale: { duration: 1.5, repeat: Infinity, delay: 1 } }}
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
    <div className="flex flex-col gap-3 p-7 h-full bg-white justify-center">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-[12px] font-medium text-gray-400">매칭 진행 중...</span>
      </div>
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3.5 bg-gray-50 rounded-2xl px-4 py-3.5"
          initial={{ opacity: 0, x: 20 }}
          animate={active ? { opacity: 1, x: 0, y: [0, -3, 0] } : { opacity: 0, x: 20 }}
          transition={{
            opacity: { duration: 0.4, delay: 0.15 + i * 0.22 },
            x: { duration: 0.4, delay: 0.15 + i * 0.22 },
            y: active ? { duration: 2.2, repeat: Infinity, delay: 1 + i * 0.3, ease: 'easeInOut' } : undefined,
          }}
        >
          <div className="w-9 h-9 rounded-full flex-shrink-0 bg-gray-200" />
          <div className="flex-1">
            <div className="h-2 w-20 rounded mb-1.5 bg-gray-200" />
            <div className="h-1.5 w-14 rounded bg-gray-100" />
          </div>
          <div className="text-[11px] font-bold px-2 py-1 rounded-full"
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
    <div className="flex flex-col gap-3.5 p-7 h-full bg-white justify-center">
      <div>
        <div className="flex justify-between text-[11px] font-medium text-gray-400 mb-1.5">
          <span>진행률</span>
          <span className="font-bold text-gray-600">14 / 20명</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden relative">
          <motion.div
            className="h-3 rounded-full bg-gray-400 relative overflow-hidden"
            initial={{ width: '0%' }}
            animate={{ width: active ? '70%' : '0%' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {active && (
              <motion.div
                className="absolute inset-y-0 w-10"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
                animate={{ x: ['-40px', '120px'] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: 1.2, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        </div>
      </div>
      {[
        { done: true, hi: false },
        { done: false, hi: true },
        { done: false, hi: false },
      ].map((step, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
        >
          <motion.div
            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
            style={{
              background: step.done ? '#6B7280' : step.hi ? '#E5E7EB' : '#F3F4F6',
              color: step.done ? '#fff' : step.hi ? '#374151' : '#9CA3AF',
              border: step.hi ? '1px solid #9CA3AF' : 'none',
            }}
            animate={active && step.hi ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.3, repeat: Infinity, delay: 1.4 }}
          >
            {step.done ? '✓' : i + 1}
          </motion.div>
          <div className="flex-1 h-2 rounded"
            style={{ background: step.done ? '#D1D5DB' : step.hi ? '#E5E7EB' : '#F3F4F6' }} />
        </motion.div>
      ))}
      <div className="mt-auto bg-gray-50 rounded-2xl px-4 py-2.5 text-[11px] font-medium text-gray-500 border border-gray-100">
        ⏱ 예상 완료: 약 18시간 후
      </div>
    </div>
  )
}

function ReportSkeleton({ active }: { active: boolean }) {
  const bars = [40, 65, 55, 80, 45, 70, 60, 50, 75, 62]
  return (
    <div className="flex flex-col gap-3.5 p-7 h-full bg-white justify-center">
      <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3.5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15" fill="none" stroke="#6B7280" strokeWidth="3"
              strokeDasharray="94.2" strokeLinecap="round"
              initial={{ strokeDashoffset: 94.2 }}
              animate={{ strokeDashoffset: active ? 94.2 - 62 : 94.2 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-gray-600">
            66%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400">Sean Ellis Score</div>
          <div className="text-[13px] font-bold text-gray-600">PMF 접근 중</div>
        </div>
      </div>
      <div className="flex items-end gap-1.5 bg-gray-50 rounded-2xl px-4 py-3" style={{ height: '84px' }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t"
            style={{ background: i === 3 ? '#6B7280' : '#E5E7EB' }}
            initial={{ height: '0%' }}
            animate={active ? { height: [`${h}%`, `${Math.max(15, h - 12)}%`, `${h}%`] } : { height: '0%' }}
            transition={
              active
                ? { height: { duration: 2.4, repeat: Infinity, delay: 0.5 + i * 0.06, ease: 'easeInOut' } }
                : { duration: 0.4 }
            }
          />
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        {['계속', '피봇', '중단'].map((t, i) => (
          <div key={t} className="flex-1 text-center py-1.5 rounded-2xl text-[11px] font-bold"
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
const AUTO_MS = 5000

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
    <section className="relative w-full min-h-[100vh] bg-[#F8F8F8] flex flex-col justify-center py-16 md:py-20 overflow-hidden"
      style={{ scrollSnapAlign: 'start' }}>

      {/* 상하 페이드 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, #F8F8F8 0%, transparent 12%, transparent 88%, #F8F8F8 100%)',
      }} />

      <div className="relative max-w-[1440px] mx-auto px-6 md:px-16 w-full">

        {/* 헤더 */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND }}>
            Core Features
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-[#1D1C1C] mb-3">검증에 필요한 모든 것</h2>
          <p className="text-[#999] text-sm max-w-[440px] mx-auto leading-relaxed">
            의뢰 등록부터 AI 리포트 수령까지<br /> 복잡한 과정 없이 72시간 안에 완료돼요.
          </p>
        </div>

        {/* 캐러셀 — 애플 macbook 페이지처럼: 모든 카드가 완전히 같은 크기이고,
            옆 카드는 축소/디밍되는 게 아니라 그냥 화면 가장자리 바깥으로 밀려나
            일부만 살짝 보이는 방식. 그래서 컨테이너를 섹션 폭 전체로 넓힘. */}
        <div className="relative flex items-center justify-center w-screen left-1/2 -translate-x-1/2" style={{ height: 'min(68vh, 620px)' }}>
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
                  width: 'min(1040px, 78vw)',
                  height: '100%',
                  background: '#101012',
                  border: '1px solid rgba(255,255,255,0.08)',
                  zIndex: isActive ? 10 : 5 - dist,
                  pointerEvents: isActive ? 'auto' : 'none',
                  boxShadow: '0 30px 80px -20px rgba(0,0,0,0.35)',
                }}
                animate={{ x: `${d * 104}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* 상단: 타이틀 (작게) — 하단: 큰 모션그래픽 프레임 (실제 제품 화면처럼 브라우저 크롬 포함) */}
                <div className="flex flex-col h-full p-7 md:p-10">
                  <div className="mb-6 shrink-0">
                    <h3 className="text-white font-bold mb-2 break-keep" style={{ fontSize: 'clamp(20px, 2.1vw, 28px)' }}>
                      {card.label}
                    </h3>
                    <p className="text-white/45 text-[14px] leading-relaxed break-keep max-w-[520px]">
                      {card.desc}
                    </p>
                  </div>
                  <div
                    className="flex-1 rounded-3xl overflow-hidden relative min-h-0 flex flex-col"
                    style={{
                      background: '#0A0A0C',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: '0 40px 90px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Browser-style chrome — makes the mockup read as an
                        actual FindFit product screenshot, not an abstract card */}
                    <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ background: '#161618', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                      <span
                        className="ml-3 px-3 py-1 rounded-md text-[10px] text-white/35"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        app.findfit.io
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <Skeleton active={isActive} />
                    </div>
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
                background: 'rgba(0,0,0,0.12)',
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
            className="ml-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: '#1D1C1C', color: '#fff' }}
            aria-label={playing ? '일시정지' : '재생'}
          >
            {playing ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
          </button>
        </div>

      </div>
    </section>
  )
}
