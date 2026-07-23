'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { RefreshCw, Settings, LogOut, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from '../shared/NotificationBell'

const DISMISS_KEY = 'findfit_reviewer_confirm_dismissed'

interface Props {
  children: React.ReactNode
}

// 리뷰어 전용 단일화면 레이아웃 — DashboardLayout(크리에이터와 공유하는
// 좌측네비+우측 라운지/피드 듀얼 패널)과 달리 헤더 하나 + 단일 스크롤
// 콘텐츠만 있다. 헤더의 로고/역할스위처/알림/설정/로그아웃은 DashboardLayout
// 헤더와 동일한 구성요소를 그대로 재사용한다.
export default function ReviewerLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [dontAskAgain, setDontAskAgain] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem(DISMISS_KEY) !== 'true') {
      setShowConfirm(true)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('nickname').eq('id', user.id).single().then(({ data }) => {
        setNickname(data?.nickname ?? null)
      })
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleConfirmClose = () => {
    setShowConfirm(false)
    if (dontAskAgain) localStorage.setItem(DISMISS_KEY, 'true')
  }

  if (!mounted) return null

  const accentColor = '#1565C0'

  return (
    <div className="min-h-screen bg-[#F8F8F8] relative text-[#1D1C1C]">
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] rounded-full opacity-[0.12] blur-[130px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)` }} />

      <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-10 relative">
        {/* ── HEADER — DashboardLayout 우측 패널 헤더와 같은 스타일
            (텍스트 탭 + "|" 구분선 + 활성탭 밑줄, 우측은 아이콘 클러스터).
            리뷰어는 좌측 패널이 따로 없어 로고/역할스위처/프로필은 그대로
            유지한다. ── */}
        <header className="h-20 flex items-center justify-between">
          <div className="flex items-center gap-0 flex-1 min-w-0">
            <div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0 mr-[35px]"
              onClick={() => router.push('/evaluator/dashboard')}
            >
              <img src="/logo.png" alt="FindFit" className="h-[36px] w-auto object-contain" />
            </div>

            <nav className="flex items-center overflow-x-auto">
              {[
                { label: '홈', path: '/evaluator/dashboard' },
                { label: '라운지', path: '/evaluator/lounge' },
                { label: '피드', path: '/evaluator/feed' },
                { label: '포인트 지갑', path: '/evaluator/wallet' },
                { label: '프로필', path: '/evaluator/profile' },
              ].map((item, index, arr) => {
                const isActive = pathname === item.path
                return (
                  <div key={item.path} className="flex items-center">
                    <button
                      onClick={() => router.push(item.path)}
                      className={`py-1.5 whitespace-nowrap transition-all relative ${
                        isActive ? 'text-[14px] font-black text-[#1565C0]' : 'text-[12px] font-bold text-[#999999] hover:text-[#1D1C1C]'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-[#1565C0]" />
                      )}
                    </button>
                    {index < arr.length - 1 && (
                      <span className="text-[#D4D4D4] mx-[20px] text-[12px] font-light">|</span>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* 역할 스위처 — DashboardLayout과 동일한 C/R 버튼 */}
            <div className="p-0.5 rounded-full bg-[#1D1C1C]/5 flex items-center border border-[#1D1C1C]/5">
              <button
                onClick={() => router.push('/builder/dashboard')}
                className="px-2 py-0.5 rounded-full text-[9px] font-bold transition-all text-[#999]"
              >
                C
              </button>
              <button className="px-2 py-0.5 rounded-full text-[9px] font-bold transition-all bg-white text-[#1565C0] shadow-sm">
                R
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                style={{ background: accentColor }}
              >
                R
              </div>
              <span className="text-[11px] font-bold text-[#666]">{nickname ?? '...'}</span>
            </div>

            <NotificationBell />

            <button
              onClick={() => router.push('/evaluator/account')}
              title="계정 설정"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#999] hover:bg-[#1D1C1C]/5 hover:text-[#1D1C1C] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleLogout}
              title="로그아웃"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#999] hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* ── CONTENT — 단일 스크롤 ── */}
        <main className="pb-16">{children}</main>
      </div>

      {/* ── Role Confirmation Overlay — "다시 보지 않기" 옵션 추가 ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-8 animate-fade-in"
          style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          <div className="w-full max-w-[460px] rounded-[28px] border bg-white p-9 flex flex-col items-center text-center shadow-[0_24px_64px_rgba(0,0,0,0.08)]"
            style={{ borderColor: `${accentColor}20` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white"
              style={{ background: 'linear-gradient(135deg,#1565C0,#42A5F5)', boxShadow: `0 8px 20px ${accentColor}30` }}>
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#1D1C1C] mb-2.5 tracking-tight">리뷰어로 시작하시겠습니까?</h3>
            <p className="text-[11px] text-[#666] leading-relaxed mb-6 max-w-[340px]">
              출시 전 신제품을 먼저 경험하고 피드백을 기록하여 리워드를 쌓아보세요.
            </p>
            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={handleConfirmClose}
                className="w-full py-3 rounded-full text-sm font-extrabold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#1565C0,#1e5bb0)', boxShadow: `0 4px 14px ${accentColor}30` }}
              >
                네, 리뷰어로 계속하기
              </button>
              <button
                onClick={() => router.push('/builder/dashboard')}
                className="w-full py-3 rounded-full text-[11px] font-extrabold border border-[#1D1C1C]/10 text-[#666] hover:bg-[#1D1C1C]/5 hover:text-[#1D1C1C] flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                아니요, 크리에이터로 시작하기
              </button>
              <label className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#999] mt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontAskAgain}
                  onChange={(e) => setDontAskAgain(e.target.checked)}
                  className="w-3 h-3"
                />
                다시 보지 않기
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
