'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { motion, useScroll, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import Footer from './Footer'
import CreatorPeek from './CreatorPeek'
import ScrollIndicator from './ScrollIndicator'
import RoleSection from './RoleSection'
import AcrylicPortfolioVisual from './AcrylicPortfolioVisual'
import TrendDashboardVisual from './TrendDashboardVisual'
import CompensationVisual from './CompensationVisual'
import IdeaFirstLookVisual from './IdeaFirstLookVisual'

function ReviewerHeader({ onSwitchToCreator }: { onSwitchToCreator: () => void }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="max-w-[1440px] mx-auto px-12 pt-0 pb-5 flex items-center justify-between">
        <img src="/logo.png" alt="FindFit" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={onSwitchToCreator}
            className="flex items-center gap-2 text-white/55 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            크리에이터 알아보기
          </button>
          <a
            href="/evaluator/dashboard"
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            style={{ background: '#42A5F5', boxShadow: '0 4px 16px rgba(66,165,245,0.3)' }}
          >
            리뷰어 등록하기
          </a>
        </div>
      </div>
    </header>
  )
}

// ── 결정론적 PRNG (SSR/CSR 동일 결과 → 하이드레이션 불일치 방지) ──
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 역할 소개 우측 비주얼: 유기적 파티클 가닥 (이중나선 + 분진) ──
type Particle = { x: number; y: number; r: number; o: number; c: string }
const STRAND: Particle[] = (() => {
  const rand = mulberry32(20260521)
  const pts: Particle[] = []
  const N = 130, turns = 3, H = 540, cx = 250, A = 92, top = 50
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const ang = t * Math.PI * 2 * turns
    const y = top + t * H
    const d1 = (Math.sin(ang) + 1) / 2
    const d2 = (Math.sin(ang + Math.PI) + 1) / 2
    pts.push({ x: cx + A * Math.sin(ang), y, r: 1.4 + d1 * 3.2, o: 0.18 + d1 * 0.6, c: d1 > 0.55 ? '#8FCBFF' : '#42A5F5' })
    pts.push({ x: cx + A * Math.sin(ang + Math.PI), y, r: 1.4 + d2 * 3.2, o: 0.18 + d2 * 0.6, c: d2 > 0.55 ? '#8FCBFF' : '#1E6FD6' })
  }
  // 흩어진 분진
  for (let i = 0; i < 95; i++) {
    pts.push({ x: cx + (rand() * 2 - 1) * 175, y: top + rand() * H, r: 0.6 + rand() * 1.7, o: 0.05 + rand() * 0.16, c: '#42A5F5' })
  }
  return pts
})()

function ParticleStrand() {
  return (
    <div className="relative" style={{ width: '500px', height: '640px' }}>
      {/* 글로우 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 55% 55% at 50% 45%, rgba(66,165,245,0.22) 0%, transparent 70%)',
      }} />
      <svg viewBox="0 0 500 640" className="relative w-full h-full" aria-hidden>
        <defs>
          <filter id="strandGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* 나선 연결 막대 (가닥감) */}
        {Array.from({ length: 13 }).map((_, i) => {
          const t = (i + 0.5) / 13
          const ang = t * Math.PI * 2 * 3
          const y = 50 + t * 540
          const x1 = 250 + 92 * Math.sin(ang)
          const x2 = 250 + 92 * Math.sin(ang + Math.PI)
          return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#42A5F5" strokeWidth="1" opacity={0.12} />
        })}
        <g filter="url(#strandGlow)">
          {STRAND.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity={p.o} />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── Benefits: 스크롤 고정형 카드 스택 (오른쪽 목록 → 왼쪽으로 순서대로 펼쳐짐) ──
type BenefitStat = { value: string; label: string }
interface BenefitItem {
  n: string
  category: string
  title: string
  tagline?: string
  desc: string
  highlight?: boolean
  statsLabel?: string
  stats?: BenefitStat[]
  tag?: string
}

const benefitCards: BenefitItem[] = [
  {
    n: '01',
    category: '포트폴리오',
    title: '리뷰 활동이 포트폴리오가 됩니다',
    tagline: '취업, 지원, 면접 — 막연한 관심을 구체적인 숫자로',
    desc: '관심 있다고 말하는 건 누구나 해요. FindFit은 그걸 기록으로 바꿉니다. 내 의견이 크리에이터의 방향을 바꾸고 — 그 영향이 내 활동 기록에 남습니다. PM 지망이든, 마케터든, 기획자든, 어떤 분야든 — 자신이 관심 있는 의뢰를 리뷰한 기록이 지원서에 꺼낼 수 있는 구체적인 근거가 됩니다.',
    highlight: true,
    statsLabel: '리뷰어 활동 예시',
    stats: [
      { value: '17건', label: '서비스 검증' },
      { value: '3개', label: '출시된 서비스' },
      { value: '91%', label: '리뷰 신뢰도' },
    ],
  },
  {
    n: '02',
    category: '선경험',
    title: '세상에 나오기 전 아이디어를 가장 먼저 보는 사람',
    desc: '출시 전 서비스, 검증 중인 제품, 초기 기획안 — 일반인이 접하기 전에 먼저 경험하고 의견을 냅니다.',
  },
  {
    n: '03',
    category: '시장 트렌드',
    title: 'VC가 아니어도 시장의 흐름을 읽습니다',
    desc: '요즘 어떤 문제를 풀려는 사람들이 많은지, 어떤 아이디어가 검증받고 있는지 — 참여할수록 자연스럽게 알게 됩니다.',
  },
  {
    n: '04',
    category: '사례금',
    title: '일부 의뢰에는 사례금이 포함됩니다',
    desc: '크리에이터가 설정한 의뢰에 한해 참여 사례금이 지급됩니다.',
    tag: '의뢰마다 상이 · 프로젝트 상세에서 확인',
  },
]

const BENEFITS_SEG = 1 / benefitCards.length

function clampNum(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function benefitOpenness(index: number, progress: number) {
  const a0 = index * BENEFITS_SEG
  const a3 = (index + 1) * BENEFITS_SEG
  const margin = BENEFITS_SEG * 0.2
  const a1 = a0 + margin
  const a2 = a3 - margin
  const fadeIn = clampNum((progress - a0) / (a1 - a0), 0, 1)
  const fadeOut = clampNum((a3 - progress) / (a3 - a2), 0, 1)
  const isFirst = index === 0
  const isLast = index === benefitCards.length - 1
  return isFirst ? fadeOut : isLast ? fadeIn : Math.min(fadeIn, fadeOut)
}

// Derives this card's openness as a MotionValue bound directly to the DOM by
// framer (no React re-render per scroll frame), plus an `active` boolean
// *state* that only updates the rare handful of times it actually flips —
// used solely to mount/unmount the heavy blob visuals and swap colors,
// never on every scroll tick. This is what keeps scroll smooth: re-rendering
// the whole card tree 60×/sec (the previous `useState` progress) was the
// actual cause of the stutter, not the visuals themselves.
function useBenefitOpenness(scrollYProgress: MotionValue<number>, index: number) {
  const openness = useTransform(scrollYProgress, (p) => benefitOpenness(index, p))
  const activeMV = useTransform(openness, (o) => o > 0.5)
  const [active, setActive] = useState(() => activeMV.get())
  useMotionValueEvent(activeMV, 'change', (v) => setActive(v))
  return { openness, active }
}

// LEFT stage — the currently active card, pulled in from the right stack
// and swept out to the left as the next one takes its place.
// ── Per-benefit motion graphics — a small looping visual that dramatizes
// what each benefit actually means, playing while its card is on stage. ──

// 01 · 포트폴리오 — review records fanning out into a little stack, like a
// portfolio building up one entry at a time.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// Apple "Liquid Glass" palette — the same blue→purple→pink→orange sweep on
// every benefit, so the icon shape (not the color) is what tells them apart.
const IRIDESCENT_STOPS = '#3B82F6, #A855F7, #EC4899, #F97316, #3B82F6'

const BLOB_SHAPES = [
  '42% 58% 65% 35% / 45% 40% 60% 55%',
  '58% 42% 40% 60% / 55% 65% 35% 45%',
  '35% 65% 55% 45% / 40% 45% 60% 55%',
  '42% 58% 65% 35% / 45% 40% 60% 55%',
]

// A soft glass blob whose fill is a slowly-rotating rainbow conic gradient
// (the rotation is what makes the iridescence visibly shift), clipped to a
// morphing, drifting outline. No background box anywhere — it just floats.
// Perf note: backdrop-filter blur is one of the most expensive things a
// browser can animate — it forces a re-sample of everything BEHIND the
// element on every frame. This used to run on 3 blobs per card, each also
// animating position AND a rotating child gradient, for as long as this
// section stayed pinned during scroll (up to 400vh). Swapped the live
// backdrop-blur for a self-contained blurred gradient layer instead (a
// regular `filter: blur()` on the rotating child) — it reads almost
// identically (soft glowing blob) but only ever blurs its own pre-rendered
// texture, never the page behind it, so rotation/scroll stay compositor-only.
function GlassBlob({
  size, top, left, delay = 0, reduced,
}: { size: number; top: string; left: string; delay?: number; reduced: boolean }) {
  return (
    <motion.div
      className="absolute overflow-hidden"
      style={{
        top,
        left,
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow: '0 20px 50px -14px rgba(168,85,247,0.3), inset 0 1px 1px rgba(255,255,255,0.35)',
        willChange: 'border-radius',
      }}
      animate={reduced ? { borderRadius: BLOB_SHAPES[0] } : { borderRadius: BLOB_SHAPES }}
      transition={reduced ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <motion.div
        className="absolute"
        style={{
          inset: '-50%',
          background: `conic-gradient(from 0deg, ${IRIDESCENT_STOPS})`,
          opacity: 0.5,
          filter: 'blur(16px)',
          willChange: 'transform',
        }}
        animate={reduced ? {} : { rotate: 360 }}
        transition={reduced ? undefined : { duration: 12, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  )
}

// A specular highlight sweeping across the glass — the "light refraction" cue.
// Scoped tightly to whatever it's placed inside (the icon lens), never the
// whole stage — a full-stage sheen read as a big flat gray box, not glass.
function GlassSheen({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
      style={{
        background:
          'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.1) 55%, transparent 70%)',
        backgroundSize: '250% 100%',
        mixBlendMode: 'screen',
      }}
      animate={reduced ? {} : { backgroundPositionX: ['-60%', '160%'] }}
      transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
    />
  )
}

// ── Per-benefit illustrated scenes — small, concrete drawings of what each
// benefit actually means, instead of a single generic icon glyph. Every
// shape is stroked/filled with the shared rainbow gradient. ──

const sceneMotion = (i: number) => ({
  initial: { opacity: 0, scale: 0.7, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { delay: 0.12 * i, type: 'spring' as const, stiffness: 220, damping: 20 },
})

// 01 · 포트폴리오 — a fanned stack of review cards, each stamped "checked",
// with a star badge on the front one: activity literally piling into proof.
function PortfolioScene({ gradientId }: { gradientId: string }) {
  const g = `url(#${gradientId})`
  const cards = [
    { x: 46, rotate: -16 },
    { x: 78, rotate: -2 },
    { x: 110, rotate: 14 },
  ]
  return (
    <>
      {cards.map((c, i) => (
        <motion.g key={i} {...sceneMotion(i)} style={{ transformOrigin: `${c.x}px 130px` }}>
          <g transform={`translate(${c.x} 70) rotate(${c.rotate})`}>
            <rect x={-32} y={-42} width={64} height={84} rx={10} fill="rgba(10,10,14,0.65)" stroke={g} strokeWidth={2} />
            <line x1={-18} y1={-18} x2={12} y2={-18} stroke={g} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
            <line x1={-18} y1={-4} x2={18} y2={-4} stroke={g} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
            <line x1={-18} y1={10} x2={6} y2={10} stroke={g} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
            {i === cards.length - 1 && (
              <g transform="translate(20 -30)">
                <circle r={13} fill="rgba(10,10,14,0.85)" stroke={g} strokeWidth={2} />
                <path d="M -5 0 L -1.5 4 L 5 -5" stroke={g} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
            )}
          </g>
        </motion.g>
      ))}
    </>
  )
}

// 02 · 선경험 — a telescope on a tripod, aimed at a glowing "not yet public"
// shape in the distance: spotting what's new before anyone else does.
function FirstLookScene({ gradientId }: { gradientId: string }) {
  const g = `url(#${gradientId})`
  return (
    <>
      {/* Radar rings scanning outward — looking for what's new before it's public */}
      {[70, 90, 110].map((r, i) => (
        <motion.circle
          key={r}
          {...sceneMotion(i)}
          cx={100}
          cy={100}
          r={r}
          fill="none"
          stroke={g}
          strokeWidth={1}
          strokeDasharray="2 8"
          opacity={0.35}
        />
      ))}
      {/* A big, unmistakable eye */}
      <motion.g {...sceneMotion(3)}>
        <path
          d="M 30 100 C 55 55, 145 55, 170 100 C 145 145, 55 145, 30 100 Z"
          fill="rgba(10,10,14,0.75)"
          stroke={g}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle cx={100} cy={100} r={30} fill="rgba(10,10,14,0.9)" stroke={g} strokeWidth={3} />
        <circle cx={100} cy={100} r={14} fill={g} />
      </motion.g>
      {/* A small "new" sparkle caught in view, upper right */}
      <motion.path
        {...sceneMotion(4)}
        d="M 156 42 L 160 54 L 172 58 L 160 62 L 156 74 L 152 62 L 140 58 L 152 54 Z"
        fill={g}
      />
    </>
  )
}

function BenefitScene({ index, gradientId }: { index: number; gradientId: string }) {
  switch (index) {
    case 0: return <PortfolioScene gradientId={gradientId} />
    case 1: return <FirstLookScene gradientId={gradientId} />
    default: return null
  }
}

// Trimmed from 3 blobs per card to 2 — each one is still a shape-morphing,
// blurred, rotating layer, so cutting a third of them cuts a third of the
// per-frame compositing work while the section stays visually just as busy.
const BLOB_LAYOUTS = [
  [
    { size: 260, top: '4%', left: '8%' },
    { size: 190, top: '46%', left: '54%' },
  ],
  [
    { size: 240, top: '10%', left: '52%' },
    { size: 180, top: '48%', left: '6%' },
  ],
  [
    { size: 250, top: '8%', left: '10%' },
    { size: 170, top: '50%', left: '58%' },
  ],
  [
    { size: 230, top: '6%', left: '46%' },
    { size: 190, top: '50%', left: '10%' },
  ],
]

// Big liquid-glass motion graphic: layered morphing, rainbow-iridescent glass
// blobs (no container box — they float straight on the black background)
// with a bold, concretely-drawn gradient-stroked icon as the centerpiece.
function LiquidGlassVisual({ index, active }: { index: number; active: boolean }) {
  const reduced = usePrefersReducedMotion()
  const gradientId = useId()
  const layout = BLOB_LAYOUTS[index]

  // 01 · 포트폴리오 gets the ported acrylic 3D scene instead — it's a
  // complete, self-contained visual (own glass material, own ambient glow),
  // so it skips the shared rainbow-blob background/scrim/icon entirely
  // rather than layering on top of it.
  if (index === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.div
          className="relative z-10"
          style={{ width: 'clamp(420px, 46vw, 620px)', height: 'min(50vh, 500px)' }}
          initial={{ scale: 0.6, opacity: 0, y: 16 }}
          animate={active ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.6, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 210, damping: 20 }}
        >
          <AcrylicPortfolioVisual />
        </motion.div>
      </div>
    )
  }

  // 02 · 선경험 gets the ported neon-bulb 3D scene instead — same reasoning
  // as index 0: it's a complete, self-contained visual, so it skips the
  // shared rainbow-blob background/scrim/icon entirely.
  if (index === 1) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.div
          className="relative z-10"
          style={{ width: 'clamp(420px, 46vw, 620px)', height: 'min(50vh, 500px)' }}
          initial={{ scale: 0.6, opacity: 0, y: 16 }}
          animate={active ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.6, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 210, damping: 20 }}
        >
          <IdeaFirstLookVisual />
        </motion.div>
      </div>
    )
  }

  // 03 · 시장 트렌드 gets the ported glass-dashboard hero scene instead —
  // same reasoning as index 0: it's a complete, self-contained visual, so
  // it skips the shared rainbow-blob background/scrim/icon entirely.
  if (index === 2) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.div
          className="relative z-10"
          style={{ width: 'clamp(620px, 62vw, 820px)', height: 'min(50vh, 500px)' }}
          initial={{ scale: 0.6, opacity: 0, y: 16 }}
          animate={active ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.6, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 210, damping: 20 }}
        >
          <TrendDashboardVisual />
        </motion.div>
      </div>
    )
  }

  // 04 · 사례금 gets the ported glass-wallet scene instead — same reasoning
  // as index 0 and 2: it's a complete, self-contained visual, so it skips
  // the shared rainbow-blob background/scrim/icon entirely.
  if (index === 3) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.div
          className="relative z-10"
          style={{ width: 'clamp(420px, 46vw, 620px)', height: 'min(50vh, 500px)' }}
          initial={{ scale: 0.6, opacity: 0, y: 16 }}
          animate={active ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.6, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 210, damping: 20 }}
        >
          <CompensationVisual />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {active &&
        layout.map((b, i) => (
          <GlassBlob key={i} size={b.size} top={b.top} left={b.left} delay={i * 1.3} reduced={reduced} />
        ))}

      <motion.div
        className="relative z-10 flex items-center justify-center"
        style={{ width: 'clamp(230px, 28vw, 340px)', height: 'clamp(230px, 28vw, 340px)' }}
        initial={{ scale: 0.6, opacity: 0, y: 16 }}
        animate={
          active
            ? reduced
              ? { scale: 1, opacity: 1, y: 0 }
              : { scale: 1, opacity: 1, y: [0, -8, 0, 8, 0] }
            : { scale: 0.6, opacity: 0, y: 16 }
        }
        transition={
          active && !reduced
            ? { scale: { type: 'spring', stiffness: 210, damping: 20 }, opacity: { duration: 0.3 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }
            : { type: 'spring', stiffness: 210, damping: 20 }
        }
      >
        {/* Dark scrim behind the scene — so its gradient lines read crisply
            against the busy rainbow blobs instead of blending into them. */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 78%)' }}
        />
        <svg
          className="relative z-10 w-full h-full"
          viewBox="0 0 200 200"
          fill="none"
          style={{ filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.4))' }}
        >
          <defs>
            {/* userSpaceOnUse (fixed to the scene's own 200×200 viewBox)
                instead of the default objectBoundingBox: a purely vertical
                or horizontal sub-path (e.g. a chart bar) has a zero-width
                bbox, which makes an objectBoundingBox gradient render
                invisible on exactly that sub-path — this keeps every shape
                lit consistently regardless of its own bounding box. */}
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="200">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="35%" stopColor="#A855F7" />
              <stop offset="68%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          {active && <BenefitScene index={index} gradientId={gradientId} />}
        </svg>
        {active && <GlassSheen reduced={reduced} />}
      </motion.div>
    </div>
  )
}

// Dynamic header block — the active benefit's title/tagline/desc/stats take
// over the section's big-title spot, crossfading + rising in as the line
// reaches them, instead of living inside a smaller card further down.
function BenefitHeaderText({ item, index, scrollYProgress }: { item: BenefitItem; index: number; scrollYProgress: MotionValue<number> }) {
  const { openness, active } = useBenefitOpenness(scrollYProgress, index)
  const a0 = index * BENEFITS_SEG
  const a1 = a0 + BENEFITS_SEG * 0.2
  const y = useTransform(scrollYProgress, (p) => (1 - clampNum((p - a0) / (a1 - a0), 0, 1)) * 22)

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center"
      style={{ opacity: openness, y, pointerEvents: active ? 'auto' : 'none' }}
    >
      <span className="text-[#42A5F5] text-xs font-bold tracking-[0.15em] mb-3">
        {item.n} · {item.category}
      </span>
      <h3 className="text-white font-bold leading-[1.15] mb-3 break-keep" style={{ fontSize: 'clamp(28px, 3vw, 46px)' }}>
        {item.title}
      </h3>
      {item.tagline && <p className="text-white/45 text-[15px] font-medium mb-3 break-keep">{item.tagline}</p>}
      <p className="text-white/50 leading-relaxed break-keep max-w-[560px]" style={{ fontSize: '15px' }}>
        {item.desc}
      </p>

      {(item.stats || item.tag) && (
        <div className="mt-5 flex items-center gap-8 flex-wrap">
          {item.stats?.map((s) => (
            <div key={s.label}>
              <div className="font-black tabular-nums" style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#22C55E' }}>
                {s.value}
              </div>
              <div className="text-white/40 text-[11px] mt-1 whitespace-nowrap">{s.label}</div>
            </div>
          ))}
          {item.tag && (
            <span
              className="text-[12px] text-white/50 font-medium rounded-full px-3.5 py-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {item.tag}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// The big liquid-glass stage panel — a large crossfading canvas dedicated to
// each benefit's motion graphic, far bigger than the old inline icon spot.
function BenefitGraphicStage({ index, scrollYProgress }: { index: number; scrollYProgress: MotionValue<number> }) {
  const { openness, active } = useBenefitOpenness(scrollYProgress, index)
  return (
    <motion.div className="absolute inset-0" style={{ opacity: openness }}>
      <LiquidGlassVisual index={index} active={active} />
    </motion.div>
  )
}

// RIGHT stack — the queued list; the active row lights up, the rest stay dim.
// A clean typographic list row (bold title + gray description, no icon
// chrome) — the active one lights up in white, the rest stay dim.
function BenefitStackRow({ item, index, scrollYProgress }: { item: BenefitItem; index: number; scrollYProgress: MotionValue<number> }) {
  const { active } = useBenefitOpenness(scrollYProgress, index)
  const description = item.tagline ?? item.desc

  // Follow the same bulge as the curve beside it: rows near the top/bottom
  // sit close in, the middle rows push further right — so the text block
  // itself traces the round line instead of staying in a flat column.
  const t = index / (benefitCards.length - 1)
  const bulge = Math.sin(t * Math.PI)
  const indent = 6 + bulge * 34

  return (
    <div className="py-4 transition-all duration-300" style={{ opacity: active ? 1 : 0.4, marginLeft: indent }}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span
          className="text-[11px] font-bold tabular-nums transition-colors duration-300"
          style={{ color: active ? '#A855F7' : 'rgba(255,255,255,0.3)' }}
        >
          {item.n}
        </span>
        <h4
          className="font-bold leading-snug transition-colors duration-300"
          style={{ fontSize: '16px', color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
        >
          {item.category}
        </h4>
      </div>
      <p className="text-white/40 text-[13px] leading-relaxed break-keep" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {description}
      </p>
    </div>
  )
}


// Pinned scroll stage: the whole section stays fixed on screen while the
// scroll distance advances which card is "pulled out" from the right stack
// into the left main view — mirrors an Apple-style feature reveal instead of
// a long vertically-scrolling grid.
function BenefitsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  return (
    <section id="reviewer-benefits" className="snap-section-auto relative" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div ref={containerRef} className="hidden lg:block relative" style={{ height: `${benefitCards.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden px-8 md:px-16">
          <div className="max-w-[1440px] mx-auto w-full">
            {/* Static eyebrow */}
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.25em] mb-5">Benefits</p>

            {/* Dynamic header — the active benefit's own title/tagline/desc/stats
                take over this spot, crossfading as the next one arrives. */}
            <div className="relative mb-8" style={{ minHeight: 'clamp(250px, 34vh, 340px)' }}>
              {benefitCards.map((item, i) => (
                <BenefitHeaderText key={item.n} item={item} index={i} scrollYProgress={scrollYProgress} />
              ))}
            </div>

            {/* Big liquid-glass stage (left, no box — floats free on black)
                + queued list (right). The panel's edge facing the graphic
                stays flat; only its outer/far edge bulges into a ")" curve —
                so the shape never intrudes into the graphic's own space. */}
            <div className="flex gap-2 lg:gap-6 items-stretch" style={{ height: 'min(50vh, 500px)' }}>
              <div className="relative flex-1 min-w-0 overflow-hidden">
                {benefitCards.map((item, i) => (
                  <BenefitGraphicStage key={item.n} index={i} scrollYProgress={scrollYProgress} />
                ))}
              </div>
              <div className="hidden lg:flex relative flex-col justify-center w-[290px] shrink-0 pl-10 pr-6">
                {benefitCards.map((item, i) => (
                  <BenefitStackRow key={item.n} item={item} index={i} scrollYProgress={scrollYProgress} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: simple stacked cards, no pin */}
      <div className="lg:hidden px-6 py-20">
        <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.25em] mb-4">Benefits</p>
        <h2 className="font-bold leading-[1.2] mb-4" style={{ fontSize: 'clamp(26px, 6vw, 36px)' }}>
          리뷰가 포트폴리오가 됩니다
        </h2>
        <p className="text-white/45 mb-10 text-[15px]">
          참여할수록 쌓이는 것들 — 경험, 시각, 그리고 증명 가능한 기록.
        </p>
        <div className="flex flex-col gap-5">
          {benefitCards.map((item, i) => {
            return (
              <div
                key={item.n}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: item.highlight
                    ? 'radial-gradient(ellipse 120% 100% at 15% 0%, rgba(34,197,94,0.14) 0%, rgba(255,255,255,0.03) 60%)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${item.highlight ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="relative overflow-hidden mb-5" style={{ height: 180 }}>
                  <LiquidGlassVisual index={i} active />
                </div>
                <span className="text-[#42A5F5] text-xs font-bold tracking-[0.15em] mb-2">
                  {item.n} · {item.category}
                </span>
                <h3 className="text-white font-bold leading-snug mb-2 break-keep text-[19px]">{item.title}</h3>
                {item.tagline && <p className="text-white/40 text-[13px] font-medium mb-3 break-keep">{item.tagline}</p>}
                <p className="text-white/50 text-[14px] leading-relaxed break-keep">{item.desc}</p>
                {item.stats && (
                  <div
                    className="mt-5 rounded-xl px-4 py-4"
                    style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}
                  >
                    {item.statsLabel && <p className="text-white/35 text-[11px] font-semibold mb-3">{item.statsLabel}</p>}
                    <div className="flex items-end gap-6 flex-wrap">
                      {item.stats.map((s) => (
                        <div key={s.label}>
                          <div className="font-black tabular-nums text-[22px]" style={{ color: '#22C55E' }}>{s.value}</div>
                          <div className="text-white/40 text-[11px] mt-1 whitespace-nowrap">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.tag && (
                  <span
                    className="mt-5 inline-block self-start text-[12px] text-white/50 font-medium rounded-full px-3.5 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {item.tag}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const howSteps = [
  { n: '01', title: '관심 카테고리 설정', short: '카테고리 설정', desc: '내 관심 분야, 직군, 경험을 프로필에 등록합니다' },
  { n: '02', title: '프로젝트 탐색 및 신청', short: '탐색 · 신청', desc: '카테고리별 의뢰 목록에서 원하는 프로젝트를 신청합니다' },
  { n: '03', title: '솔직한 리뷰 작성', short: '리뷰 작성', desc: '크리에이터의 가이드라인에 따라 진짜 의견을 제출합니다' },
  { n: '04', title: '활동 기록 + 사례금', short: '기록 · 사례금', desc: '리뷰 완료 후 포트폴리오에 자동으로 기록됩니다', note: '사례금은 해당 의뢰에 한해 지급됩니다' },
]

// Auto-advancing "subway line" stepper: no manual tabs — a single line runs
// left to right with a station per phase, a train glides between them on a
// timer, and the left-side detail text crossfades to match whichever station
// the train is currently sitting at.
const HOW_INTERVAL = 3400

function ReviewerHowSection() {
  const [active, setActive] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setActive((a) => (a + 1) % howSteps.length), HOW_INTERVAL)
    return () => clearInterval(id)
  }, [reduced])

  const stationPct = (i: number) => (i / (howSteps.length - 1)) * 100

  return (
    <section id="reviewer-how" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-[1200px] mx-auto px-8 md:px-16 h-full flex items-center">
        <div className="w-full">
          <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.2em] mb-4">How it works</p>
          <h2 className="font-bold mb-2" style={{ fontSize: 'clamp(32px, 3vw, 52px)' }}>이렇게 참여합니다</h2>
          <p className="text-white/40 text-sm mb-16">4단계로 끝나는 리뷰어 플로우</p>

          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="relative" style={{ minHeight: 140 }}>
              {howSteps.map((s, i) => (
                <motion.div
                  key={s.n}
                  className="absolute inset-0"
                  animate={{ opacity: i === active ? 1 : 0, y: i === active ? 0 : 10 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ pointerEvents: i === active ? 'auto' : 'none' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#42A5F5' }} />
                    <span className="text-[#42A5F5] text-xs font-bold tracking-wide">STEP {s.n}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed max-w-[380px]">{s.desc}</p>
                  {s.note && <p className="text-white/25 text-xs mt-4">{s.note}</p>}
                </motion.div>
              ))}
            </div>

            {/* Metro-map timeline — dashed static line through evenly-spaced,
                always-lit stations; only a capsule "you are here" outline
                glides between them as the active step auto-advances. */}
            <div className="relative pt-14 pb-2 hidden md:block">
              <div className="relative" style={{ height: 2 }}>
                {/* Dashed track — the line itself never fills/animates */}
                <div
                  className="absolute left-0 right-0 top-0 h-px"
                  style={{ background: 'repeating-linear-gradient(90deg, #42A5F5 0 6px, transparent 6px 12px)', opacity: 0.6 }}
                />

                {howSteps.map((s, i) => {
                  const isActive = i === active
                  return (
                    <div
                      key={s.n}
                      className="absolute"
                      style={{ left: `${stationPct(i)}%`, top: 0, width: 1, height: 1 }}
                    >
                      {/* Everything below is centered on this exact point (the dot).
                          The centering transform lives on a plain (non-motion)
                          wrapper, never on the layoutId element itself — framer
                          motion's shared-layout FLIP animation drives the
                          `transform` property on a `layoutId` element directly,
                          so a manually-set `translate(-50%,-50%)` on that same
                          element gets discarded once the layout animation
                          takes over, leaving the marker off-center. Keeping the
                          centering on an untouched parent and letting the
                          motion element simply fill it (inset-0) sidesteps
                          that conflict entirely. */}
                      {isActive && (
                        <div className="absolute" style={{ left: 0, top: -46, transform: 'translateX(-50%)' }}>
                          <motion.span
                            layoutId="how-current-label"
                            className="text-[#42A5F5] text-[11px] font-bold whitespace-nowrap px-1"
                            style={{ background: '#0A0A0C' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            현재 단계
                          </motion.span>
                        </div>
                      )}
                      {isActive && (
                        <div
                          className="absolute"
                          style={{ left: 0, top: 0, width: 40, height: 60, transform: 'translate(-50%, -50%)' }}
                        >
                          <motion.span
                            layoutId="how-current-oval"
                            className="absolute inset-0 rounded-full"
                            style={{ border: '1.5px solid #42A5F5' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        </div>
                      )}
                      <span
                        className="absolute rounded-full"
                        style={{ left: 0, top: 0, width: 12, height: 12, background: '#42A5F5', transform: 'translate(-50%, -50%)' }}
                      />
                      <span
                        className="absolute text-[11px] whitespace-nowrap transition-colors duration-500"
                        style={{ left: 0, top: 22, transform: 'translateX(-50%)', color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}
                      >
                        {s.short}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Placeholder mock-up: once the platform is live this slot will show a
// rotating sample of REAL creator projects that are open for review. Built
// now as a continuously auto-playing coverflow so it already reads as "a
// live feed" rather than a static list, ahead of the real data existing.
const liveProjects = [
  { category: '헬스케어', color: '#42A5F5', title: '당뇨 관리 앱 UI/UX 개선안 — 사용자 입장에서 어떤가요?', time: '약 20분', reward: '5,000원', deadline: '3일 후' },
  { category: '푸드테크', color: '#3B82F6', title: '친환경 배달 포장재 아이디어 — 실제로 쓰겠어요?', time: '약 15분', reward: null, deadline: '7일 후' },
  { category: 'B2B SaaS', color: '#1E6FD6', title: '스타트업 HR 툴 기능 우선순위 — 어떤 게 더 필요한가요?', time: '약 25분', reward: '8,000원', deadline: '5일 후' },
  { category: '커머스', color: '#5B8DEF', title: '무자본 D2C 브랜드 네이밍 검증 — 이 이름, 기억에 남나요?', time: '약 10분', reward: null, deadline: '2일 후' },
  { category: '에듀테크', color: '#8FCBFF', title: '직장인 대상 마이크로러닝 앱 — 10분 학습, 실제로 효과 있을까요?', time: '약 20분', reward: '4,000원', deadline: '10일 후' },
]

// Auto-rotating deck — a timer advances `active` forever (no scroll
// dependency at all, so there's nothing for the page scroll to "fly through"
// or get stuck on). Depth = how many ticks ago each card was last in front
// (wrapping, since it's a continuous loop); scale/blur/rotate/offset all
// grow with depth, same shape as reactbits' ScrollStack, just driven by a
// timer instead of scroll position.
const CARD_W = 460
const CARD_H = 320
const STACK_DISTANCE = 18   // px the stack recedes upward per depth level
const STACK_SCALE_STEP = 0.045
const STACK_ROTATE_STEP = -2.2 // deg
const STACK_BLUR_STEP = 1.6    // px
const MAX_DEPTH = 4
const ROTATE_MS = 2400

function ProjectStackCard({
  p, depth,
}: { p: (typeof liveProjects)[number]; depth: number }) {
  const d = Math.min(depth, MAX_DEPTH)
  const isActive = depth === 0

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 shrink-0 overflow-hidden rounded-[32px]"
      style={{
        width: CARD_W,
        height: CARD_H,
        marginLeft: -CARD_W / 2,
        marginTop: -CARD_H / 2,
        zIndex: 100 - depth,
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.55)',
      }}
      animate={{
        y: -d * STACK_DISTANCE,
        scale: Math.max(0.7, 1 - d * STACK_SCALE_STEP),
        opacity: Math.max(0.35, 1 - d * 0.14),
        rotate: d * STACK_ROTATE_STEP,
        filter: d > 0.05 ? `blur(${d * STACK_BLUR_STEP}px)` : 'none',
      }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(155deg, ${p.color}, #0A0A0C 130%)` }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
      <div className="absolute inset-x-0 bottom-0 p-6 flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
          style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}
        >
          {p.category.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-white text-[14px] font-bold mb-1">{p.category}</div>
          <div className="text-white/70 text-[12.5px] leading-snug break-keep">{p.title}</div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50">
            <span>{p.time}</span>
            <span style={{ color: p.reward ? '#4ADE80' : undefined }}>{p.reward ?? '무보상'}</span>
            <span>{p.deadline}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function LiveProjectsSection() {
  const n = liveProjects.length
  const [active, setActive] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setActive((a) => (a + 1) % n), ROTATE_MS)
    return () => clearInterval(id)
  }, [reduced, n])

  return (
    <section id="reviewer-live-projects" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-[1440px] mx-auto h-full flex flex-col items-center justify-center px-8">
        <div className="text-center mb-14">
          <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.25em] mb-4">Live projects</p>
          <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(28px, 3vw, 46px)' }}>이런 의뢰들이 올라옵니다</h2>
          <p className="text-white/40 text-sm md:text-base">어떤 아이디어가 지금 검증을 기다리고 있는지 미리 살펴보세요.</p>
        </div>

        <div className="relative w-full" style={{ height: CARD_H + 60 }}>
          {liveProjects.map((p, i) => (
            <ProjectStackCard key={p.title} p={p} depth={(active - i + n) % n} />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-10 text-white/30 text-[12.5px]">
          <span>🔒</span>
          <span>모든 프로젝트는 NDA로 아이디어가 보호됩니다</span>
        </div>
      </div>
    </section>
  )
}

// ── Main ────────────────────────────────────────────────────
interface Props { onSwitchToCreator: () => void }

export default function ReviewerLanding({ onSwitchToCreator }: Props) {
  useEffect(() => {
    document.documentElement.classList.add('snap-active')
    return () => document.documentElement.classList.remove('snap-active')
  }, [])

  return (
    <div style={{ background: '#0D0D10', color: '#fff' }}>
      <ReviewerHeader onSwitchToCreator={onSwitchToCreator} />
      <CreatorPeek onEnter={onSwitchToCreator} />
      <ScrollIndicator side="right" mode="reviewer" />

      {/* Hero */}
      <section id="reviewer-hero" className="snap-section relative">
        {/* Full-bleed hero background — the same wide diorama image as the
            creator hero (see HeroSection.tsx), rendered at double viewport
            width and shifted left by exactly one viewport so this section
            shows its right half (the cool/blue room). Positioned identically
            to the creator copy so switching between the two pages reads as
            one continuous scene revealing its other half. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div style={{ position: 'absolute', top: 0, left: '-100vw', width: '200vw', height: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero/hero-scene-full.png"
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 60%' }}
            />
          </div>
          {/* Legibility scrim — opaque near the text (right), fading out
              toward the image (left). */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to left, #0D0D10 0%, rgba(13,13,16,0.94) 22%, rgba(13,13,16,0.6) 42%, rgba(13,13,16,0.12) 62%, transparent 78%)',
            }}
          />
        </div>

        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center relative z-10">
          <div className="max-w-[680px] ml-auto">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(66,165,245,0.12)', border: '1px solid rgba(66,165,245,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#42A5F5] animate-pulse" />
              <span className="text-[#42A5F5] text-xs font-semibold uppercase tracking-widest">Reviewer</span>
            </div>
            <h1 className="font-black leading-[1.0] tracking-tight mb-8"
              style={{ fontSize: 'clamp(52px, 6vw, 96px)' }}>
              신제품을<br />
              <span style={{ color: '#42A5F5' }}>먼저</span><br />
              경험하세요
            </h1>
            <p className="text-white/50 leading-relaxed mb-12 max-w-[440px]"
              style={{ fontSize: 'clamp(16px, 1.2vw, 20px)' }}>
              관심 분야의 출시 전 제품을 리뷰하고<br />
              전문성을 수익으로 연결하세요.
            </p>
            <a
              href="/evaluator/dashboard"
              className="flex items-center gap-2 font-bold rounded-full text-white hover:scale-[1.03] transition-transform"
              style={{ background: '#42A5F5', padding: '16px 36px', fontSize: '16px', boxShadow: '0 4px 32px rgba(66,165,245,0.35)' }}
            >
              리뷰어 등록하기 <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Role intro — 리뷰어란 (이미지4 스타일: 좌 헤딩+아웃라인 버튼 / 우 파티클 비주얼) */}
      <section id="reviewer-role-intro" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* 우측 글로우 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 70% at 78% 50%, rgba(66,165,245,0.08) 0%, transparent 70%)',
        }} />

        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center justify-between gap-10 relative z-10">

          {/* 좌측: 라벨 + 헤딩 + 문단 + 아웃라인 버튼 */}
          <div className="flex flex-col items-start flex-shrink-0" style={{ maxWidth: '520px' }}>
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.25em] mb-7">What reviewers do</p>
            <h2 className="font-bold leading-[1.08] tracking-tight mb-8" style={{ fontSize: 'clamp(40px, 4vw, 68px)' }}>
              당신의 경험으로<br />제품을 진단하세요
            </h2>
            <p className="text-white/45 leading-relaxed mb-11" style={{ fontSize: '17px', maxWidth: '420px' }}>
              출시 전 신제품을 직접 써보고 솔직한 피드백을 남기면,
              그 데이터가 제품의 방향을 결정해요. 전문성을 살려 부수입까지 얻으세요.
            </p>
            <a
              href="/evaluator/dashboard"
              className="group flex items-center gap-3 rounded-full font-semibold text-white transition-colors"
              style={{ padding: '15px 32px', fontSize: '14px', letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              리뷰어 시작하기
              <span className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                style={{ background: 'rgba(66,165,245,0.15)' }}>
                <ArrowRight className="w-3.5 h-3.5 text-[#42A5F5]" />
              </span>
            </a>
          </div>

          {/* 우측: 유기적 파티클 비주얼 */}
          <div className="hidden lg:flex justify-end flex-shrink-0">
            <ParticleStrand />
          </div>

        </div>
      </section>

      {/* Benefits — 오른쪽 대기열에서 왼쪽 스테이지로 순서대로 뽑혀 나오는 고정 스크롤 카드 */}
      <BenefitsSection />

      {/* How it works */}
      <ReviewerHowSection />

      {/* Live projects (mock-up — becomes a real rotating feed post-launch) */}
      <LiveProjectsSection />

      {/* RoleSection (역할) */}
      <div id="reviewer-role" className="snap-section">
        <RoleSection onSeeCreator={onSwitchToCreator} dark={true} />
      </div>

      {/* Footer */}
      <div className="snap-section-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Footer />
      </div>
    </div>
  )
}
