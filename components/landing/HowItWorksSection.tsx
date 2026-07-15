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

const CX        = 50    // container centre
const HOLLOW_H  = 44     // vertical span of one hollow
const RY        = HOLLOW_H / 2                          // 22
const H_LEN     = 36     // horizontal shelf between hollows — long enough that hollows reach the container edges
const D         = H_LEN / 2   // each hollow sits this far left/right of centre, alternating
const PAD_T     = 100    // entry straight, above the first hollow
const PAD_B     = 100    // exit straight, below the last hollow
const CORNER    = 7      // small fixed corner that blends the entry/exit vertical tangent into the first/last hollow's horizontal tangent

const SVG_H = PAD_T + steps.length * HOLLOW_H + PAD_B

// Hollows alternate between 50-D (left) and 50+D (right), each bulging further
// OUTWARD (away from centre) — this is the only bulge direction for which the
// connecting shelf's natural exit tangent actually points toward the next
// hollow, so it falls out of the tangent geometry, not a free style choice.
// Left/right hollows' outer edges land close to the container edges (≈ header
// width). A hollow's start/end tangent is already horizontal, so it glides
// straight into the shelf with no extra corner — only entry/exit need CORNER.
const START_X = CX - D  // hollow 0's centre

function buildPath(rx: number): string {
  // Hollow 0 sits left-of-centre (START_X) and must bulge further LEFT
  // (sweep=0) so its own exit tangent naturally points right, toward hollow
  // 1's centre — hence the entry corner approaches from the right (+CORNER).
  const parts: string[] = [
    `M ${START_X + CORNER} 0`,
    `L ${START_X + CORNER} ${PAD_T - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${START_X} ${PAD_T}`,
  ]
  let x = START_X
  let y = PAD_T
  for (let i = 0; i < steps.length; i++) {
    const sweep = i % 2 === 0 ? 0 : 1        // bulge direction of this hollow (outward from centre)
    parts.push(`A ${rx} ${RY} 0 0 ${sweep} ${x} ${y + HOLLOW_H}`)
    y += HOLLOW_H
    const exitSign = sweep === 1 ? -1 : 1     // direction the hollow's exit tangent already points
    x += exitSign * H_LEN
    parts.push(`L ${x} ${y}`)                 // horizontal shelf, no corner needed
  }
  // For an even step count this naturally lands back at x = START_X
  parts.push(
    `A ${CORNER} ${CORNER} 0 0 0 ${x - CORNER} ${SVG_H - PAD_B + CORNER}`,
    `L ${x - CORNER} ${SVG_H}`,
  )
  return parts.join(' ')
}

// Local x-centre (SVG units = %) of hollow i — used to anchor its label
function hollowCenterX(i: number): number {
  let x = START_X
  for (let k = 0; k < i; k++) {
    const sweep = k % 2 === 0 ? 0 : 1
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
  // regardless of viewport aspect ratio — then clamp so D + rx ≈ 48, meaning
  // each hollow's outer apex lands right at the container edge (full header
  // width, logo-start to button-end) without clipping.
  const rxMain = useMemo(() => {
    if (!vh || !cw) return 24
    const ryPx = RY * (MOVING_VH / 100) * vh / SVG_H
    const pxPerUnitX = cw / SVG_W
    const circularRx = ryPx / pxPerUnitX
    return Math.min(48 - D, Math.max(16, circularRx))
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

              {/* Step labels — anchored in each hollow's OPEN mouth (concave side), clear of the line */}
              {steps.map((step, i) => {
                const sweep     = i % 2 === 0 ? 1 : 0
                const bulgeSign  = sweep === 1 ? 1 : -1   // the curve's solid material bulges this way from hx
                const isActive   = activeStep === i
                const fromBelow  = lastStepRef.current <= i && !isActive

                // hx<50 → hollow sits on the LEFT and bulges further left (outward);
                // hx>50 → hollow sits on the RIGHT and bulges further right (outward).
                // The number anchors at the safe boundary on the hollow's own side
                // (matching which side the hollow is on), and the text block trails
                // inward from it — both stay clear of the curve, which bulges the
                // opposite way (outward), away from this whole label.
                const hx = hollowCenterX(i)
                const isLeftHollow = hx < CX
                const boundary = hx - bulgeSign * rxMain * 0.55  // safe edge, just past the curve, on the inward side

                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${bellyYPct(i)}%`,
                      ...(isLeftHollow
                        ? { left: `${boundary.toFixed(2)}%` }
                        : { right: `${(100 - boundary).toFixed(2)}%` }),
                      transform: 'translateY(-50%)',
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
                        flexDirection: isLeftHollow ? 'row' : 'row-reverse',
                        alignItems: 'flex-start',
                        gap: 'clamp(8px, 1vw, 14px)',
                        maxWidth: 'min(30vw, 320px)',
                      }}
                    >
                      {/* Large thin step number — sits on the hollow's own side */}
                      <span
                        className="text-white/90 leading-none tabular-nums select-none shrink-0"
                        style={{ fontSize: 'clamp(36px, 4.2vw, 58px)', fontWeight: 700, letterSpacing: '-0.04em' }}
                      >
                        {step.n}
                      </span>

                      {/* Text block — trails inward from the number, aligned to match */}
                      <div style={{ textAlign: isLeftHollow ? 'left' : 'right' }}>
                        <h3
                          className="text-white font-semibold leading-snug break-keep"
                          style={{ fontSize: 'clamp(15px, 1.7vw, 23px)', marginBottom: '0.45em' }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-white/45 font-light leading-relaxed break-keep"
                          style={{ fontSize: 'clamp(11px, 1vw, 14px)', marginBottom: '0.5em' }}
                        >
                          {step.desc}
                        </p>
                        <span
                          className="text-[#F77019]/70 font-semibold tracking-widest"
                          style={{ fontSize: 'clamp(8px, 0.7vw, 10px)' }}
                        >
                          {step.tag}
                        </span>
                      </div>
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
