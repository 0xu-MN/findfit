'use client'

const steps = [
  {
    n: '01',
    title: '아이디어 올리기',
    desc: '5분 안에 제품을 간단히 소개하면 끝. 방법론을 몰라도 6단계 위자드가 안내해드려요.',
  },
  {
    n: '02',
    title: '전문 리뷰어 자동 매칭',
    desc: '관심 분야가 맞는 리뷰어들에게 알림이 자동으로 전달돼요. 직접 모집하지 않아도 돼요.',
  },
  {
    n: '03',
    title: 'AI 리포트 수령',
    desc: '72시간 안에 계속/피봇/중단 판단 근거가 담긴 리포트를 받아볼 수 있어요.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="howworks-section" className="snap-section bg-[#F8F8F8]">
      <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center">
        <div className="w-full flex items-center gap-24">

          {/* ── Left: heading ── */}
          <div className="flex-1 flex flex-col gap-6">
            <span
              className="inline-block w-fit text-[10px] font-bold tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(247,112,25,0.10)', color: '#F77019' }}
            >
              How it works
            </span>
            <h2
              className="font-black leading-[1.0] tracking-tight text-[#1D1C1C]"
              style={{ fontSize: 'clamp(44px, 4.5vw, 72px)' }}
            >
              딱 3단계로<br />끝납니다
            </h2>
            <p className="text-[#999] text-sm leading-relaxed max-w-[280px]">
              복잡한 리서치 없이도 전문가급 검증을 72시간 안에 완료해요.
            </p>
          </div>

          {/* ── Right: steps column ── */}
          <div className="flex-[1.1] flex flex-col" style={{ borderTop: '1px solid rgba(29,28,28,0.10)' }}>
            {steps.map((step) => (
              <div
                key={step.n}
                className="group flex items-start gap-7 py-8 relative cursor-default"
                style={{ borderBottom: '1px solid rgba(29,28,28,0.10)' }}
              >
                {/* Hover accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: '#F77019' }}
                />

                {/* Step number */}
                <span
                  className="text-[13px] font-black tabular-nums flex-shrink-0 mt-0.5 transition-colors duration-200"
                  style={{ color: 'rgba(29,28,28,0.20)', letterSpacing: '0.04em' }}
                >
                  {step.n}
                </span>

                {/* Content */}
                <div className="flex-1">
                  <h3
                    className="font-bold text-[#1D1C1C] mb-2 leading-tight group-hover:text-[#F77019] transition-colors duration-200"
                    style={{ fontSize: 'clamp(16px, 1.4vw, 20px)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[#999] text-sm leading-relaxed">{step.desc}</p>
                </div>

                {/* Arrow indicator */}
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                  style={{ color: '#F77019' }}
                  fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
