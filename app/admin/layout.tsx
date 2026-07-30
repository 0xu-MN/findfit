'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

// 관리자 페이지 전체에 다크 사이드바를 공유시키는 레이아웃 — 로그인
// 페이지는 아직 인증 전이라 사이드바(로그아웃 등 관리자 전용 액션)를
// 보여주면 안 되므로 거기만 예외로 그대로 통과시킨다.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  if (isLogin) return <>{children}</>

  return (
    <div className="min-h-screen bg-[#0F1115] flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
