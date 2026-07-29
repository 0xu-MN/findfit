'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { RefreshCw, Settings, LogOut, Sparkles, ChevronDown, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from '../shared/NotificationBell'
import RoleSwitchToggle from '../shared/RoleSwitchToggle'
import Footer from '../landing/Footer'

const DISMISS_KEY = 'findfit_creator_confirm_dismissed'
// 세션(탭) 단위로 한 번 봤으면 같은 세션 안에서는 다시 안 물어본다 — 예전엔
// CreatorLayout을 쓰는 페이지를 새로 마운트할 때마다(예: 홈에서 검색→
// 아이템탐색→마법사로 넘어가는 것처럼 같은 세션 안에서 여러 페이지를
// 옮겨다닐 때도) 매번 떴었다.
const SESSION_SEEN_KEY = 'findfit_creator_confirm_seen_session'

interface Props {
  children: React.ReactNode
}

// 크리에이터 전용 단일화면 레이아웃 — components/reviewer/ReviewerLayout.tsx와
// 동일한 뼈대(헤더 하나 + 단일 스크롤, 컨테이너 폭도 동일하게 max-w-[1700px])를
// 그대로 재사용하고, 네비게이션만 홈/라운지/피드/프로젝트로 구성한다.
// DashboardLayout.tsx(구 듀얼패널)는 삭제하지 않고 그대로 둔다.
export default function CreatorLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem(DISMISS_KEY) !== 'true' && sessionStorage.getItem(SESSION_SEEN_KEY) !== 'true') {
      setShowConfirm(true)
      sessionStorage.setItem(SESSION_SEEN_KEY, 'true')
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
    // 관리자 패널에서 "지금 어느 모드로 쓰고 있는지" 실시간으로 보여주기 위한 기록
    fetch('/api/users/set-active-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'builder' }),
    }).catch(() => {})
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

  const accentColor = '#F77019'

  return (
    <div className="min-h-screen bg-[#F8F8F8] relative text-[#1D1C1C]">
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] rounded-full opacity-[0.12] blur-[130px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)` }} />

      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-10 relative">
        {/* ── HEADER — ReviewerLayout과 동일한 스타일(텍스트 탭 + "|" 구분선 +
            활성탭 밑줄, 우측은 역할스위처/프로필드롭다운/알림) ── */}
        <header className="h-20 flex items-center justify-between">
          <div className="flex items-center gap-0 flex-1 min-w-0">
            <div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0 mr-[35px]"
              onClick={() => router.push('/builder/dashboard')}
            >
              <img src="/logo.png" alt="FindFit" className="h-[36px] w-auto object-contain" />
            </div>

            <nav className="flex items-center overflow-x-auto scrollbar-none">
              {[
                { label: '홈', path: '/builder/dashboard' },
                { label: '라운지', path: '/builder/lounge' },
                { label: '인사이트', path: '/builder/feed' },
                { label: '프로젝트', path: '/builder/projects' },
              ].map((item, index, arr) => {
                const isActive = pathname === item.path || (item.path === '/builder/projects' && pathname?.startsWith('/builder/projects'))
                return (
                  <div key={item.path} className="flex items-center">
                    <button
                      onClick={() => router.push(item.path)}
                      className={`py-1.5 whitespace-nowrap transition-all relative ${
                        isActive ? 'text-[14px] font-black text-[#F77019]' : 'text-[12px] font-bold text-[#999999] hover:text-[#1D1C1C]'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-[#F77019]" />
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
            {/* 역할 스위처 — 2번 이미지 디자인 적용(ReviewerLayout과 동일 컴포넌트) */}
            <div data-coach="role-toggle">
              <RoleSwitchToggle role="creator" />
            </div>

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((p) => !p)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[#1D1C1C]/5 transition-colors cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                  style={{ background: accentColor }}
                >
                  C
                </div>
                <span className="text-[11px] font-bold text-[#666]">{nickname ?? '...'}</span>
                <ChevronDown className="w-3 h-3 text-[#999]" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[#1D1C1C]/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-2 z-50 flex flex-col gap-1"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-[#1D1C1C]/5">
                    <p className="text-[12px] font-black text-[#1D1C1C]">{nickname ?? '크리에이터'}</p>
                    <p className="text-[10px] text-[#999] font-medium">FindFit Creator</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/builder/wallet') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-[#333] hover:bg-[#F5F5F5] rounded-xl transition-colors text-left"
                  >
                    <Wallet className="w-3.5 h-3.5 text-[#F77019]" />
                    <span>fit credit</span>
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/builder/account') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-[#333] hover:bg-[#F5F5F5] rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#666]" />
                    <span>계정 설정</span>
                  </button>
                  <div className="my-1 border-t border-[#1D1C1C]/5" />
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>

            <NotificationBell />
          </div>
        </header>

        {/* ── CONTENT — 단일 스크롤. 콘텐츠가 짧아도 푸터가 바로 안 붙게
            최소 높이를 잡는다(헤더 80px + 푸터 실측 높이 감안) ── */}
        <main className="pb-16 min-h-[calc(100vh-320px)]">{children}</main>
      </div>

      {/* ── FOOTER — 랜딩페이지/리뷰어와 동일한 스타일 재사용 ── */}
      <Footer />

      {/* ── Role Confirmation Overlay — "다시 보지 않기" 옵션 포함 ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-8 animate-fade-in"
          style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          <div className="w-full max-w-[460px] rounded-[28px] border bg-white p-9 flex flex-col items-center text-center shadow-[0_24px_64px_rgba(0,0,0,0.08)]"
            style={{ borderColor: `${accentColor}20` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white"
              style={{ background: 'linear-gradient(135deg,#F77019,#F77019)', boxShadow: `0 8px 20px ${accentColor}30` }}>
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#1D1C1C] mb-2.5 tracking-tight">크리에이터로 시작하시겠습니까?</h3>
            <p className="text-[11px] text-[#666] leading-relaxed mb-6 max-w-[340px]">
              새로운 제품 아이디어를 등록하여 전문 평가단으로부터 72시간 내 검증 리포트를 받아보세요.
            </p>
            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={handleConfirmClose}
                className="w-full py-3 rounded-full text-sm font-extrabold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#F77019,#F77019)', boxShadow: `0 4px 14px ${accentColor}30` }}
              >
                네, 크리에이터로 계속하기
              </button>
              <button
                onClick={() => router.push('/evaluator/dashboard')}
                className="w-full py-3 rounded-full text-[11px] font-extrabold border border-[#1D1C1C]/10 text-[#666] hover:bg-[#1D1C1C]/5 hover:text-[#1D1C1C] flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                아니요, 리뷰어로 시작하기
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
