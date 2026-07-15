'use client'

import { useEffect, useRef } from 'react'

const painPoints = [
  {
    emoji: '😔',
    title: '팀원이 다 좋다고 해서\n출시했는데...',
    body: (
      <>
        주변 반응이 좋아서 자신 있게 만들었는데, 막상 <strong className="text-white font-semibold">실제 고객들은 쓰지 않았어요.</strong> 가까운 사람들의 피드백은 객관적이기 어렵습니다.
      </>
    ),
  },
  {
    emoji: '😨',
    title: '아이디어를 보여주고 싶은데\n베낄까 봐 무서워요',
    body: (
      <>
        피드백이 필요한데 <strong className="text-white font-semibold">아이디어가 유출될까</strong> 봐 아무에게도 말 못 하고 있어요. NDA 없이 공유하는 건 너무 위험하니까요.
      </>
    ),
  },
  {
    emoji: '🌀',
    title: '피드백을 받긴 했는데,\n어디서부터 손봐야 할지...',
    body: (
      <>
        의견은 모았는데 <strong className="text-white font-semibold">방향이 제각각이라</strong> 오히려 더 혼란스러워요. 어떤 피드백에 무게를 둬야 할지 모르겠어요.
      </>
    ),
  },
]

export default function PainPointSection() {
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
    <section ref={sectionRef} className="w-full bg-[#0D0D0F]" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-[1100px] mx-auto px-6">

        <div className="fade-up-init mb-12">
          <span className="inline-block text-[13px] font-bold text-[#F77019] mb-4">
            이런 상황, 겪어본 적 있나요?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5">
            출시 전에 알 수 있었다면...
          </h2>
          <p className="text-white/45 text-base md:text-lg leading-relaxed max-w-[560px]">
            좋은 아이디어가 시장에서 외면받는 이유는 대부분 검증 없이 만들었기 때문입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {painPoints.map((item, idx) => (
            <div
              key={idx}
              className={`fade-up-init delay-${idx + 1} flex flex-col`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '28px 26px',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl mb-6"
                style={{ background: 'rgba(247,112,25,0.12)' }}
              >
                {item.emoji}
              </div>
              <h3 className="text-white font-bold text-[19px] leading-snug mb-3 whitespace-pre-line">
                {item.title}
              </h3>
              <p className="text-white/45 text-[14px] leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
