'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'

const trustItems = [
  { value: '72시간', label: '내 리포트 수령' },
  { value: '1.5만원~', label: '부터 시작 가능' },
  { value: '전문가', label: '리뷰어 매칭' },
]

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#F8F8F8]" style={{ height: '100vh', minHeight: '700px' }}>
      <div className="max-w-[1440px] mx-auto h-full flex items-center px-16">

        {/* Left — text */}
        <div className="flex flex-col justify-center w-full max-w-[680px] z-10">
          <span className="self-start text-sm font-semibold px-4 py-1.5 rounded-full mb-6 text-[#F77019] bg-[#F77019]/10 border border-[#F77019]/25">
            아이디어 검증 플랫폼
          </span>

          <h1 className="font-bold leading-tight tracking-tight text-[#1D1C1C]" style={{ fontSize: 'clamp(36px, 3.6vw, 64px)' }}>
            혼자 고민하지 말고<br />
            <span className="text-[#F77019]">물어보세요!</span>
          </h1>

          <p className="mt-4 font-semibold text-[#1D1C1C]/75" style={{ fontSize: 'clamp(22px, 2.2vw, 36px)' }}>
            출시 전에 먼저 물어보세요
          </p>

          <p className="mt-5 leading-relaxed text-[#666] max-w-[480px]" style={{ fontSize: 'clamp(15px, 1.05vw, 18px)' }}>
            아이디어부터 출시까지 — 실제 사람들의 반응을 미리 알기
          </p>

          <div className="flex items-center gap-4 mt-10">
            <a href="/builder/dashboard" className="flex items-center gap-2 font-semibold rounded-full bg-[#F77019] text-white px-7 py-3.5 text-[15px] shadow-[0_4px_24px_rgba(247,112,25,0.35)] hover:scale-[1.03] transition-transform">
              내 아이디어 검증받기
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/evaluator/dashboard" className="font-semibold rounded-full border-[1.5px] border-[#1D1C1C] text-[#1D1C1C] px-7 py-3.5 text-[15px] hover:bg-[#F77019] hover:border-[#F77019] hover:text-white transition-all">
              평가단 참여하기
            </a>
          </div>

          <div className="flex items-center gap-6 mt-10">
            {trustItems.map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="font-bold text-[#F77019] text-lg">{value}</span>
                <span className="text-xs text-[#999] mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-[#999]/70">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5" />
      </div>
    </section>
  )
}
