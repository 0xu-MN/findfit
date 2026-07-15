'use client'

import { useEffect, useRef } from 'react'
import { Check, BadgeCheck } from 'lucide-react'

// Same 5 capabilities on both sides — blurred/illegible on the DIY side
// (you can't actually verify them), crisp + checked on the FindFit side.
const items = [
  '실제 프로필 기반 검증',
  '낯선 타겟에게 노출',
  'NDA로 유출 방지',
  'AI 중립 질문 설계',
  '10명 동일 기준 데이터',
]

const stats = [
  { value: '7%', pct: 30, label: '"괜찮다"고 답한 8/10명 중 실제 지속 사용률' },
  { value: '5~10h', pct: 60, label: '창업자가 혼자 응답을 정리·분석하는 시간' },
  { value: '3~4명', pct: 40, label: '10명 중 진짜 피드백을 주는 인원' },
]

export default function ComparisonSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const targets = sectionRef.current?.querySelectorAll('.fade-up-init')
    if (!targets) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.15 }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="w-full h-full bg-[#0D0D0F] overflow-y-auto" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      <div className="max-w-[1180px] mx-auto px-6 w-full">

        <div className="fade-up-init text-center mb-10">
          <span className="inline-block text-[13px] font-bold text-[#F77019] mb-4">
            왜 FindFit이어야 할까요
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5">
            SNS 모집 테스트 vs FindFit
          </h2>
          <p className="text-white/45 text-base md:text-lg leading-relaxed max-w-[620px] mx-auto">
            DIY 모집 테스트는 &ldquo;이미 관심 있는 사람&rdquo;의 반응이고, FindFit은 &ldquo;진짜 시장&rdquo;의 반응입니다.
          </p>
        </div>

        <div
          className="fade-up-init delay-1 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '28px',
          }}
        >
          {/* Central divider + floating badge, connecting both sides */}
          <div
            className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px"
            style={{
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, rgba(247,112,25,0.55), rgba(247,112,25,0.12) 45%, rgba(247,112,25,0.03))',
            }}
          />
          <div
            className="hidden md:flex absolute left-1/2 top-9 items-center gap-1.5 px-4 py-2 rounded-full z-10"
            style={{
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #F77019, #C24E0E)',
              boxShadow: '0 10px 28px rgba(247,112,25,0.4)',
            }}
          >
            <BadgeCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span className="text-white text-[13px] font-semibold whitespace-nowrap">신뢰도 차이 78%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left — Problem (DIY) */}
            <div className="p-8 md:p-12 md:pr-14 pt-16 md:pt-20">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-white/50 text-sm font-semibold tracking-wide">Problem</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">SNS·커뮤니티 자체 모집</h3>
              <p className="text-white/45 text-[14px] leading-relaxed mb-7 max-w-[420px]">
                &ldquo;테스트해주실 분 모집합니다&rdquo;를 올리고, 지인 위주로 피드백을 받는 방식입니다. 구조가 없어 결과를 믿기 어렵습니다.
              </p>

              {/* Blurred / illegible pills — can't actually verify these */}
              <div className="flex flex-col gap-2.5 mb-9">
                {items.map((label, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 rounded-full text-[13px] text-white/50 select-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      filter: 'blur(3px)',
                      opacity: 0.6,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Stat rows — slider-style track like the reference */}
              <div className="flex flex-col gap-6">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-white text-[28px] font-bold tracking-tight mb-2">{s.value}</div>
                    <div className="relative h-px bg-white/15 mb-2">
                      <span
                        className="absolute top-1/2 w-2 h-2 rounded-full bg-[#0D0D0F]"
                        style={{ left: `${s.pct}%`, transform: 'translate(-50%, -50%)', border: '1.5px solid rgba(255,255,255,0.5)' }}
                      />
                    </div>
                    <p className="text-white/40 text-[12.5px] leading-relaxed">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Solution (FindFit) */}
            <div className="p-8 md:p-12 md:pl-14 pt-16 md:pt-20" style={{ background: 'rgba(247,112,25,0.04)' }}>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-[#F77019]" />
                <span className="text-[#F77019] text-sm font-semibold tracking-wide">Solution</span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(247,112,25,0.15)' }}>
                  <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
                </div>
                <h3 className="text-white text-2xl font-bold">FindFit</h3>
              </div>
              <p className="text-white/60 text-[14px] leading-relaxed mb-7 max-w-[440px]">
                AI 에이전트가 중립적으로 질문을 설계하고, 낯선 타겟 10명의 구조화된 피드백을 리포트 한 장으로 정리합니다.
              </p>

              {/* Crisp, checked pills — same 5 items, now verifiable */}
              <div className="flex flex-col gap-2.5">
                {items.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 rounded-full text-[13px] text-white"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span>{label}</span>
                    <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style={{ background: '#22C55E' }}>
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <p className="fade-up-init delay-2 text-center text-white/35 text-[13px] mt-6">
          두 방법 모두 &ldquo;실제 프로필 기반 테스트&rdquo;는 가능합니다 — 차이는 그다음부터 시작됩니다.
        </p>

      </div>
    </section>
  )
}
