'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

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

// ─── SVG snake constants ────────────────────────────────────────────────────
// R=120 keeps the height:width ratio ~2:1, so the snake fills the column nicely
const VW  = 500
const CX  = VW / 2   // 250
const R   = 120      // semicircle radius → XR=370, XL=130
const PAD = 40
const VH  = PAD + steps.length * 2 * R + PAD   // 40 + 960 + 40 = 1040

const XR = CX + R   // 370
const XL = CX - R   // 130

// No straight segments between arcs — pure S-curve
function buildPath(): string {
  const parts: string[] = [`M ${CX} 0`, `L ${CX} ${PAD}`]
  for (let i = 0; i < steps.length; i++) {
    const sweep = i % 2 === 0 ? 1 : 0
    const yEnd  = PAD + (i + 1) * 2 * R
    parts.push(`A ${R} ${R} 0 0 ${sweep} ${CX} ${yEnd}`)
  }
  parts.push(`L ${CX} ${VH}`)
  return parts.join(' ')
}

const PATH_D = buildPath()

// Belly % positions (SVG-space → container %)
const BELLY = steps.map((_, i) => ({
  isRight: i % 2 === 0,
  xPct: ((i % 2 === 0 ? XR : XL) / VW) * 100,
  yPct: ((PAD + i * 2 * R + R) / VH) * 100,
}))

// Scroll fractions when orange tip reaches each belly
const ARC_LEN  = Math.PI * R
const TOT_LEN  = 2 * PAD + steps.length * ARC_LEN
const THRESHOLDS = steps.map((_, i) => (PAD + (i + 0.5) * ARC_LEN) / TOT_LEN)

// ─── Main ──────────────────────────────────────────────────────────────────
export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef      = useRef<SVGPathElement>(null)
  const [pathLen, setPathLen]   = useState(0)
  const [progress, setProgress] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', setProgress)

  const orangeOffset = useTransform(
    scrollYProgress,
    [0, 1],
    pathLen > 0 ? [pathLen, 0] : [0, 0],
  )

  const activeStep = steps.reduce<number>((acc, _, i) => (progress >= THRESHOLDS[i] ? i : acc), -1)

  return (
    <section id="howworks-section" className="snap-section-auto bg-black relative">

      {/* ── Desktop: scroll-driven ── */}
      <div
        ref={containerRef}
        className="hidden md:block relative"
        style={{ height: `${steps.length * 100}vh` }}
      >
        {/*
          Height chain:
          sticky (h-screen)
          → max-w wrapper (h-full = 100vh, py-16 → content area = 100vh - 128px)
          → right column (h-full = same)
          → snake container (h-full → has explicit px height reference)
        */}
        <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center px-8 lg:px-14">
          <div className="w-full max-w-[1100px] h-full flex items-center gap-12 lg:gap-16 py-16">

            {/* LEFT — large step content */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-10">
                <span className="text-[11px] font-black tracking-[0.18em] text-[#F77019] block mb-2">
                  How it works
                </span>
                <h2
                  className="font-black leading-[1.2] tracking-tight text-white"
                  style={{ fontSize: 'clamp(22px, 2.6vw, 36px)' }}
                >
                  4단계로 완성되는
                  <br />
                  고객 검증 사이클
                </h2>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                >
                  {activeStep >= 0 ? (
                    <div>
                      <p className="text-[#F77019] text-xs font-bold tracking-[0.2em] mb-5">
                        STEP {steps[activeStep].n}
                      </p>
                      <h3
                        className="text-white font-black leading-tight tracking-tight break-keep mb-5"
                        style={{ fontSize: 'clamp(32px, 4vw, 58px)' }}
                      >
                        {steps[activeStep].title}
                      </h3>
                      <p
                        className="text-white/55 font-light leading-relaxed break-keep max-w-[440px]"
                        style={{ fontSize: 'clamp(15px, 1.3vw, 18px)' }}
                      >
                        {steps[activeStep].desc}
                      </p>
                      <span className="inline-block mt-6 text-[11px] text-[#F77019]/70 font-semibold tracking-[0.15em]">
                        {steps[activeStep].tag}
                      </span>
                    </div>
                  ) : (
                    <p className="text-white/25 text-base font-light">
                      스크롤을 내려주세요 ↓
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* RIGHT — snake animation
                h-full inherits the 100vh - 128px from the py-16 wrapper above */}
            <div className="shrink-0 h-full flex items-center" style={{ width: '42%' }}>
              {/* aspectRatio constrains the width from the explicit h-full height */}
              <div
                className="relative h-full mx-auto"
                style={{ aspectRatio: `${VW} / ${VH}`, maxWidth: '100%' }}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox={`0 0 ${VW} ${VH}`}
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path ref={pathRef} d={PATH_D} stroke="none" fill="none" />
                  <path d={PATH_D} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} strokeLinecap="round" />
                  {pathLen > 0 && (
                    <motion.path
                      d={PATH_D}
                      stroke="#F77019"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeDasharray={pathLen}
                      style={{ strokeDashoffset: orangeOffset }}
                    />
                  )}
                </svg>

                {/* Step indicators anchored to each belly */}
                {BELLY.map(({ xPct, yPct, isRight }, i) => (
                  <motion.div
                    key={i}
                    className="absolute flex items-center pointer-events-none"
                    style={{
                      left:          `${xPct}%`,
                      top:           `${yPct}%`,
                      transform:     `translate(${isRight ? '-100%' : '0%'}, -50%)`,
                      flexDirection: isRight ? 'row-reverse' : 'row',
                      gap:           '5px',
                      paddingRight:  isRight ? '4px' : 0,
                      paddingLeft:   isRight ? 0 : '4px',
                    }}
                    animate={{ opacity: i <= activeStep ? 1 : 0.18 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span
                      className="text-white leading-none tabular-nums shrink-0 select-none"
                      style={{ fontSize: 'clamp(20px, 2.5vw, 36px)', fontWeight: 100, letterSpacing: '-0.04em' }}
                    >
                      {steps[i].n}
                    </span>
                    <span
                      className="text-white/55 font-medium break-keep"
                      style={{ fontSize: 'clamp(7px, 0.7vw, 10px)', maxWidth: '70px', lineHeight: 1.3 }}
                    >
                      {steps[i].title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile: fade-in list ── */}
      <div className="md:hidden py-20 px-6">
        <div className="mb-14">
          <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-4">
            How it works
          </span>
          <h2 className="font-black leading-[1.25] tracking-tight text-white mb-5" style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}>
            4단계로 완성되는<br />고객 검증 사이클
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
