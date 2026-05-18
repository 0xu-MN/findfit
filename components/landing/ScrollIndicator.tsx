'use client'

import { useEffect, useState } from 'react'

const creatorSections = [
  { id: 'hero-section',      label: '홈' },
  { id: 'painpoint-section', label: '공감' },
  { id: 'features-section',  label: '기능' },
  { id: 'howworks-section',  label: '방법' },
  { id: 'faq-section',       label: 'FAQ' },
  { id: 'role-section',      label: '역할' },
]

const reviewerSections = [
  { id: 'reviewer-hero',     label: '홈' },
  { id: 'reviewer-benefits', label: '혜택' },
  { id: 'reviewer-how',      label: '방법' },
  { id: 'reviewer-earnings', label: '수익' },
  { id: 'reviewer-faq',      label: 'FAQ' },
  { id: 'reviewer-role',     label: '역할' },
]

interface Props {
  side?: 'left' | 'right'
  mode?: 'creator' | 'reviewer'
}

export default function ScrollIndicator({ side = 'left', mode = 'creator' }: Props) {
  const sections = mode === 'reviewer' ? reviewerSections : creatorSections
  const [active, setActive] = useState(sections[0].id)

  useEffect(() => {
    setActive(sections[0].id)
    const observers: IntersectionObserver[] = []

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { threshold: 0.4 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
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
