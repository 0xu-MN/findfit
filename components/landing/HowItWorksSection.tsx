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
const H_LEN     = 48     // horizontal shelf between hollows — lengthened further
const D         = H_LEN / 2   // each hollow sits this far left/right of centre, alternating
const PAD_T     = 26     // entry straight, above the first hollow (shortened again)
const PAD_B     = 26     // exit straight, below the last hollow (shortened again)
const CORNER    = 7      // small fixed corner that blends a vertical tangent into a horizontal one (and back)

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
  // Entry: straight down the true centre (CX=50%), then a corner bends the
  // tangent from vertical to horizontal-left, followed by a short shelf that
  // glides straight into hollow 0's own centre (START_X) — so the entry line
  // itself stays exactly centred on screen even though the hollows don't.
  const parts: string[] = [
    `M ${CX} 0`,
    `L ${CX} ${PAD_T - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${CX - CORNER} ${PAD_T}`,
    `L ${START_X} ${PAD_T}`,
  ]
  let x = START_X
  let y = PAD_T
  for (let i = 0; i < steps.length; i++) {
    const sweep = i % 2 === 0 ? 0 : 1        // bulge direction of this hollow (outward from centre)
    parts.push(`A ${rx} ${RY} 0 0 ${sweep} ${x} ${y + HOLLOW_H}`)
    y += HOLLOW_H
    const exitSign = sweep === 1 ? -1 : 1     // direction the hollow's exit tangent already points

    if (i < steps.length - 1) {
      x += exitSign * H_LEN
      parts.push(`L ${x} ${y}`)               // full shelf to the next hollow's centre
    } else {
      // Exit: only shelf HALFWAY back toward centre (this tangent points
      // toward CX for the last hollow), then a mirrored corner + straight
      // drop lands exactly on CX — keeping the exit line centred too.
      x += exitSign * (D - CORNER)
      parts.push(
        `L ${x} ${y}`,
        `A ${CORNER} ${CORNER} 0 0 0 ${CX} ${y + CORNER}`,
        `L ${CX} ${SVG_H}`,
      )
    }
  }
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

// Edge-align the path to the section itself: at scroll=0 the very top of the
// path (SVG y=0, the entry line's tip) sits exactly at the sticky viewport's
// top edge; at scroll=1 the very bottom (the exit line's tip) sits exactly at
// its bottom edge. No blank background before/after the line is ever shown.
const SNAKE_START = 0
const SNAKE_END   = (100 - MOVING_VH) / 100

const CONTAINER_VH = MOVING_VH

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
  const [maxRevealed, setMaxRevealed] = useState(-1)  // once a step has appeared it stays visible

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
    if (!vh || !cw) return 20
    const ryPx = RY * (MOVING_VH / 100) * vh / SVG_H
    const pxPerUnitX = cw / SVG_W
    const circularRx = ryPx / pxPerUnitX
    return Math.min(48 - D, Math.max(12, circularRx))
  }, [vh, cw])

  const pathD = useMemo(() => buildPath(rxMain), [rxMain])

  // The orange line is drawn by LENGTH fraction (= scroll progress p, linearly),
  // not by scroll position — so "line reaches the hollow's middle" has to be
  // measured the same way: find, for each hollow, the length-fraction at which
  // the path actually visits that hollow's apex point (the visual centre of
  // the loop), by sampling the real rendered path.
  const [stepLenFrac, setStepLenFrac] = useState<number[]>(() => steps.map(() => 0))

  useEffect(() => {
    if (!pathRef.current) return
    const len = pathRef.current.getTotalLength()
    setPathLen(len)
    if (len === 0) return
    const path = pathRef.current
    const SAMPLES = 800
    const pts: { len: number; x: number; y: number }[] = []
    for (let k = 0; k <= SAMPLES; k++) {
      const l = (k / SAMPLES) * len
      const p = path.getPointAtLength(l)
      pts.push({ len: l, x: p.x, y: p.y })
    }
    const fracs = steps.map((_, i) => {
      const sweep = i % 2 === 0 ? 0 : 1
      const bulgeSign = sweep === 1 ? 1 : -1
      const targetX = hollowCenterX(i) + bulgeSign * rxMain
      const targetY = PAD_T + i * HOLLOW_H + RY
      let best = pts[0]
      let bestDist = Infinity
      for (const pt of pts) {
        const d = (pt.x - targetX) ** 2 + (pt.y - targetY) ** 2
        if (d < bestDist) { bestDist = d; best = pt }
      }
      return best.len / len
    })
    setStepLenFrac(fracs)
  }, [pathD, rxMain])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // A step is active while the orange line's drawn tip is at its hollow's
  // apex; between steps every label fades out.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    let s = -1
    for (let i = 0; i < stepLenFrac.length; i++) {
      if (Math.abs(p - stepLenFrac[i]) < ACTIVE_WINDOW) s = i
    }
    if (s >= 0) setMaxRevealed((prev) => Math.max(prev, s))
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
                const sweep      = i % 2 === 0 ? 1 : 0
                const bulgeSign  = sweep === 1 ? 1 : -1   // the curve's solid material bulges this way from hx
                const isRevealed = i <= maxRevealed        // stays visible once shown, doesn't disappear on the next step
                const fromBelow  = activeStep < i && !isRevealed

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
                      className="flex flex-col"
                      animate={{
                        opacity: isRevealed ? 1 : 0,
                        y:       isRevealed ? 0 : fromBelow ? 20 : -20,
                      }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        alignItems: isLeftHollow ? 'flex-start' : 'flex-end',
                        maxWidth: 'min(40vw, 460px)',
                      }}
                    >
                      {/* Step number — tall/condensed, cropped at the BOTTOM so its lower
                          half sits behind the title (title overlaps it, drawn on top) */}
                      <div
                        style={{
                          height: 'clamp(58px, 6.84vw, 104px)',  // ~90% of the number's font-size — only the last ~1/10 is cropped
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: isLeftHollow ? 'flex-start' : 'flex-end',
                        }}
                      >
                        <span
                          className="text-white/90 tabular-nums select-none"
                          style={{
                            fontSize: 'clamp(64px, 7.6vw, 116px)',
                            fontWeight: 800,
                            lineHeight: 1,
                            letterSpacing: '-0.03em',
                            transform: 'scaleX(0.78)',
                            transformOrigin: isLeftHollow ? 'left top' : 'right top',
                          }}
                        >
                          {step.n}
                        </span>
                      </div>

                      {/* Text block — pulled up to overlap just the number's cropped tip */}
                      <div style={{ textAlign: isLeftHollow ? 'left' : 'right', marginTop: '-0.15em', position: 'relative' }}>
                        <h3
                          className="text-[#F77019] font-semibold leading-snug break-keep"
                          style={{ fontSize: 'clamp(22px, 2.6vw, 36px)', marginBottom: '0.4em' }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-white/45 font-light leading-relaxed break-keep"
                          style={{ fontSize: 'clamp(14px, 1.35vw, 19px)', marginBottom: '0.55em' }}
                        >
                          {step.desc}
                        </p>
                        <span
                          className="text-[#F77019]/70 font-semibold tracking-widest"
                          style={{ fontSize: 'clamp(10px, 0.85vw, 12px)' }}
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
