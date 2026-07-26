'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()

  // ── 방법 A: 관리자 계정(haloforge 등, is_admin=true)으로 일반 로그인 ──
  const [email, setEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)

  const handleAccountLogin = async () => {
    if (!email || !accountPassword) return
    setAccountLoading(true)
    setAccountError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: accountPassword })
      if (error) {
        setAccountError(error.message)
        return
      }
      // is_admin 여부를 바로 확인해서, 관리자 계정이 아니면 여기서 명확한
      // 에러를 보여준다(그냥 /admin으로 보냈다가 조용히 튕겨나오면 "눌러도
      // 안 열린다"처럼 보이는 문제가 있었다). 조회 자체가 실패해도(RLS 등)
      // 원인을 화면에 그대로 보여줘서 디버깅이 되게 한다.
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profileError) {
        setAccountError(`권한 확인 실패: ${profileError.message}`)
        return
      }
      if (!profile?.is_admin) {
        setAccountError('이 계정은 관리자 권한이 없어요')
        return
      }
      // 클라이언트 라우팅(router.push)이 아니라 완전한 페이지 이동을 써야
      // /admin 서버 컴포넌트가 방금 발급된 세션 쿠키를 확실히 읽는다.
      window.location.href = '/admin'
    } finally {
      setAccountLoading(false)
    }
  }

  // ── 방법 B: 기존 공유 비밀번호(ADMIN_SECRET_KEY) — 운영 스태프용, 계정 없어도
  // 접근. 위 계정 로그인과 "로그인" 버튼이 2개라 헷갈리기 쉬워서 기본적으로
  // 접어두고, 필요할 때만 펼쳐서 쓰게 한다.
  const [showLegacy, setShowLegacy] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin')
      } else {
        const data = await res.json()
        setError(data.error ?? '로그인 실패')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* 로고 */}
        <div className="text-center">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
          <span className="text-[10px] font-black text-[#999] ml-2 bg-[#F5F5F5] px-2 py-0.5 rounded">
            운영 패널
          </span>
        </div>

        {/* 방법 A: 관리자 계정으로 로그인 */}
        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-black text-[#1D1C1C] text-center">관리자 계정으로 로그인</h1>
          <p className="text-[10px] font-bold text-[#999] text-center -mt-2">
            회원가입 시 쓰신 이메일/비밀번호를 그대로 입력하세요
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">비밀번호</label>
            <input
              type="password"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccountLogin()}
              placeholder="계정 비밀번호"
              className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
          </div>

          {accountError && (
            <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">
              {accountError}
            </p>
          )}

          <button
            onClick={handleAccountLogin}
            disabled={accountLoading || !email || !accountPassword}
            className="w-full py-3 rounded-xl bg-[#F77019] text-white text-[13px] font-black hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {accountLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {/* 방법 B: 기존 공유 비밀번호 — 평소엔 접어둠 */}
        {!showLegacy ? (
          <button
            onClick={() => setShowLegacy(true)}
            className="text-[10px] font-bold text-[#999] hover:text-[#1D1C1C] transition-colors"
          >
            운영 스태프이신가요? 공유 비밀번호로 로그인
          </button>
        ) : (
          <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <h2 className="text-[13px] font-black text-[#1D1C1C] text-center">운영 스태프 비밀번호로 로그인</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">
                공유 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="관리자 공유 비밀번호"
                className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#1D1C1C] transition-colors"
              />
            </div>

            {error && (
              <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full py-3 rounded-xl bg-[#1D1C1C] text-white text-[13px] font-black hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
