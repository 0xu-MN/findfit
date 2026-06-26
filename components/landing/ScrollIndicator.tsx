'use client'

import { useEffect, useState } from 'react'

const creatorSections = [
  { id: 'hero-section',      label: '홈' },
  { id: 'painpoint-section', label: '공감' },
  { id: 'features-section',  label: '기능' },
  { id: 'howworks-section',  label: '방법' },
  { id: 'trust-section',     label: '신뢰' },
  { id: 'role-section',      label: '역할' },
]

const reviewerSections = [
  { id: 'reviewer-hero',       label: '홈' },
  { id: 'reviewer-role-intro', label: '소개' },
  { id: 'reviewer-benefits',   label: '혜택' },
  { id: 'reviewer-how',        label: '방법' },
  { id: 'reviewer-faq',        label: 'FAQ' },
  { id: 'reviewer-role',       label: '역할' },
]

interface Props {
  side?: 'left' | 'right'
  mode?: 'creator' | 'reviewer'
}

export default function ScrollIndicator({ side = 'left', mode = 'creator' }: Props) {
  const sections = mode === 'reviewer' ? reviewerSections : creatorSections
  const [active, setActive] = useState(sections[0].id)

  useEffect(() => {
    // 뷰포트 중앙선을 품고 있는 섹션을 활성으로 — 스냅 스크롤에서 한 칸 밀리는 문제 방지
    const onScroll = () => {
      const mid = window.innerHeight / 2
      let current = sections[0].id
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= mid && r.bottom > mid) { current = id; break }
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const raf = requestAnimationFrame(onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const isRight = side === 'right'
  const activeColor = mode === 'reviewer' ? '#42A5F5' : '#F77019'
  const inactiveColor = mode === 'reviewer' ? 'rgba(255,255,255,0.18)' : 'rgba(29,28,28,0.18)'

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4"
      style={{ [isRight ? 'right' : 'left']: '28px' }}
    >
      {sections.map(({ id, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="flex items-center gap-2.5"
            style={{ flexDirection: isRight ? 'row-reverse' : 'row', cursor: 'pointer' }}
          >
            <div
              className="transition-all duration-300 rounded-full flex-shrink-0"
              style={{
                width: isActive ? '24px' : '6px',
                height: '3px',
                background: isActive ? activeColor : inactiveColor,
              }}
            />
            <span
              className="text-[10px] font-bold tracking-wide transition-all duration-300 overflow-hidden"
              style={{
                color: activeColor,
                opacity: isActive ? 1 : 0,
                maxWidth: isActive ? '50px' : '0px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
