'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLoginPage() {
  const router = useRouter()
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
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* 로고 */}
        <div className="text-center">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
          <span className="text-[10px] font-black text-[#999] ml-2 bg-[#F5F5F5] px-2 py-0.5 rounded">
            운영 패널
          </span>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-black text-[#1D1C1C] text-center">운영자 로그인</h1>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="관리자 비밀번호"
              autoFocus
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
      </div>
    </div>
  )
}
