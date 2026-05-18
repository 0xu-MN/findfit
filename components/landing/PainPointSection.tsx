'use client'

import { useEffect, useRef } from 'react'
import { ArrowDown } from 'lucide-react'

const painPoints = [
  { text: '지인한테 보여줬더니 다들 "좋은데요~"라고만 했어요', emoji: '😟', align: 'right', delay: 'delay-1' },
  { text: '3개월 만들었는데 출시하고 나서 아무도 안썼어요', emoji: '😟', align: 'left', delay: 'delay-2' },
  { text: '방향이 맞는지 틀린지 확신이 없어요', emoji: '😟', align: 'right', delay: 'delay-3' },
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
    <section ref={sectionRef} className="w-full bg-[#F8F8F8]" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-[900px] mx-auto px-6">

        <div className="fade-up-init text-center mb-14">
          <h2 className="text-5xl font-bold tracking-tight text-[#1D1C1C]">
            혹시 이런 경험, 있으신가요?
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          {painPoints.map((item, idx) => (
            <div key={idx} className={`fade-up-init ${item.delay} flex items-center gap-4 ${item.align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-[#F77019]/8">
                {item.emoji}
              </div>
              <div
                className="px-6 py-4 text-[#1D1C1C] leading-relaxed"
                style={{
                  background: '#F8F8F8',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  maxWidth: '560px',
                  fontSize: 'clamp(14px, 1vw, 16px)',
                  borderRadius: item.align === 'right' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                }}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div className="fade-up-init delay-4 flex justify-center mt-10 text-[#F77019]">
          <ArrowDown className="w-7 h-7" strokeWidth={2.2} />
        </div>

        <div className="fade-up-init delay-4 text-center mt-8">
          <p className="text-3xl font-semibold leading-relaxed text-[#000000]">
            지인의 평가는 <strong className="text-[#F77019]">편향</strong>되어 있습니다.
          </p>
          <p className="text-3xl font-semibold mt-3 leading-relaxed text-[#000000]">
            <strong className="text-[#F77019]">FindFit</strong>은 당신의 아이디어를 새로운 사람들에게 물어봅니다
          </p>
        </div>

      </div>
    </section>
  )
}
