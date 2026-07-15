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
const SVG_W = 100
const SVG_H = 500   // taller than before → each connecting loop covers more scroll distance

const CX    = 50    // centre line
const PAD_T = 60    // straight entry segment (incl. corner)
const PAD_B = 60    // straight exit segment (incl. corner)
const ARC_H = (SVG_H - PAD_T - PAD_B) / steps.length  // 95
const RY    = ARC_H / 2                                // 47.5 — each turn is a full "⊂" bulge, arcs connect directly

// Corner radius is small and FIXED (independent of the main turn radius) so
// the entry/exit straight lines stay visually centred at x=50% no matter how
// wide the main loops get — only this tiny arc absorbs the vertical→horizontal
// tangent change needed to blend into the big turn without a hard corner.
const CORNER = 8

function buildPath(rx: number): string {
  const parts: string[] = [
    `M ${CX - CORNER} 0`,
    `L ${CX - CORNER} ${PAD_T - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 0 ${CX} ${PAD_T}`,
  ]
  for (let i = 0; i < steps.length; i++) {
    const sweep = i % 2 === 0 ? 1 : 0
    parts.push(`A ${rx} ${RY} 0 0 ${sweep} ${CX} ${PAD_T + (i + 1) * ARC_H}`)
  }
  parts.push(
    `A ${CORNER} ${CORNER} 0 0 1 ${CX + CORNER} ${SVG_H - PAD_B + CORNER}`,
    `L ${CX + CORNER} ${SVG_H}`,
  )
  return parts.join(' ')
}

// ─── Scroll geometry ──────────────────────────────────────────────────────────
const MOVING_VH = 478  // scaled with SVG_H to keep the same vh-per-unit pacing
const VH_COEFF  = MOVING_VH / SVG_H

// belly[i] position inside the moving div, in vh
function bellyDivVh(i: number) {
  return (PAD_T + (i + 0.5) * ARC_H) * VH_COEFF  // ≈ 95 / 172 / 248 / 325 vh
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

// Label anchor (% of moving div height)
function bellyYPct(i: number) {
  return (PAD_T + (i + 0.5) * ARC_H) / SVG_H * 100
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

  // preserveAspectRatio="none" scales x and y independently, which flattens
  // the arcs into wide ellipses. Compensate: pick rx so the on-screen x-radius
  // equals the on-screen y-radius → the hollows read as circular C-curves.
  const rxMain = useMemo(() => {
    if (!vh || !cw) return 40
    const ryPx = RY * (MOVING_VH / 100) * vh / SVG_H
    const pxPerUnitX = cw / SVG_W
    return Math.min(44, Math.max(28, ryPx / pxPerUnitX))
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

                // The block edge on the arc side stops at 88% of the radius,
                // guaranteeing a gap between text and the snake line. The open
                // side (towards the centre chord) is free space, so the block
                // can grow inward without ever touching the curve.
                const edgePct = `${(50 - rxMain * 0.88).toFixed(2)}%`

                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top:       `${bellyYPct(i)}%`,
                      transform: 'translateY(-50%)',
                      ...(isRight ? { right: edgePct } : { left: edgePct }),
                      pointerEvents: 'none',
                    }}
                  >
                    <motion.div
                      className="flex items-center"
                      animate={{
                        opacity: isActive ? 1 : 0,
                        y:       isActive ? 0 : fromBelow ? 20 : -20,
                      }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        flexDirection: isRight ? 'row' : 'row-reverse',
                        gap: 'clamp(14px, 2vw, 26px)',
                        maxWidth: 'min(34vw, 460px)',
                      }}
                    >
                      {/* Text block */}
                      <div style={{ textAlign: isRight ? 'left' : 'right', maxWidth: 'clamp(180px, 20vw, 270px)' }}>
                        <h3
                          className="text-white font-semibold leading-snug break-keep"
                          style={{ fontSize: 'clamp(18px, 2.1vw, 29px)', marginBottom: '0.5em' }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-white/45 font-light leading-relaxed break-keep"
                          style={{ fontSize: 'clamp(13px, 1.25vw, 17px)', marginBottom: '0.7em' }}
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
                        style={{ fontSize: 'clamp(76px, 9vw, 124px)', fontWeight: 100, letterSpacing: '-0.04em' }}
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
