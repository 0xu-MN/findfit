'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'

// 네이버 로그인은 Supabase가 모르는 provider라 서버가 직접 OAuth를 구현하고,
// 실패하면 /auth/login?error=naver_xxx로 리다이렉트한다 — 그런데 이 페이지가
// 그 쿼리파라미터를 전혀 안 읽고 있어서, 실패해도 사용자 눈엔 그냥 로그인
// 화면이 다시 뜬 것처럼만 보이고 "로그인이 안 된다"는 인상만 남았다.
const NAVER_ERROR_MESSAGES: Record<string, string> = {
  naver_not_configured: '네이버 로그인이 아직 설정되지 않았어요. 다른 방법으로 로그인해주세요.',
  naver_state_mismatch: '로그인 요청이 만료됐어요. 다시 시도해주세요.',
  naver_token_failed: '네이버 인증에 실패했어요. 다시 시도해주세요.',
  naver_email_required: '네이버 계정에 이메일 제공 동의가 필요해요.',
  naver_create_failed: '계정 생성에 실패했어요. 잠시 후 다시 시도해주세요.',
  naver_link_failed: '로그인 처리에 실패했어요. 잠시 후 다시 시도해주세요.',
  naver_session_failed: '로그인 세션 확립에 실패했어요. 잠시 후 다시 시도해주세요.',
  account_blocked: '이용이 제한된 계정입니다. 고객센터로 문의해주세요.',
}

// useSearchParams()는 Next.js 프로덕션 빌드에서 Suspense 경계 없이 쓰면
// 빌드 자체가 실패한다(로컬 dev 서버는 이 검사를 안 해서 멀쩡해 보였다) —
// Vercel 배포가 조용히 실패하고 이전 빌드가 계속 서빙되던 원인이었다.
// 이 훅만 별도 자식 컴포넌트로 분리해 Suspense로 감싼다.
function NaverErrorBanner({ onError }: { onError: (message: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const errCode = searchParams.get('error')
    if (errCode) onError(NAVER_ERROR_MESSAGES[errCode] ?? '로그인 중 문제가 발생했어요. 다시 시도해주세요.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  return null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const routeByRole = async (userId: string): Promise<string | null> => {
    const supabase = createClient()
    const { data } = await supabase.from('users').select('role, status, nickname').eq('id', userId).single()

    // 정지/탈퇴 계정은 로그인 자체를 막는다
    if (data?.status === 'suspended') return '정지된 계정입니다. 고객센터로 문의해주세요.'
    if (data?.status === 'withdrawn') return '탈퇴 처리된 계정입니다.'

    if (!data?.nickname) { router.push('/auth/complete-profile'); return null }

    const role = data?.role
    if (role === 'builder') router.push('/builder/dashboard')
    else if (role === 'evaluator') router.push('/evaluator/dashboard')
    else router.push('/auth/role-select')
    return null
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
    const blockReason = await routeByRole(data.user.id)
    if (blockReason) {
      await supabase.auth.signOut()
      setError(blockReason)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <NaverErrorBanner onError={setError} />
      </Suspense>
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <img src="/logo.png" alt="FindFit" className="h-9 w-auto object-contain mx-auto" />
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

          <SocialLoginButtons />
        </div>
      </div>
    </div>
  )
}
