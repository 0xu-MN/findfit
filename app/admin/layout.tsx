'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import './admin-theme.css'

const THEME_KEY = 'findfit_admin_theme'

// 관리자 페이지 전체에 다크 사이드바를 공유시키는 레이아웃 — 로그인
// 페이지는 아직 인증 전이라 사이드바(로그아웃 등 관리자 전용 액션)를
// 보여주면 안 되므로 거기만 예외로 그대로 통과시킨다.
//
// 라이트/다크 토글 — 다크만 있으면 눈 아프다는 피드백으로 추가. 모든
// /admin/* 페이지가 admin-theme.css의 시맨틱 클래스(admin-page/admin-card/
// admin-text 등)를 쓰도록 이미 바꿔놔서, 여기서 data-admin-theme만
// 바꾸면 전체가 같이 전환된다.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
  }

  if (isLogin) return <>{children}</>

  return (
    <div className="min-h-screen admin-page flex" data-admin-theme={theme}>
      <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
