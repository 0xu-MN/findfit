'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, EyeOff, BarChart3 } from 'lucide-react'

interface TrustCard {
  icon: React.ComponentType<{ className?: string }>
  title: string
  lines: string[]
  glowColor: string
}

const trustCards: TrustCard[] = [
  {
    icon: ShieldCheck,
    title: 'NDA 완전 보호',
    lines: [
      '모든 리뷰어는 참여 전 법적 효력의 NDA에 서명합니다.',
      '당신의 아이디어는 외부로 유출되지 않습니다.'
    ],
    glowColor: 'rgba(247, 112, 25, 0.25)' // Warm brand color glow
  },
  {
    icon: EyeOff,
    title: '완전 익명 검증',
    lines: [
      '리뷰어는 당신이 누구인지 모릅니다.',
      '순수하게 아이디어만 평가합니다.'
    ],
    glowColor: 'rgba(66, 165, 245, 0.25)' // Safe blue color glow
  },
  {
    icon: BarChart3,
    title: '응원이 아닌 데이터',
    lines: [
      '"좋아요" 대신 수치를 받으세요.',
      '실제 구매 의향과 문제 공감도를 정량적으로 측정합니다.'
    ],
    glowColor: 'rgba(74, 222, 128, 0.25)' // Success green color glow
  }
]

export default function TrustSection({ id = 'trust-section' }: { id?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id={id}
      ref={sectionRef}
      className="snap-section relative w-full flex items-center justify-center overflow-hidden transition-colors duration-1000"
      style={{
        background: 'linear-gradient(180deg, #131316 0%, #0A0A0C 100%)',
      }}
    >
      {/* Background ambient lighting/glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none filter blur-[120px] transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(247, 112, 25, 0.05) 0%, rgba(66, 165, 245, 0.03) 50%, transparent 100%)',
          opacity: isVisible ? 1 : 0,
        }}
      />

      <div className="relative w-full max-w-[1200px] mx-auto px-6 md:px-16 flex flex-col justify-center items-center z-10">
        
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <span
            className="inline-block text-[10px] font-black tracking-[0.22em] uppercase px-3.5 py-1.5 rounded-full mb-5 transition-all duration-700"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
              opacity: isVisible ? 1 : 0
            }}
          >
            SECTION 5 — TRUST
          </span>
          <h2
            className="font-black leading-tight tracking-tight text-white transition-all duration-700 delay-100"
            style={{
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
              opacity: isVisible ? 1 : 0
            }}
          >
            당신의 아이디어는 여기서 안전합니다
          </h2>
        </div>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-[1080px]">
          {trustCards.map((card, index) => {
            const Icon = card.icon
            // Delay transitions for left -> center -> right sequence
            const transitionDelay = `${index * 200}ms`

            return (
              <div
                key={index}
                className="rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-1000"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                  backdropFilter: 'blur(4px)',
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
                  opacity: isVisible ? 1 : 0,
                  transitionDelay: isVisible ? transitionDelay : '0ms'
                }}
              >
                {/* Glowing Icon Container */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-1000"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isVisible ? `0 0 25px ${card.glowColor}` : 'none',
                    color: index === 0 ? '#F77019' : index === 1 ? '#42A5F5' : '#4ADE80',
                    animationName: isVisible ? `pulseGlow-${index}` : 'none',
                    animationDuration: '3s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                    animationDelay: `${index * 500}ms`
                  }}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Card Title */}
                <h3 className="text-lg font-bold text-white mb-4">
                  {card.title}
                </h3>

                {/* Descriptions */}
                <div className="flex flex-col gap-2">
                  {card.lines.map((line, lineIdx) => (
                    <p
                      key={lineIdx}
                      className="text-sm md:text-[14px] text-[#A0A0AB] leading-relaxed break-keep"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Embedded CSS animation for pulsing glow effect on icons */}
      <style jsx global>{`
        @keyframes pulseGlow-0 {
          0% { box-shadow: 0 0 15px rgba(247, 112, 25, 0.15); border-color: rgba(255, 255, 255, 0.08); }
          100% { box-shadow: 0 0 30px rgba(247, 112, 25, 0.35); border-color: rgba(247, 112, 25, 0.4); }
        }
        @keyframes pulseGlow-1 {
          0% { box-shadow: 0 0 15px rgba(66, 165, 245, 0.15); border-color: rgba(255, 255, 255, 0.08); }
          100% { box-shadow: 0 0 30px rgba(66, 165, 245, 0.35); border-color: rgba(66, 165, 245, 0.4); }
        }
        @keyframes pulseGlow-2 {
          0% { box-shadow: 0 0 15px rgba(74, 222, 128, 0.15); border-color: rgba(255, 255, 255, 0.08); }
          100% { box-shadow: 0 0 30px rgba(74, 222, 128, 0.35); border-color: rgba(74, 222, 128, 0.4); }
        }
      `}</style>
    </section>
  )
}
