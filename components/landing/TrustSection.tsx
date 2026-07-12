'use client'

import { useEffect, useRef, useState } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'

const features = [
  {
    icon: '🔒',
    label: 'FEATURE 01',
    title: ['NDA 기반', '아이디어 보호'],
    desc: '리뷰어가 피드백 참여 전 법적 NDA에 동의합니다. 아이디어 공개 범위도 내가 설정해요. 누구에게 뭘 보여줄지 완전히 제어 가능합니다.',
    tag: '유일한 NDA 연동 검증 플랫폼',
  },
  {
    icon: '🤖',
    label: 'FEATURE 02',
    title: ['스타트업 특화', 'AI Agent'],
    desc: '일반 AI 요약이 아닙니다. 제품 검증·스타트업 피드백에 최적화된 FindFit 전용 분석 엔진이 패턴을 찾아내고, 우선순위를 정리해요.',
    tag: '제품 검증 특화 분석 엔진',
  },
  {
    icon: '🎯',
    label: 'FEATURE 03',
    title: ['타겟 고객', '직접 매칭'],
    desc: '내 서비스 카테고리, 연령대, 관심사를 설정하면 FindFit이 조건에 맞는 리뷰어를 연결합니다. 아무나의 의견이 아닌, 진짜 잠재 고객의 목소리를 얻어요.',
    tag: '정밀 타겟 필터링',
  },
  {
    icon: '📊',
    label: 'FEATURE 04',
    title: ['피칭 근거', '데이터 생성'],
    desc: '투자자·액셀러레이터에게 보여줄 수 있는 고객 검증 리포트를 자동 생성합니다. "고객이 좋아해요"를 데이터로 증명하세요.',
    tag: 'IR·데모데이 즉시 활용 가능',
  },
  {
    icon: '⚡',
    label: 'FEATURE 05',
    title: ['스탠다드 &', '라이트 리뷰'],
    desc: '깊은 정성 평가가 필요할 땐 스탠다드, 빠른 시장 반응을 원할 땐 라이트. 목적에 따라 리뷰 유형을 선택해 운영할 수 있어요.',
    tag: '목적별 유연한 리뷰 설계',
  },
]

const N = features.length
const SEG = 1 / N
const CLOSED_W = 88
const GAP = 14

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function opennessFor(index: number, progress: number) {
  const a0 = index * SEG
  const a3 = (index + 1) * SEG
  const margin = SEG * 0.22
  const a1 = a0 + margin
  const a2 = a3 - margin
  const fadeIn = clamp((progress - a0) / (a1 - a0), 0, 1)
  const fadeOut = clamp((a3 - progress) / (a3 - a2), 0, 1)
  const isFirst = index === 0
  const isLast = index === N - 1
  return isFirst ? fadeOut : isLast ? fadeIn : Math.min(fadeIn, fadeOut)
}

function FeatureCard({
  feature,
  width,
  openness,
}: {
  feature: (typeof features)[number]
  width: number
  openness: number
}) {
  return (
    <div
      className="relative h-full rounded-2xl overflow-hidden shrink-0"
      style={{
        width,
        background: openness > 0.5 ? 'linear-gradient(160deg, rgba(247,112,25,0.14), rgba(255,255,255,0.03))' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${openness > 0.5 ? 'rgba(247,112,25,0.35)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'background 0.4s ease, border-color 0.4s ease',
      }}
    >
      {/* Closed state: icon + vertical label, fades out as the card opens */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        style={{ opacity: 1 - openness, pointerEvents: openness > 0.5 ? 'none' : 'auto' }}
      >
        <span className="text-2xl">{feature.icon}</span>
        <span
          className="text-[11px] font-bold tracking-[0.2em] text-white/40 whitespace-nowrap"
          style={{ writingMode: 'vertical-rl' }}
        >
          {feature.label}
        </span>
      </div>

      {/* Open state: full content, fades/slides in as the card opens */}
      <div
        className="absolute inset-0 p-7 md:p-8 flex flex-col"
        style={{
          opacity: clamp((openness - 0.4) / 0.6, 0, 1),
          transform: `translateY(${(1 - openness) * 16}px)`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 shrink-0"
          style={{ background: 'rgba(247,112,25,0.12)', border: '1px solid rgba(247,112,25,0.25)' }}
        >
          {feature.icon}
        </div>
        <span className="text-[11px] font-black tracking-[0.18em] text-[#F77019] mb-3 whitespace-nowrap">
          {feature.label}
        </span>
        <h3 className="text-white font-bold leading-snug mb-3 whitespace-nowrap" style={{ fontSize: 'clamp(17px, 1.5vw, 21px)' }}>
          {feature.title[0]}
          <br />
          {feature.title[1]}
        </h3>
        <p className="text-white/50 text-[13px] leading-relaxed mb-5 break-keep flex-1 min-h-0 overflow-hidden">
          {feature.desc}
        </p>
        <span className="text-[11px] text-[#F77019]/80 font-medium tracking-wide whitespace-nowrap">
          {feature.tag}
        </span>
      </div>
    </div>
  )
}

export default function TrustSection({ id = 'trust-section' }: { id?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const [rowWidth, setRowWidth] = useState(0)
  const [progress, setProgress] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => setProgress(v))

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0) setRowWidth(rect.width)
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

  const opennessArr = features.map((_, i) => opennessFor(i, progress))
  const totalGap = GAP * (N - 1)
  const avail = Math.max(0, rowWidth - totalGap)
  const openMax = Math.max(CLOSED_W, avail - CLOSED_W * (N - 1))
  const rawWidths = opennessArr.map((o) => CLOSED_W + (openMax - CLOSED_W) * o)
  const rawTotal = rawWidths.reduce((a, b) => a + b, 0) || 1
  const widths = rawWidths.map((w) => (rowWidth > 0 ? (w / rawTotal) * avail : w))

  return (
    <section id={id} className="snap-section-auto bg-black relative">
      {/* ── Desktop: pinned horizontal accordion carousel ── */}
      <div ref={containerRef} className="hidden md:block relative" style={{ height: `${N * 90}vh` }}>
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden px-10 lg:px-20">
          <div className="max-w-[1280px] mx-auto w-full">
            {/* Heading */}
            <div className="mb-12">
              <span className="inline-block text-[12px] font-black tracking-[0.15em] text-[#F77019] mb-4">
                FINDFIT만의 차별점
              </span>
              <h2
                className="font-black leading-[1.25] tracking-tight text-white mb-4"
                style={{ fontSize: 'clamp(28px, 3.2vw, 44px)' }}
              >
                다른 서비스와 결정적으로 다른 것들
              </h2>
              <p className="text-white/50 text-[15px] md:text-base">
                단순 설문과는 다릅니다. 옆으로 스크롤해서 확인해보세요 →
              </p>
            </div>

            {/* Accordion row */}
            <div ref={rowRef} className="flex items-stretch" style={{ gap: GAP, height: 'min(50vh, 420px)' }}>
              {features.map((feature, i) => (
                <FeatureCard key={feature.label} feature={feature} width={widths[i] || CLOSED_W} openness={opennessArr[i]} />
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center text-white/40 text-[13px] mt-10">
              🔒 모든 리뷰는 NDA 보호 하에 진행됩니다
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile: horizontal scroll-snap row, all cards open ── */}
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
          <p className="text-white/50 text-[15px]">단순 설문과는 다릅니다. 옆으로 스크롤해서 확인해보세요 →</p>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2 fade-up-init delay-1">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="shrink-0 snap-start rounded-2xl p-6 flex flex-col"
              style={{
                width: '78vw',
                maxWidth: 320,
                background: 'linear-gradient(160deg, rgba(247,112,25,0.1), rgba(255,255,255,0.03))',
                border: '1px solid rgba(247,112,25,0.25)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'rgba(247,112,25,0.12)', border: '1px solid rgba(247,112,25,0.25)' }}
              >
                {feature.icon}
              </div>
              <span className="text-[11px] font-black tracking-[0.18em] text-[#F77019] mb-2">{feature.label}</span>
              <h3 className="text-white font-bold text-[18px] leading-snug mb-2">
                {feature.title[0]}
                <br />
                {feature.title[1]}
              </h3>
              <p className="text-white/50 text-[13px] leading-relaxed mb-4 break-keep">{feature.desc}</p>
              <span className="text-[11px] text-[#F77019]/80 font-medium tracking-wide mt-auto">{feature.tag}</span>
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
