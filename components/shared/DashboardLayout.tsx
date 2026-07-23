'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SharedMainPanel from './SharedMainPanel'
import SharedFeedPanel from './SharedFeedPanel'
import RightPanelFooter from './RightPanelFooter'
import { RightPanelProvider, type RightTab } from './RightPanelContext'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Wallet,
  Columns2,
  FileText,
  UserCog,
  Settings,
  LogOut,
  Search
} from 'lucide-react'

interface DashboardLayoutProps {
  role: 'creator' | 'reviewer'
  children: React.ReactNode
  rightPanel: React.ReactNode
}

const COLLAPSED_W = 100   // px – just enough for logo
// 예전엔 1300px 고정값이라 화면 폭이 좁은 모니터(1920px 미만)에서는
// 오른쪽 패널이 밀려나거나 콘텐츠가 그냥 잘려 보였다. 뷰포트 폭에 맞춰
// 줄어들되 너무 좁아지진 않게 clamp로 하한선(680px)만 두고 나머진 유동적으로.
const EXPANDED_W = 'clamp(680px, calc(100vw - 520px), 1300px)'

export default function DashboardLayout({ role, children, rightPanel }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [rightTab, setRightTab] = useState<'main' | 'lounge' | 'feed'>('main')
  const [mounted, setMounted] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const hasSeenConfirm = sessionStorage.getItem(`has_seen_confirm_${role}`)
    if (!hasSeenConfirm) {
      setShowConfirm(true)
    }
  }, [role])

  // 로그아웃 버튼이 아예 없어서 소셜 로그인 테스트 중 계정을 바꿀 방법이
  // 없던 문제 — 실제 로그인한 사용자 닉네임도 같이 보여준다("jungin0314"
  // 하드코딩 대신).
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

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('agent') === 'explore') {
        setRightTab('main')
        // 강제 확장 제거 — 사용자가 직접 핸들 클릭으로 확장
      }
    }
  }, [mounted, pathname])

  const handleConfirmClose = () => {
    setShowConfirm(false)
    sessionStorage.setItem(`has_seen_confirm_${role}`, 'true')
  }

  if (!mounted) return null

  const handleRoleSwitch = () => {
    router.push(role === 'creator' ? '/evaluator/dashboard' : '/builder/dashboard')
  }

  const accentColor = role === 'creator' ? '#F77019' : '#1565C0'

  const leftNavItems = role === 'creator'
    ? [
        { icon: LayoutDashboard, label: '대시보드', path: '/builder/dashboard' },
        { icon: FilePlus, label: '의뢰등록', path: '/builder/new-request' },
        { icon: FolderOpen, label: '프로젝트', path: '/builder/projects' },
        { icon: FileText, label: '리포트', path: '/builder/reports' },
        { icon: Wallet, label: 'fit credit', path: '/builder/wallet' },
      ]
    : [
        { icon: LayoutDashboard, label: '대시보드', path: '/evaluator/dashboard' },
        // 좌측 네비에 아예 없어서 "참여 리뷰"가 비어있을 때 뜨는 버튼으로만
        // 우연히 도달 가능했던 문제 — 정식 메뉴로 승격.
        { icon: Search, label: '의뢰 둘러보기', path: '/evaluator/available' },
        { icon: FolderOpen, label: '참여 리뷰', path: '/evaluator/reviews' },
        { icon: Wallet, label: '포인트 지갑', path: '/evaluator/wallet' },
        // H-4: 매칭 점수에 쓰이는 domain_tags를 리뷰어가 설정할 화면이 없어
        // 전원 매칭 점수가 낮게 고정돼 있던 문제.
        { icon: UserCog, label: '프로필', path: '/evaluator/profile' },
        // 계좌 등록은 어차피 정산(포인트 지갑)이랑 한 세트라 별도 메뉴로
        // 분리해뒀던 걸 "포인트 지갑" 화면 안 카드로 합쳤다 — 메뉴 제거.
      ]

  const rightTabs = [
    { key: 'main' as const, label: '메인' },
    { key: 'lounge' as const, label: '라운지' },
    { key: 'feed' as const, label: '피드' },
  ]

  return (
    <div className="h-screen bg-[#F8F8F8] relative overflow-hidden flex font-sans select-none text-[#1D1C1C]">
      {/* ── Background Glow Blobs ── */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] rounded-full opacity-[0.15] blur-[130px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}35 0%, transparent 70%)` }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full opacity-[0.12] blur-[140px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}28 0%, transparent 70%)` }} />

      {/* ── Workspace Container ── */}
      <div
        className="max-w-[1920px] w-full mx-auto pt-0 pb-0 h-full flex overflow-x-auto overflow-y-hidden relative"
        style={{ paddingLeft: 'clamp(16px, 5vw, 104px)', paddingRight: 'clamp(16px, 5vw, 104px)' }}
      >

        {/* ═══════════════════════════════════════════ */}
        {/* ── LEFT PANEL ── (logo always visible)      */}
        {/* ═══════════════════════════════════════════ */}
        <div
          className="h-full flex flex-col flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
          style={{ width: isLeftOpen ? EXPANDED_W : `${COLLAPSED_W}px` }}
        >
          {/* ── LEFT HEADER (80px, transparent) ── */}
          <header className="h-20 flex-shrink-0 flex items-center justify-between pr-4">
            {/* Logo — 로그인 상태에서는 로고를 눌러도 공개 랜딩페이지로 나가지
                않고 자기 역할 대시보드로 이동한다 */}
            <div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0"
              onClick={() => router.push(role === 'creator' ? '/builder/dashboard' : '/evaluator/dashboard')}
            >
              <img src="/logo.png" alt="FindFit" className="h-[40px] w-auto object-contain" />
            </div>

            {/* Nav Links – hidden when collapsed */}
            {isLeftOpen && (
              <div className="flex items-center gap-0 ml-[35px] flex-1 justify-between">
                <nav className="flex items-center">
                  {leftNavItems.map((item, index, arr) => {
                    const isActive = pathname === item.path
                    return (
                      <div key={item.label} className="flex items-center">
                        <button
                          onClick={() => router.push(item.path)}
                          className={`flex items-center gap-1.5 py-2 transition-colors whitespace-nowrap ${
                            isActive ? 'text-[14px] text-[#1D1C1C] font-black' : 'text-[12px] text-[#999999] font-bold hover:text-[#1D1C1C]'
                          }`}
                        >
                          <item.icon className="w-4 h-4" style={{ color: isActive ? accentColor : undefined }} />
                          {item.label}
                        </button>
                        {index < arr.length - 1 && (
                          <span className="text-[#D4D4D4] mx-[20px] text-[12px] font-light">|</span>
                        )}
                      </div>
                    )
                  })}
                </nav>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Tiny role switcher */}
                  <div className="p-0.5 rounded-full bg-[#1D1C1C]/5 flex items-center border border-[#1D1C1C]/5">
                    <button onClick={() => role !== 'creator' && router.push('/builder/dashboard')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                        role === 'creator' ? 'bg-white text-[#F77019] shadow-sm' : 'text-[#999]'
                      }`}>C</button>
                    <button onClick={() => role !== 'reviewer' && router.push('/evaluator/dashboard')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                        role === 'reviewer' ? 'bg-white text-[#1565C0] shadow-sm' : 'text-[#999]'
                      }`}>R</button>
                  </div>

                  {/* User profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                      style={{ background: accentColor }}>
                      {role === 'creator' ? 'C' : 'R'}
                    </div>
                    <span className="text-[11px] font-bold text-[#666]">{nickname ?? '...'}</span>
                  </div>

                  <button
                    onClick={() => router.push(role === 'creator' ? '/builder/account' : '/evaluator/account')}
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
              </div>
            )}
          </header>

          {/* ── LEFT CONTENT ── */}
          <div
            className="flex-1 overflow-y-auto pr-2 custom-scrollbar transition-opacity duration-300"
            style={{ opacity: isLeftOpen ? 1 : 0, pointerEvents: isLeftOpen ? 'auto' : 'none' }}
          >
            <div className="pb-8 pt-10">
              {children}
            </div>
          </div>

          {/* ── Role Confirmation Overlay ── */}
          {showConfirm && isLeftOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-8 animate-fade-in"
              style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}>
              <div className="w-full max-w-[460px] rounded-[28px] border bg-white p-9 flex flex-col items-center text-center shadow-[0_24px_64px_rgba(0,0,0,0.08)]"
                style={{ borderColor: `${accentColor}20` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white"
                  style={{
                    background: role === 'creator' ? 'linear-gradient(135deg,#F77019,#F77019)' : 'linear-gradient(135deg,#1565C0,#42A5F5)',
                    boxShadow: `0 8px 20px ${accentColor}30`,
                  }}>
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-[#1D1C1C] mb-2.5 tracking-tight">
                  {role === 'creator' ? '크리에이터로 시작하시겠습니까?' : '리뷰어로 시작하시겠습니까?'}
                </h3>
                <p className="text-[11px] text-[#666] leading-relaxed mb-6 max-w-[340px]">
                  {role === 'creator'
                    ? '새로운 제품 아이디어를 등록하여 전문 평가단으로부터 72시간 내 검증 리포트를 받아보세요.'
                    : '출시 전 신제품을 먼저 경험하고 피드백을 기록하여 리워드를 쌓아보세요.'}
                </p>
                <div className="flex flex-col w-full gap-2.5">
                  <button onClick={handleConfirmClose}
                    className="w-full py-3 rounded-full text-sm font-extrabold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: role === 'creator' ? 'linear-gradient(135deg,#F77019,#F77019)' : 'linear-gradient(135deg,#1565C0,#1e5bb0)',
                      boxShadow: `0 4px 14px ${accentColor}30`,
                    }}>
                    네, {role === 'creator' ? '크리에이터' : '리뷰어'}로 계속하기
                  </button>
                  <button onClick={handleRoleSwitch}
                    className="w-full py-3 rounded-full text-[11px] font-extrabold border border-[#1D1C1C]/10 text-[#666] hover:bg-[#1D1C1C]/5 hover:text-[#1D1C1C] flex items-center justify-center gap-1.5 transition-all">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    {role === 'creator' ? '아니요, 리뷰어로 시작하기' : '아니요, 크리에이터로 시작하기'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ── RIGHT PANEL (400px → expands)            */}
        {/* ═══════════════════════════════════════════ */}
        <div className="h-full flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden relative"
          style={{ minWidth: '400px' }}>

          {/* ── PEEK HANDLE — landing-page style (glassy vertical handle) ── */}
          <button
            onClick={() => setIsLeftOpen((prev) => !prev)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 group flex items-center justify-center cursor-pointer overflow-hidden"
            style={{
              width: isLeftOpen ? '14px' : '42px',
              height: isLeftOpen ? '64px' : '180px',
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(29,28,28,0.08)',
              borderLeft: 'none',
              borderRadius: '0 14px 14px 0',
              boxShadow: isLeftOpen ? '4px 0 16px rgba(0,0,0,0.04)' : '8px 0 32px rgba(247,112,25,0.08)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s',
            }}
            title={isLeftOpen ? '대시보드 접기' : '대시보드 열기'}
          >
            {/* Closed state: vertical "DASHBOARD" + arrow */}
            {!isLeftOpen && (
              <div className="flex flex-col items-center justify-center gap-3 px-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-[#F77019] group-hover:translate-x-0.5 transition-transform" />
                <span
                  className="text-[#1D1C1C]/70 text-[10px] font-black uppercase tracking-[0.22em] group-hover:text-[#F77019] transition-colors"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  Dashboard
                </span>
              </div>
            )}

            {/* Open state: just a thin chevron */}
            {isLeftOpen && (
              <ChevronLeft className="w-3 h-3 text-[#999] group-hover:text-[#F77019] transition-colors" />
            )}
          </button>

          {/* ── RIGHT HEADER (80px, transparent) ── */}
          <header className="h-20 flex-shrink-0 flex items-center justify-between pl-5 pr-2">
            {/* Tab navigation */}
            <nav className="flex items-center">
              {rightTabs.map((tab, index, arr) => (
                <div key={tab.key} className="flex items-center">
                  <button
                    onClick={() => setRightTab(tab.key)}
                    className={`py-1.5 transition-all relative ${
                      rightTab === tab.key
                      ? 'text-[14px] font-black text-[#F77019]'
                      : 'text-[12px] font-bold text-[#999999] hover:text-[#1D1C1C]'
                    }`}
                  >
                    {tab.label}
                    {rightTab === tab.key && (
                      <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-[#F77019]" />
                    )}
                  </button>
                  {index < arr.length - 1 && (
                    <span className="text-[#D4D4D4] mx-[20px] text-[12px] font-light">|</span>
                  )}
                </div>
              ))}
            </nav>

            {/* Right: icons */}
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#1D1C1C]/5 transition-colors text-[#666] relative">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#F77019]" />
              </button>
              <button
                onClick={() => setIsLeftOpen((prev) => !prev)}
                title={isLeftOpen ? '오른쪽 패널 확장' : '대시보드 보기'}
                aria-pressed={!isLeftOpen}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isLeftOpen
                    ? 'text-[#666] bg-transparent hover:bg-[#1D1C1C]/5'
                    : 'bg-[#F77019]/10 text-[#F77019] hover:bg-[#F77019]/15'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* ── RIGHT CONTENT ── */}
          <div
            className={`flex-1 overflow-x-hidden min-w-0 ${
              rightTab === 'main'
                ? 'overflow-hidden'
                : 'overflow-y-auto pl-5 pr-2 pb-8 custom-scrollbar'
            }`}
          >
            <RightPanelProvider
              value={{
                tab: rightTab as RightTab,
                setTab: (t: RightTab) => setRightTab(t),
                isExpanded: !isLeftOpen,
              }}
            >
              {/* 탭별 패널 라우팅: Windows 추가 메인/피드 + 우리 라운지(rightPanel) */}
              {rightTab === 'main'
                ? <SharedMainPanel />
                : rightTab === 'feed'
                  ? <SharedFeedPanel />
                  : rightPanel}
              {/* 패널 확장 + 메인 탭이 아닐 때 공통 Footer (메인은 overflow-hidden이라 스크롤 불가) */}
              {!isLeftOpen && rightTab !== 'main' && <RightPanelFooter />}
            </RightPanelProvider>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(29,28,28,0.07); border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(247,112,25,0.18); }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .animate-fade-in { animation: fadeIn .35s ease-out forwards; }
        .animate-spin-slow { animation: spin 6s linear infinite; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
