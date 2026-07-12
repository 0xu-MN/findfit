'use client'

import { useEffect, useRef, useState } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'

const steps = [
  {
    n: '01',
    title: '프로젝트 등록',
    desc: '아이디어·서비스 정보를 입력하고 공개 범위와 리뷰 유형을 설정해요',
    tag: '스탠다드 / 라이트 선택 가능',
  },
  {
    n: '02',
    title: '리뷰어 매칭',
    desc: 'FindFit이 조건에 맞는 리뷰어를 자동으로 연결하고 NDA 동의를 처리해요',
    tag: '타겟 기반 필터링 적용',
  },
  {
    n: '03',
    title: '피드백 수집',
    desc: '리뷰어들이 상세 평가와 의견을 작성해요. 진행 상황을 실시간으로 확인할 수 있어요',
    tag: 'NDA 보호 상태로 진행',
  },
  {
    n: '04',
    title: 'AI 분석 리포트',
    desc: 'AI가 피드백 패턴을 분석해 핵심 인사이트와 우선순위 개선 사항을 정리해요',
    tag: 'PDF 다운로드 / 공유 링크 제공',
  },
]

const SEG = 1 / steps.length

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

type Pt = { x: number; y: number }

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// Builds an SVG path through the waypoints, rounding every interior corner
// with radius r. Straight segments in between stay crisp.
function roundedPath(pts: Pt[], r: number) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    const prev = pts[i - 1]
    const next = pts[i + 1]
    const dp = dist(p, prev)
    const dn = dist(p, next)
    const rr = Math.max(0, Math.min(r, dp / 2, dn / 2))
    const a = { x: p.x + ((prev.x - p.x) / dp) * rr, y: p.y + ((prev.y - p.y) / dp) * rr }
    const b = { x: p.x + ((next.x - p.x) / dn) * rr, y: p.y + ((next.y - p.y) / dn) * rr }
    d += ` L ${a.x} ${a.y} Q ${p.x} ${p.y} ${b.x} ${b.y}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

function FullStep({
  step,
  index,
  size,
  progress,
}: {
  step: (typeof steps)[number]
  index: number
  size: { w: number; h: number }
  progress: number
}) {
  const a0 = index * SEG
  const a3 = (index + 1) * SEG
  const margin = SEG * 0.18
  const a1 = a0 + margin
  const a2 = a3 - margin

  const fadeIn = clamp((progress - a0) / (a1 - a0), 0, 1)
  const fadeOut = clamp((a3 - progress) / (a3 - a2), 0, 1)
  const isFirst = index === 0
  const isLast = index === steps.length - 1
  const opacity = isFirst ? fadeOut : isLast ? fadeIn : Math.min(fadeIn, fadeOut)
  const y = isFirst ? (1 - fadeOut) * -40 : isLast ? (1 - fadeIn) * 40 : (1 - fadeIn) * 40 + (1 - fadeOut) * -40

  // The orange portion of the line grows in lock-step with scroll across
  // this step's whole dwell, finishing right as the exit fade begins.
  const drawFrac = clamp((progress - a0) / (a2 - a0), 0, 1)

  const isLeft = index % 2 === 0
  const { w, h } = size

  // Line drops in vertically from dead center at the top, bulges left or
  // right past the number, then returns to dead center at the bottom.
  // Every step shares the same entry/exit anchor, so as one step's line
  // fades out and the next fades in, the center stays put — no left/right
  // jump between steps, just one continuous line sliding down.
  const xCenter = w * 0.5
  const xFar = isLeft ? w * 0.24 : w * 0.76
  const yA = h * 0.32
  const yB = h * 0.6
  const r = Math.min(w, h) * 0.09

  const d = roundedPath(
    [
      { x: xCenter, y: 0 },
      { x: xCenter, y: yA },
      { x: xFar, y: yA },
      { x: xFar, y: yB },
      { x: xCenter, y: yB },
      { x: xCenter, y: h },
    ],
    r
  )

  // Sits on the belly of the line, where it bulges out to xFar.
  const numberY = (yA + yB) / 2

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity, transform: `translateY(${y}px)` }}>
      <svg className="absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        <path d={d} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
        <path
          d={d}
          stroke="#F77019"
          strokeWidth={1.5}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 * (1 - drawFrac)}
        />
      </svg>

      <div
        className="absolute flex items-center gap-5"
        style={{
          top: numberY,
          left: isLeft ? xFar + 24 : undefined,
          right: isLeft ? undefined : w - xFar + 24,
          transform: 'translateY(-50%)',
          flexDirection: isLeft ? 'row' : 'row-reverse',
        }}
      >
        <span
          className="font-thin leading-none text-white shrink-0"
          style={{ fontSize: 'clamp(56px, 8vw, 120px)' }}
        >
          {step.n}
        </span>
        <div className={isLeft ? 'text-left' : 'text-right'} style={{ maxWidth: 'min(24vw, 300px)' }}>
          <h3 className="text-white font-medium leading-snug mb-2 break-keep" style={{ fontSize: 'clamp(18px, 1.8vw, 24px)' }}>
            {step.title}
          </h3>
          <p className="text-white/45 font-light leading-relaxed mb-3 break-keep" style={{ fontSize: 'clamp(13px, 1.1vw, 15px)' }}>
            {step.desc}
          </p>
          <span className="text-[11px] text-[#F77019]/80 font-medium tracking-wide">{step.tag}</span>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [progress, setProgress] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => setProgress(v))

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setSize({ w: rect.width, h: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = mobileRef.current
    if (!root) return
    const targets = root.querySelectorAll('.fade-up-init')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="howworks-section" className="snap-section-auto bg-black relative">
      {/* ── Desktop: pinned, one full-bleed step at a time ── */}
      <div ref={containerRef} className="hidden md:block relative" style={{ height: `${steps.length * 100}vh` }}>
        <div className="sticky top-0 h-screen w-full flex flex-col overflow-hidden px-10 lg:px-20 py-16">
          {/* Heading */}
          <div className="max-w-[1280px] mx-auto w-full shrink-0 mb-6">
            <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-4">
              How it works
            </span>
            <h2
              className="font-black leading-[1.25] tracking-tight text-white mb-5"
              style={{ fontSize: 'clamp(28px, 3.2vw, 44px)' }}
            >
              4단계로 완성되는
              <br />
              고객 검증 사이클
            </h2>
            <p className="text-white/50 text-[15px] md:text-base max-w-[420px]">
              등록부터 결과 분석까지, FindFit이 전 과정을 안내합니다.
            </p>
          </div>

          {/* Full-bleed step stage */}
          <div ref={stageRef} className="max-w-[1280px] mx-auto w-full flex-1 relative min-h-0">
            {size &&
              steps.map((step, i) => (
                <FullStep key={step.n} step={step} index={i} size={size} progress={progress} />
              ))}
          </div>
        </div>
      </div>

      {/* ── Mobile: static vertical fallback ── */}
      <div ref={mobileRef} className="md:hidden py-20 px-6">
        <div className="mb-14 fade-up-init">
          <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-4">
            How it works
          </span>
          <h2 className="font-black leading-[1.25] tracking-tight text-white mb-5" style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}>
            4단계로 완성되는
            <br />
            고객 검증 사이클
          </h2>
          <p className="text-white/50 text-[15px] max-w-[360px]">
            등록부터 결과 분석까지, FindFit이 전 과정을 안내합니다.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {steps.map((step, i) => (
            <div key={step.n} className={`fade-up-init delay-${i + 1} flex gap-5`}>
              <div className="w-12 h-12 rounded-full border-2 border-[#F77019] flex items-center justify-center shrink-0 font-black text-[#F77019] tabular-nums">
                {step.n}
              </div>
              <div>
                <h3 className="text-white font-bold text-[17px] mb-2">{step.title}</h3>
                <p className="text-white/50 text-[13px] leading-relaxed mb-3 break-keep">{step.desc}</p>
                <span className="text-[11px] text-[#F77019]/80 font-medium tracking-wide">{step.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
