'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

const steps = [
  { n: '01', title: '프로젝트 등록', desc: '아이디어·서비스 정보를 입력하고 공개 범위와 리뷰 유형을 설정해요', tag: '스탠다드 / 라이트 선택 가능' },
  { n: '02', title: '리뷰어 매칭', desc: 'FindFit이 조건에 맞는 리뷰어를 자동으로 연결하고 NDA 동의를 처리해요', tag: '타겟 기반 필터링 적용' },
  { n: '03', title: '피드백 수집', desc: '리뷰어들이 상세 평가와 의견을 작성해요. 진행 상황을 실시간으로 확인할 수 있어요', tag: 'NDA 보호 상태로 진행' },
  { n: '04', title: 'AI 분석 리포트', desc: 'AI가 피드백 패턴을 분석해 핵심 인사이트와 우선순위 개선 사항을 정리해요', tag: 'PDF 다운로드 / 공유 링크 제공' },
]

// ─── SVG geometry ─────────────────────────────────────────────────────────────
// Track shape: a long straight vertical entry line, then each hollow (⊂/⊃)
// exits with an already-horizontal tangent straight into a long horizontal
// shelf, which glides straight into the next hollow (same horizontal tangent,
// no extra corner needed there) — then a long straight vertical exit line.
// The ONLY vertical straight runs are the entry (top) and exit (bottom).
const SVG_W = 100

const CX        = 50    // centre line — where the entry/exit straight lines sit
const HOLLOW_H  = 62     // vertical span of one hollow
const RY        = HOLLOW_H / 2                          // 31
const H_LEN     = 16     // horizontal shelf between hollows — real, but narrow enough that a circular hollow still fits on-screen
const PAD_T     = 100    // entry straight, above step 1
const PAD_B     = 100    // exit straight, below the last step
const CORNER    = 7      // small fixed corner that blends the entry/exit vertical tangent into the first/last hollow's horizontal tangent

const SVG_H = PAD_T + steps.length * HOLLOW_H + PAD_B

// A hollow's own start/end tangent is horizontal (it's a semicircle whose two
// endpoints share the same x), so it glides directly into a horizontal shelf
// with zero extra corner — the shelf itself is just the straight continuation.
// Only the very first (vertical→horizontal) and very last (horizontal→vertical)
// transitions need the small CORNER blend.
function buildPath(rx: number): string {
  const parts: string[] = [
    `M ${CX - CORNER} 0`,
    `L ${CX - CORNER} ${PAD_T - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 0 ${CX} ${PAD_T}`,
  ]
  let x = CX
  let y = PAD_T
  for (let i = 0; i < steps.length; i++) {
    const sweep = i % 2 === 0 ? 1 : 0        // bulge direction of this hollow
    parts.push(`A ${rx} ${RY} 0 0 ${sweep} ${x} ${y + HOLLOW_H}`)
    y += HOLLOW_H
    const exitSign = sweep === 1 ? -1 : 1     // direction the hollow's exit tangent already points
    x += exitSign * H_LEN
    parts.push(`L ${x} ${y}`)                 // horizontal shelf, no corner needed
  }
  parts.push(
    `A ${CORNER} ${CORNER} 0 0 1 ${CX + CORNER} ${SVG_H - PAD_B + CORNER}`,
    `L ${CX + CORNER} ${SVG_H}`,
  )
  return parts.join(' ')
}

// Local x-centre (SVG units = %) of hollow i — used to anchor its label
function hollowCenterX(i: number): number {
  let x = CX
  for (let k = 0; k < i; k++) {
    const sweep = k % 2 === 0 ? 1 : 0
    x += (sweep === 1 ? -1 : 1) * H_LEN
  }
  return x
}

// ─── Scroll geometry ──────────────────────────────────────────────────────────
const MOVING_VH = Math.round(SVG_H * 0.956)  // keeps the same vh-per-svg-unit pacing as before
const VH_COEFF  = MOVING_VH / SVG_H

// belly[i] (hollow centre) position inside the moving div, in vh
function bellyDivVh(i: number) {
  return (PAD_T + i * HOLLOW_H + RY) * VH_COEFF
}

// At scroll=0 belly 1 sits LOW (85vh) so the straight entry line is fully
// visible descending from the viewport top. At scroll=1 belly 4 sits HIGH
// (15vh) so the straight exit line runs off the bottom.
const SNAKE_START = (85 - bellyDivVh(0)) / 100
const SNAKE_END   = (15 - bellyDivVh(steps.length - 1)) / 100

const CONTAINER_VH = Math.round(Math.abs(SNAKE_END - SNAKE_START) * 100 + 100)

// scroll progress at which belly[i] crosses the viewport centre
const STEP_P = steps.map(
  (_, i) => ((50 - bellyDivVh(i)) / 100 - SNAKE_START) / (SNAKE_END - SNAKE_START),
)
const ACTIVE_WINDOW = 0.1  // ± progress range in which a step counts as active

// Label anchor (% of moving div height) — hollow centre
function bellyYPct(i: number) {
  return (PAD_T + i * HOLLOW_H + RY) / SVG_H * 100
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef      = useRef<SVGPathElement>(null)
  const [pathLen, setPathLen]       = useState(0)
  const [vh, setVh]                 = useState(0)
  const [cw, setCw]                 = useState(0)
  const [activeStep, setActiveStep] = useState(-1)
  const lastStepRef = useRef(0)

  useEffect(() => {
    const update = () => {
      setVh(window.innerHeight)
      setCw(Math.min(1100, window.innerWidth))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // preserveAspectRatio="none" scales x and y independently, which flattens a
  // naive circular arc into an ellipse. Pick rx so the ON-SCREEN x-radius
  // equals the on-screen y-radius, so the hollow renders as a true circle
  // regardless of viewport aspect ratio — then clamp so hollow + shelf still
  // fit inside the container (rx + H_LEN must stay under ~47% of the width).
  const rxMain = useMemo(() => {
    if (!vh || !cw) return 30
    const ryPx = RY * (MOVING_VH / 100) * vh / SVG_H
    const pxPerUnitX = cw / SVG_W
    const circularRx = ryPx / pxPerUnitX
    return Math.min(47 - H_LEN, Math.max(20, circularRx))
  }, [vh, cw])

  const pathD = useMemo(() => buildPath(rxMain), [rxMain])

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
  }, [pathD])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // A step is active while the orange line tip is near its belly;
  // between steps every label fades out.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    let s = -1
    for (let i = 0; i < STEP_P.length; i++) {
      if (Math.abs(p - STEP_P[i]) < ACTIVE_WINDOW) s = i
    }
    if (s >= 0) lastStepRef.current = s
    setActiveStep(s)
  })

  // Moving div translation: scrolls snake so each belly passes through centre
  const snakeY = useTransform(
    scrollYProgress,
    [0, 1],
    vh > 0 ? [SNAKE_START * vh, SNAKE_END * vh] : [0, 0],
  )

  // Orange line draws from top to bottom with scroll progress
  const orangeOffset = useTransform(
    scrollYProgress,
    [0, 1],
    pathLen > 0 ? [pathLen, 0] : [0, 0],
  )

  return (
    <section id="howworks-section" className="snap-section-auto bg-black relative">

      {/* ── Desktop ── */}
      <div
        ref={containerRef}
        className="hidden md:block relative"
        style={{ height: `${CONTAINER_VH}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">

          {/* Moving snake container */}
          <motion.div
            className="absolute inset-x-0 top-0 w-full"
            style={{ height: `${MOVING_VH}vh`, y: snakeY }}
          >
            {/* Constrained to header content width */}
            <div className="relative h-full max-w-[1100px] mx-auto">

              {/* SVG snake path */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="none"
                fill="none"
              >
                {/* Hidden reference path for getTotalLength() */}
                <path ref={pathRef} d={pathD} stroke="none" fill="none" />

                {/* Gray base track */}
                <path
                  d={pathD}
                  stroke="rgba(255,255,255,0.13)"
                  strokeLinecap="round"
                  style={{ strokeWidth: '1.5px' }}
                />

                {/* Orange progress line */}
                {pathLen > 0 && (
                  <motion.path
                    d={pathD}
                    stroke="#F77019"
                    strokeLinecap="round"
                    strokeDasharray={pathLen}
                    style={{ strokeWidth: '1.5px', strokeDashoffset: orangeOffset }}
                  />
                )}
              </svg>

              {/* Step labels — anchored inside each hollow, clear of the line */}
              {steps.map((step, i) => {
                const isRight   = i % 2 === 0
                const isActive  = activeStep === i
                const fromBelow = lastStepRef.current <= i && !isActive

                // Anchor to the INSIDE of each hollow:
                // sweep=1 (i%2===0) bulges RIGHT → inside is to the right of hx
                // sweep=0 (i%2===1) bulges LEFT  → inside is to the left of hx
                const hx = hollowCenterX(i)
                const insideCenterX = isRight
                  ? hx + rxMain * 0.50   // exact centre of right-bulging hollow's interior
                  : hx - rxMain * 0.50   // exact centre of left-bulging hollow's interior

                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top:       `${bellyYPct(i)}%`,
                      left:      `${insideCenterX.toFixed(2)}%`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <motion.div
                      className="flex"
                      animate={{
                        opacity: isActive ? 1 : 0,
                        y:       isActive ? 0 : fromBelow ? 20 : -20,
                      }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        flexDirection: isRight ? 'row' : 'row-reverse',
                        alignItems: 'flex-start',
                        gap: 'clamp(10px, 1.2vw, 18px)',
                        maxWidth: `${(rxMain * 1.5).toFixed(0)}%`,
                      }}
                    >
                      {/* Text block — left-aligned when the hollow opens right, right-aligned when it opens left */}
                      <div style={{ textAlign: isRight ? 'left' : 'right' }}>
                        <h3
                          className="text-white font-semibold leading-snug break-keep"
                          style={{ fontSize: 'clamp(18px, 2.1vw, 29px)', marginBottom: '0.5em' }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-white/45 font-light leading-relaxed break-keep"
                          style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', marginBottom: '0.6em' }}
                        >
                          {step.desc}
                        </p>
                        <span
                          className="text-[#F77019]/70 font-semibold tracking-widest"
                          style={{ fontSize: 'clamp(9px, 0.8vw, 11px)' }}
                        >
                          {step.tag}
                        </span>
                      </div>

                      {/* Large thin step number */}
                      <span
                        className="text-white/90 leading-none tabular-nums select-none shrink-0"
                        style={{ fontSize: 'clamp(48px, 5.5vw, 76px)', fontWeight: 700, letterSpacing: '-0.04em' }}
                      >
                        {step.n}
                      </span>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Section heading — pinned to top-left of sticky viewport */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[1100px] px-4 z-10 pointer-events-none">
            <span className="text-[11px] font-black tracking-[0.18em] text-[#F77019] block mb-2">
              How it works
            </span>
            <h2
              className="font-black leading-[1.2] tracking-tight text-white"
              style={{ fontSize: 'clamp(18px, 2.2vw, 30px)' }}
            >
              4단계로 완성되는
              <br />
              고객 검증 사이클
            </h2>
          </div>

        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden py-20 px-6">
        <div className="mb-14">
          <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-4">
            How it works
          </span>
          <h2
            className="font-black leading-[1.25] tracking-tight text-white mb-5"
            style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}
          >
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
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex gap-5"
            >
              <div className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center shrink-0 text-white/60 text-sm tabular-nums">
                {step.n}
              </div>
              <div>
                <h3 className="text-white font-bold text-[17px] mb-2">{step.title}</h3>
                <p className="text-white/50 text-[13px] leading-relaxed mb-3 break-keep">{step.desc}</p>
                <span className="text-[11px] text-[#F77019]/80 font-medium tracking-wide">{step.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  )
}
