'use client'

import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

interface Props {
  id?: string
  dark?: boolean
  title?: string
  items: FAQItem[]
}

export default function FAQSection({ id = 'faq-section', dark = false, title = '자주 묻는 질문', items }: Props) {
  const [open, setOpen] = useState<number | null>(0)

  const bg = dark ? '#0D0D10' : '#F5F5F5'
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'
  const activeBorder = dark ? '#42A5F5' : '#3B82F6'
  const titleColor = dark ? '#FFFFFF' : '#1D1C1C'
  const qColor = dark ? '#FFFFFF' : '#111827'
  const aColor = dark ? 'rgba(255,255,255,0.5)' : '#6B7280'

  return (
    <section id={id} className="snap-section" style={{ background: bg }}>
      <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center justify-center">
        <div className="w-full max-w-[720px]">
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ color: titleColor }}
          >
            {title} <span style={{ color: aColor }}>(FAQ)</span>
          </h2>

          <div className="flex flex-col gap-3">
            {items.map((item, i) => {
              const isOpen = open === i
              return (
                <button
                  key={i}
                  className="w-full text-left rounded-2xl px-7 py-6 transition-all duration-200"
                  style={{
                    background: cardBg,
                    border: `2px solid ${isOpen ? activeBorder : cardBorder}`,
                    boxShadow: isOpen
                      ? dark
                        ? '0 0 0 4px rgba(66,165,245,0.08)'
                        : '0 0 0 4px rgba(59,130,246,0.06)'
                      : 'none',
                  }}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <p className="font-bold text-base mb-0" style={{ color: qColor }}>
                    Q. {item.q}
                  </p>
                  {isOpen && (
                    <p
                      className="text-sm leading-relaxed mt-3"
                      style={{ color: aColor }}
                    >
                      {item.a}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
