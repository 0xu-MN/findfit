'use client'

import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'

const stats = [
  { value: '8/10명', label: '"이 서비스 괜찮다"고 답했지만, 실제 지속 사용률은 7%' },
  { value: '5~10시간', label: '창업자가 혼자 응답을 정리·분석하는 데 쓰는 시간' },
  { value: '3~4명', label: '10명에게 물어봐도 진짜 피드백을 주는 인원' },
]

const solutionTags = ['NDA 자동 보호', 'AI 중립 질문', '구조화 리포트', '데이터 일관성']

const rows = [
  { label: '실제 프로필 기반 테스트', diy: true, findfit: true },
  { label: '지인이 아닌 낯선 타겟에게 검증', diy: false, findfit: true },
  { label: '피드백 유출 걱정 없는 NDA', diy: false, findfit: true },
  { label: '창의자 편향 없는 AI 질문 설계', diy: false, findfit: true },
  { label: '10명 모두 동일 기준 데이터', diy: false, findfit: true },
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
    <section ref={sectionRef} className="w-full h-full bg-[#0D0D0F] flex items-center overflow-y-auto" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="max-w-[1200px] mx-auto px-6 w-full">

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

        {/* Split panel — image2-style layout */}
        <div
          className="fade-up-init delay-1 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '28px',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left — Problem (DIY) */}
            <div className="p-8 md:p-12 md:border-r border-white/[0.08]">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-white/50 text-sm font-semibold tracking-wide">Problem</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">SNS·커뮤니티 자체 모집</h3>
              <p className="text-white/45 text-[14px] leading-relaxed mb-10 max-w-[420px]">
                &ldquo;테스트해주실 분 모집합니다&rdquo;를 올리고, 지인 위주로 피드백을 받는 방식입니다. 구조가 없어 결과를 믿기 어렵습니다.
              </p>

              <div className="flex flex-col gap-7">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-white text-3xl font-bold tracking-tight">{s.value}</span>
                    </div>
                    <div className="h-px bg-white/10 mb-2" />
                    <p className="text-white/40 text-[13px] leading-relaxed">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Solution (FindFit) */}
            <div className="p-8 md:p-12" style={{ background: 'rgba(247,112,25,0.04)' }}>
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
              <p className="text-white/60 text-[14px] leading-relaxed mb-8 max-w-[440px]">
                AI 에이전트가 중립적으로 질문을 설계하고, 낯선 타겟 10명의 구조화된 피드백을 리포트 한 장으로 정리합니다.
              </p>

              {/* Comparison rows */}
              <div className="flex flex-col gap-3 mb-8">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                    <span className="text-white/70 text-[13px]">{r.label}</span>
                    <div className="flex items-center gap-6">
                      <span className="flex items-center justify-center w-5 h-5">
                        {r.diy
                          ? <Check className="w-4 h-4 text-white/30" strokeWidth={2.5} />
                          : <X className="w-4 h-4 text-white/20" strokeWidth={2.5} />}
                      </span>
                      <span className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'rgba(247,112,25,0.15)' }}>
                        <Check className="w-3.5 h-3.5 text-[#F77019]" strokeWidth={3} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {solutionTags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-full text-white/70"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {tag}
                  </span>
                ))}
                <span
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full text-white"
                  style={{ background: '#F77019' }}
                >
                  FindFit
                </span>
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
