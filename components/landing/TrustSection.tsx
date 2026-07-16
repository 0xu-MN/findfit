'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'

const features = [
  {
    icon: '🔒',
    label: 'FEATURE 01',
    title: 'NDA 기반 아이디어 보호',
    desc: '리뷰어가 피드백 참여 전 법적 NDA에 동의합니다. 아이디어 공개 범위도 내가 설정해요. 누구에게 뭘 보여줄지 완전히 제어 가능합니다.',
    tag: '유일한 NDA 연동 검증 플랫폼',
    gradient: ['#F77019', '#FFB088'],
  },
  {
    icon: '🤖',
    label: 'FEATURE 02',
    title: '스타트업 특화 AI Agent',
    desc: '일반 AI 요약이 아닙니다. 제품 검증·스타트업 피드백에 최적화된 FindFit 전용 분석 엔진이 패턴을 찾아내고, 우선순위를 정리해요.',
    tag: '제품 검증 특화 분석 엔진',
    gradient: ['#3B82F6', '#A855F7'],
  },
  {
    icon: '🎯',
    label: 'FEATURE 03',
    title: '타겟 고객 직접 매칭',
    desc: '내 서비스 카테고리, 연령대, 관심사를 설정하면 FindFit이 조건에 맞는 리뷰어를 연결합니다. 아무나의 의견이 아닌, 진짜 잠재 고객의 목소리를 얻어요.',
    tag: '정밀 타겟 필터링',
    gradient: ['#22C55E', '#84CC16'],
  },
  {
    icon: '📊',
    label: 'FEATURE 04',
    title: '피칭 근거 데이터 생성',
    desc: '투자자·액셀러레이터에게 보여줄 수 있는 고객 검증 리포트를 자동 생성합니다. "고객이 좋아해요"를 데이터로 증명하세요.',
    tag: 'IR·데모데이 즉시 활용 가능',
    gradient: ['#EC4899', '#F97316'],
  },
  {
    icon: '⚡',
    label: 'FEATURE 05',
    title: '스탠다드 & 라이트 리뷰',
    desc: '깊은 정성 평가가 필요할 땐 스탠다드, 빠른 시장 반응을 원할 땐 라이트. 목적에 따라 리뷰 유형을 선택해 운영할 수 있어요.',
    tag: '목적별 유연한 리뷰 설계',
    gradient: ['#F59E0B', '#EF4444'],
  },
]

const N = features.length

// A soft glass-morphic "hero graphic" standing in for a product photo — a
// blurred rotating gradient inside a glass disc, with the feature's icon
// centered. Uses a self-blur (filter, not backdrop-filter) so it stays cheap
// even while rotating — see ReviewerLanding's perf notes on why that matters.
function GlassFeatureVisual({
  gradient, icon, size, spin = false,
}: { gradient: string[]; icon: string; size: number; spin?: boolean }) {
  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
      }}
    >
      <motion.div
        className="absolute"
        style={{
          inset: '-35%',
          background: `conic-gradient(from 0deg, ${gradient[0]}, ${gradient[1]}, ${gradient[0]})`,
          opacity: 0.6,
          filter: `blur(${Math.max(10, size * 0.09)}px)`,
        }}
        animate={spin ? { rotate: 360 } : undefined}
        transition={spin ? { duration: 14, repeat: Infinity, ease: 'linear' } : undefined}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: size * 0.34 }}>
        {icon}
      </div>
    </div>
  )
}

export default function TrustSection({ id = 'trust-section' }: { id?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setActive(Math.min(N - 1, Math.max(0, Math.floor(p * N))))
  })

  const jumpTo = (i: number) => {
    const el = containerRef.current
    if (!el) return
    const total = el.offsetHeight - window.innerHeight
    const target = el.offsetTop + (total * i) / (N - 1)
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

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

  const feature = features[active]
  const others = features.map((f, i) => ({ ...f, i })).filter((f) => f.i !== active)

  return (
    <section id={id} className="snap-section-auto bg-black relative">
      {/* ── Desktop: pinned "today's special"-style showcase — big hero
          graphic on the right, thumbnail tray (the OTHER features) bottom
          left, title/desc crossfading as scroll advances the active one ── */}
      <div ref={containerRef} className="hidden md:block relative" style={{ height: `${N * 90}vh` }}>
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden px-10 lg:px-20">
          <div className="max-w-[1280px] mx-auto w-full grid md:grid-cols-2 gap-14 items-center">

            {/* Left: eyebrow (static) + crossfading title/desc + thumbnail tray */}
            <div>
              <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-5">
                FINDFIT만의 차별점
              </span>

              <div className="relative" style={{ minHeight: 260 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="text-[11px] font-black tracking-[0.18em] text-[#F77019] mb-3 block">
                      {feature.label}
                    </span>
                    <h2
                      className="font-black leading-[1.15] tracking-tight text-white mb-4 break-keep"
                      style={{ fontSize: 'clamp(28px, 3.4vw, 46px)' }}
                    >
                      {feature.title}
                    </h2>
                    <p className="text-white/50 text-[15px] leading-relaxed mb-5 break-keep max-w-[440px]">
                      {feature.desc}
                    </p>
                    <span className="text-[12px] text-[#F77019]/80 font-medium tracking-wide">
                      {feature.tag}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnail tray — the other 4 features, click to jump */}
              <div className="flex gap-3 mt-10">
                {others.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => jumpTo(f.i)}
                    className="transition-opacity hover:opacity-100"
                    style={{ opacity: 0.55 }}
                    aria-label={f.title}
                  >
                    <GlassFeatureVisual gradient={f.gradient} icon={f.icon} size={58} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: the big hero graphic for the active feature */}
            <div className="flex justify-center md:justify-end">
              <AnimatePresence mode="wait">
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GlassFeatureVisual gradient={feature.gradient} icon={feature.icon} size={340} spin />
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          <p className="text-center text-white/40 text-[13px] mt-6 absolute bottom-8 left-1/2 -translate-x-1/2">
            🔒 모든 리뷰는 NDA 보호 하에 진행됩니다
          </p>
        </div>
      </div>

      {/* ── Mobile: horizontal scroll-snap row ── */}
      <div ref={mobileRef} className="md:hidden py-20 px-6">
        <div className="mb-10 fade-up-init">
          <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-4">
            FINDFIT만의 차별점
          </span>
          <h2 className="font-black leading-[1.3] tracking-tight text-white mb-4" style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}>
            다른 서비스와 결정적으로
            <br />
            다른 것들
          </h2>
          <p className="text-white/50 text-[15px]">옆으로 스크롤해서 확인해보세요 →</p>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2 fade-up-init delay-1">
          {features.map((f) => (
            <div
              key={f.label}
              className="shrink-0 snap-start rounded-2xl p-6 flex flex-col"
              style={{
                width: '78vw',
                maxWidth: 320,
                background: 'linear-gradient(160deg, rgba(247,112,25,0.1), rgba(255,255,255,0.03))',
                border: '1px solid rgba(247,112,25,0.25)',
              }}
            >
              <GlassFeatureVisual gradient={f.gradient} icon={f.icon} size={56} />
              <span className="text-[11px] font-black tracking-[0.18em] text-[#F77019] mb-2 mt-5">{f.label}</span>
              <h3 className="text-white font-bold text-[18px] leading-snug mb-2">{f.title}</h3>
              <p className="text-white/50 text-[13px] leading-relaxed mb-4 break-keep">{f.desc}</p>
              <span className="text-[11px] text-[#F77019]/80 font-medium tracking-wide mt-auto">{f.tag}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-white/40 text-[13px] mt-10 fade-up-init delay-2">
          🔒 모든 리뷰는 NDA 보호 하에 진행됩니다
        </p>
      </div>
    </section>
  )
}
