'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { routeToDashboardOrLogin } from '@/lib/auth/routeToDashboard'

const navLinks = [
  { label: '서비스', href: '#service' },
  { label: 'FAQ', href: '#faq' },
  { label: '리뷰어 모집', href: '#reviewer' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // "시작하기"가 로그인 여부와 무관하게 /builder/dashboard로 바로 꽂혀 있었음
  // — /builder/dashboard 자체엔 인증 가드가 없어서, 로그인 안 한 사람도 그냥
  // (텅 빈/깨진) 대시보드로 들어가지고 로그인 화면을 아예 못 봤다. 세션이
  // 있으면 role에 맞는 대시보드로, 없으면 로그인 화면으로 보낸다.
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault()
    routeToDashboardOrLogin(router)
  }

  return (
    <>
      {/* ── Pill (not scrolled) ── */}
      <header
        className="fixed z-50 left-1/2 transition-all duration-500 ease-in-out"
        style={{
          top: scrolled ? '-100px' : '20px',
          transform: 'translateX(-50%)',
          opacity: scrolled ? 0 : 1,
          pointerEvents: scrolled ? 'none' : 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          className="flex items-center gap-8 px-8 py-3 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <img src="/logo.png" alt="FindFit" className="h-10 w-auto object-contain" />
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href}
                className="text-sm font-medium text-[#1D1C1C] hover:text-[#F77019] transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <a href="/auth/login" onClick={handleStart} className="bg-[#F77019] hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all">
            시작하기
          </a>
        </div>
      </header>

      {/* ── Transparent sticky (scrolled) ── */}
      <header
        className="fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out"
        style={{
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: scrolled ? 'auto' : 'none',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-12 pt-0 pb-5 flex items-center justify-between">
          <img src="/logo.png" alt="FindFit" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-4 pt-4">
            <a href="#reviewer" className="text-sm font-medium text-[#1D1C1C] hover:text-[#F77019] transition-colors">
              리뷰어 모집
            </a>
            <a href="/auth/login" onClick={handleStart} className="bg-[#F77019] hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all">
              시작하기
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
