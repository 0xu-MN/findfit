'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import {
  MessageSquare,
  UserX,
  Lock,
  UserCheck,
  Clock,
  Target,
  Users,
  ShieldCheck,
  Sparkles,
  BarChart3,
} from 'lucide-react'

const diyItems = [
  {
    icon: MessageSquare,
    title: '관심 있어서 자원한 사람 검증',
    num: '1',
  },
  {
    icon: UserX,
    title: '이미 아는 지인·팔로워에게만 노출',
    num: '2',
  },
  {
    icon: Lock,
    title: '법적 보호 없이 공유',
    num: '3',
  },
  {
    icon: UserCheck,
    title: '창업자가 직접 질문, 답변 유도',
    num: '4',
  },
  {
    icon: Clock,
    title: '세션마다 질문·깊이 제각각',
    num: '5',
  },
]

const findfitItems = [
  {
    icon: Target,
    title: '실제 프로필 기반 검증',
    num: '1',
  },
  {
    icon: Users,
    title: '낯선 타겟에게 노출',
    num: '2',
  },
  {
    icon: ShieldCheck,
    title: '기밀유지 서약 기반 진행',
    num: '3',
  },
  {
    icon: Sparkles,
    title: 'AI 중립 질문 설계',
    num: '4',
  },
  {
    icon: BarChart3,
    title: '10명 동일 기준 데이터',
    num: '5',
  },
]

interface ComparisonSectionProps {
  progress?: MotionValue<number>
}

export default function ComparisonSection({ progress }: ComparisonSectionProps) {
  const localRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress: localScroll } = useScroll({
    target: localRef,
    offset: ['start start', 'end end'],
  })

  const activeProgress = progress || localScroll

  // Phase 1 (0 -> 0.5): Grid is crisp & readable.
  // Phase 2 (0.5 -> 0.85): Grid blurs out, quote overlay fades in prominently.
  // Phase 3 (0.85 -> 1.0): Quote stays emphasized before scrolling to next section.
  const blurValue = useTransform(activeProgress, [0.5, 0.75], ['blur(0px)', 'blur(22px)'])
  const contentOpacity = useTransform(activeProgress, [0.5, 0.75], [1, 0.2])
  const contentScale = useTransform(activeProgress, [0.5, 0.75], [1, 0.95])

  const overlayOpacity = useTransform(activeProgress, [0.55, 0.75, 0.92, 1], [0, 1, 1, 0.8])
  const overlayScale = useTransform(activeProgress, [0.55, 0.75], [0.92, 1])

  return (
    <div ref={localRef} className="relative w-full h-full">
      <div className="relative h-screen w-full bg-[#08080A] overflow-hidden flex flex-col justify-center items-center">
        
        {/* Lightbulb central visual background (Image 2) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/why-findfit-bulb.png"
            alt=""
            className="h-[88%] max-h-[820px] w-auto object-contain opacity-90"
          />
        </div>

        {/* Main Comparison Grid Content */}
        <motion.div
          className="relative z-10 w-full max-w-[1240px] px-6 py-6 flex flex-col justify-center h-full"
          style={{
            filter: blurValue,
            opacity: contentOpacity,
            scale: contentScale,
          }}
        >
          {/* Section Header Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4.5 py-1.5 rounded-full border border-[#F77019]/60 bg-[#161618] shadow-[0_0_16px_rgba(247,112,25,0.35)] mb-2">
              <span className="text-[#F77019] text-xs font-extrabold tracking-widest uppercase">
                Why FindFit?
              </span>
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
            
            {/* Left Column — FIND FIT 없이 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-[#141416]/90 backdrop-blur-md mb-4 shadow-md">
                <span className="text-white/70 text-xs font-semibold tracking-wider">
                  FIND FIT 없이
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-8">
                느리고, 편향되고, 불확실한 검증
              </h3>

              {/* List Cards */}
              <div className="w-full space-y-3.5">
                {diyItems.map((item, idx) => {
                  const IconComp = item.icon
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#121214]/85 border border-white/10 backdrop-blur-md shadow-lg"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4 text-white/70" />
                        </div>
                        <span className="text-[14px] md:text-[15px] font-medium text-white/80">
                          {item.title}
                        </span>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-white/10 text-white/50 text-xs font-bold flex items-center justify-center shrink-0">
                        {item.num}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column — FIND FIT과 함께 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#F77019]/60 bg-[#1A110B] backdrop-blur-md shadow-[0_0_15px_rgba(247,112,25,0.25)] mb-4">
                <span className="text-[#F77019] text-xs font-bold tracking-wider">
                  FIND FIT과 함께
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-8">
                빠르고, 객관적이고, 신뢰할 수 있는 검증
              </h3>

              {/* List Cards */}
              <div className="w-full space-y-3.5">
                {findfitItems.map((item, idx) => {
                  const IconComp = item.icon
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#1A110B]/90 border border-[#F77019]/35 backdrop-blur-md shadow-[0_4px_20px_rgba(247,112,25,0.12)]"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[#F77019]/20 border border-[#F77019]/40 flex items-center justify-center text-[#F77019] shrink-0">
                          <IconComp className="w-4 h-4 text-[#F77019]" />
                        </div>
                        <span className="text-[14px] md:text-[15px] font-semibold text-white">
                          {item.title}
                        </span>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-[#F77019] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(247,112,25,0.6)]">
                        {item.num}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Phase 2: Emphasis Quote Overlay */}
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            scale: overlayScale,
          }}
        >
          <div className="w-full max-w-[820px] text-center p-10 md:p-16 rounded-3xl bg-black/80 border border-[#F77019]/40 backdrop-blur-2xl shadow-[0_0_70px_rgba(247,112,25,0.3)]">
            <span className="text-[#F77019] text-xs font-extrabold uppercase tracking-[0.3em] mb-5 block">
              Why FindFit
            </span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              &ldquo;FindFit 이전과 이후.<br />
              <span className="mt-2 block bg-gradient-to-r from-[#F77019] via-[#FFA066] to-[#F77019] bg-clip-text text-transparent">
                당신이 듣게 되는 목소리가 달라집니다
              </span>&rdquo;
            </h2>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
