'use client'

import { useState } from 'react'
import { Lightbulb, Users, LineChart, Plus, Minus } from 'lucide-react'

const steps = [
  {
    n: '01',
    title: '아이디어 올리기',
    desc: '5분 안에 제품을 간단히 소개하면 끝. 방법론을 몰라도 6단계 위자드가 안내해드려요.',
    icon: Lightbulb,
  },
  {
    n: '02',
    title: '전문 리뷰어 자동 매칭',
    desc: '관심 분야가 맞는 리뷰어들에게 알림이 자동으로 전달돼요. 직접 모집하지 않아도 돼요.',
    icon: Users,
  },
  {
    n: '03',
    title: 'AI 리포트 수령',
    desc: '72시간 안에 계속/피봇/중단 판단 근거가 담긴 리포트를 받아볼 수 있어요.',
    icon: LineChart,
  },
]

export default function HowItWorksSection() {
  const [openIndex, setOpenIndex] = useState<number>(0)

  return (
    <section id="howworks-section" className="bg-[#F5F5F5] snap-section overflow-hidden">
      <div className="max-w-[1280px] mx-auto h-full flex items-center">
        <div className="w-full flex flex-col md:flex-row min-h-[100vh] items-stretch">

          {/* ── Left: Brand Watermark Column ── */}
          <div className="relative hidden md:flex w-[220px] lg:w-[260px] shrink-0 py-20 pl-10 pr-6 select-none">
            {/* FINDFIT vertical watermark */}
            <div
              className="absolute bottom-[15%] left-0 right-0 flex items-end justify-center pointer-events-none"
              aria-hidden
            >
              <span
                className="text-[clamp(72px,9vw,108px)] font-black leading-none tracking-tighter text-[#1D1C1C]/[0.055] whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                FINDFIT
              </span>
            </div>
          </div>

          {/* ── Right: Content ── */}
          <div className="flex-1 flex flex-col justify-center py-16 md:py-20 px-6 md:pl-12 md:pr-16 lg:pr-24">

            {/* Heading */}
            <div className="mb-14">
              <span
                className="inline-block text-[10px] font-black tracking-[0.22em] uppercase px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(247,112,25,0.10)', color: '#F77019' }}
              >
                How it works
              </span>
              <h2
                className="font-black leading-[1.15] tracking-tight text-[#1D1C1C] mb-5"
                style={{ fontSize: 'clamp(28px, 3.5vw, 52px)' }}
              >
                딱 3단계로 끝납니다
              </h2>
              <p className="text-[#888] text-[15px] md:text-base leading-relaxed max-w-[400px]">
                복잡한 리서치 없이도 전문가급 검증을 72시간 안에 완료해요.
              </p>
            </div>

            {/* Accordion */}
            <div className="flex flex-col gap-0">
              {steps.map((step, idx) => {
                const Icon = step.icon
                const isOpen = openIndex === idx
                return (
                  <div key={step.n} className="group">
                    {/* Row button */}
                    <button
                      onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                      className="w-full flex items-center justify-between py-5 text-left focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-5">
                        {/* Step number */}
                        <span
                          className="text-[13px] font-black tabular-nums transition-colors duration-300"
                          style={{ color: isOpen ? '#F77019' : 'rgba(29,28,28,0.25)', letterSpacing: '0.04em' }}
                        >
                          {step.n}
                        </span>
                        {/* Title */}
                        <h3
                          className="font-bold transition-colors duration-300"
                          style={{
                            fontSize: 'clamp(16px, 1.5vw, 22px)',
                            color: isOpen ? '#1D1C1C' : 'rgba(29,28,28,0.55)',
                          }}
                        >
                          {step.title}
                        </h3>
                      </div>

                      {/* Toggle icon */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{
                          background: isOpen ? '#F77019' : 'rgba(29,28,28,0.06)',
                          color: isOpen ? '#fff' : '#1D1C1C',
                        }}
                      >
                        {isOpen
                          ? <Minus className="w-4 h-4" strokeWidth={2.5} />
                          : <Plus className="w-4 h-4" strokeWidth={2.5} />
                        }
                      </div>
                    </button>

                    {/* Expanded panel */}
                    <div
                      className="overflow-hidden transition-all duration-500 ease-in-out"
                      style={{ maxHeight: isOpen ? '300px' : '0px', opacity: isOpen ? 1 : 0 }}
                    >
                      <div className="pb-8 pl-[calc(13px+20px)] flex items-start gap-8">
                        {/* Icon pill */}
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(247,112,25,0.09)', color: '#F77019' }}
                        >
                          <Icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        {/* Description */}
                        <p className="text-[#555] leading-relaxed text-[15px] pt-1 max-w-none break-keep">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    {/* Separator — only between items, never after last */}
                    {idx < steps.length - 1 && (
                      <div className="h-px w-full" style={{ background: 'rgba(29,28,28,0.07)' }} />
                    )}
                  </div>
                )
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
