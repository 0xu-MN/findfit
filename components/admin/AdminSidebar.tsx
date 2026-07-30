'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, FileText, Wallet, CheckSquare, Newspaper, Image as ImageIcon,
  BarChart3, LogOut, LayoutDashboard, Sun, Moon,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/requests', label: '프로젝트 검수', icon: FileText },
  { href: '/admin/applications', label: '지원자 관리', icon: CheckSquare },
  { href: '/admin/distributions', label: '정산 관리', icon: Wallet },
  { href: '/admin/evaluators', label: '유저 관리', icon: Users },
  { href: '/admin/insights', label: '인사이트 관리', icon: Newspaper },
  { href: '/admin/banners', label: '배너 광고 관리', icon: ImageIcon },
  { href: '/admin/stats', label: '활동 통계', icon: BarChart3 },
]

// 관리자 페이지 전체가 공유하는 다크 테마 사이드바 — 예전엔 대시보드
// 페이지만 이 스타일로 새로 만들고 나머지 페이지는 각자 흰 배경 헤더를
// 그대로 써서 관리자 패널 안에서도 톤앤매너가 안 맞았다. 이제 모든
// /admin/* 페이지(로그인 제외)가 이 사이드바를 공유한다.
export default function AdminSidebar({
  theme,
  onToggleTheme,
}: {
  theme?: 'dark' | 'light'
  onToggleTheme?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 admin-card border-r admin-border px-4 py-6 flex flex-col gap-6 min-h-screen sticky top-0">
      <div className="flex items-center gap-2 px-2">
        <span className="text-lg font-black admin-text">FindFit</span>
        <span className="text-[9px] font-black admin-text admin-chip-strong px-2 py-0.5 rounded">운영 패널</span>
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="ml-auto w-7 h-7 rounded-lg admin-chip admin-hover-chip flex items-center justify-center admin-text-mid transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-colors ${
                active ? 'bg-[#F77019]/15 text-[#F77019]' : 'admin-text-mid admin-hover-chip admin-hover-text'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <Link
        href="/admin/login"
        className="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold admin-text-dim admin-hover-chip admin-hover-text-mid transition-colors"
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </Link>
    </aside>
  )
}
