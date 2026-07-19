'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const routeByRole = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    const role = data?.role
    if (role === 'builder') router.push('/builder/dashboard')
    else if (role === 'evaluator') router.push('/evaluator/dashboard')
    else router.push('/auth/role-select')
  }

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !data?.user) {
      setError(signInError?.message ?? '이메일 또는 비밀번호를 확인해주세요.')
      setLoading(false)
      return
    }
    await routeByRole(data.user.id)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-black text-[#1D1C1C] text-center">로그인</h1>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-[#F77019] text-white text-[13px] font-black hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <button
            onClick={() => router.push('/auth/signup')}
            className="text-[11px] font-bold text-[#999] hover:text-[#1D1C1C] transition-colors"
          >
            계정이 없으신가요? 회원가입
          </button>
        </div>
      </div>
    </div>
  )
}
