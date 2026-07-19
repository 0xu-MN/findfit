'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password) return
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    // handle_new_user 트리거가 users row를 자동 생성 — 세션이 바로 있으면 역할 선택으로
    if (data.session) {
      router.push('/auth/role-select')
    } else {
      setError('가입 확인 메일을 보냈습니다. 메일함을 확인해주세요.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-black text-[#1D1C1C] text-center">회원가입</h1>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              placeholder="6자 이상"
              className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-[#F77019] text-white text-[13px] font-black hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <button
            onClick={() => router.push('/auth/login')}
            className="text-[11px] font-bold text-[#999] hover:text-[#1D1C1C] transition-colors"
          >
            이미 계정이 있으신가요? 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
