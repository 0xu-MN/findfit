'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<AvailabilityState>('idle')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<AvailabilityState>('idle')
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checkAvailability = async (field: 'email' | 'nickname', value: string) => {
    const setStatus = field === 'email' ? setEmailStatus : setNicknameStatus
    if (!value.trim()) { setStatus('idle'); return }
    setStatus('checking')
    try {
      const res = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: value.trim() }),
      })
      const json = await res.json()
      setStatus(json.available ? 'available' : 'taken')
    } catch {
      setStatus('idle')
    }
  }

  const passwordsMatch = password.length > 0 && password === passwordConfirm
  const canSubmit =
    email && password.length >= 6 && passwordsMatch && nickname.trim().length >= 2 &&
    emailStatus !== 'taken' && nicknameStatus !== 'taken' && !loading

  const handleSignup = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    // 제출 직전 최종 재확인 — 확인 버튼을 안 누르고 바로 제출하는 경우 대비
    const [emailCheck, nicknameCheck] = await Promise.all([
      fetch('/api/auth/check-availability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'email', value: email }),
      }).then((r) => r.json()),
      fetch('/api/auth/check-availability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'nickname', value: nickname.trim() }),
      }).then((r) => r.json()),
    ])
    if (!emailCheck.available) { setError('이미 사용 중인 이메일입니다.'); setEmailStatus('taken'); setLoading(false); return }
    if (!nicknameCheck.available) { setError('이미 사용 중인 닉네임입니다.'); setNicknameStatus('taken'); setLoading(false); return }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    if (!data.user) {
      setError('가입 확인 메일을 보냈습니다. 메일함을 확인해주세요.')
      setLoading(false)
      return
    }

    // handle_new_user 트리거가 만든 users row에 닉네임/실명/전화번호 채우기
    await supabase
      .from('users')
      .update({
        nickname: nickname.trim(),
        real_name: realName.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', data.user.id)

    if (data.session) {
      router.push('/auth/role-select')
    } else {
      setError('가입 확인 메일을 보냈습니다. 메일함을 확인해주세요.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-black text-[#1D1C1C] text-center">회원가입</h1>

          {/* 이메일 + 중복 확인 */}
          <Field label="이메일 (아이디)">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailStatus('idle') }}
                placeholder="you@example.com"
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
              />
              <CheckButton status={emailStatus} onClick={() => checkAvailability('email', email)} disabled={!email} />
            </div>
            <AvailabilityHint status={emailStatus} takenLabel="이미 가입된 이메일이에요" availableLabel="사용 가능한 이메일이에요" />
          </Field>

          {/* 닉네임 + 중복 확인 */}
          <Field label="닉네임">
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setNicknameStatus('idle') }}
                placeholder="2자 이상"
                className="flex-1 px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
              />
              <CheckButton status={nicknameStatus} onClick={() => checkAvailability('nickname', nickname)} disabled={nickname.trim().length < 2} />
            </div>
            <AvailabilityHint status={nicknameStatus} takenLabel="이미 사용 중인 닉네임이에요" availableLabel="사용 가능한 닉네임이에요" />
          </Field>

          {/* 실명 */}
          <Field label="실명">
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="정산·본인확인용 (선택)"
              className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
          </Field>

          {/* 전화번호 — 입력만, 실제 OTP 인증은 아직 미연동 */}
          <Field label="전화번호" hint="본인인증 연동 전이라 우선 입력만 받아요">
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000 (선택)"
                className="flex-1 px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
              />
              <button
                type="button"
                disabled
                title="본인인증 서비스 연동 준비 중"
                className="px-4 py-3 rounded-xl bg-[#F5F5F5] text-[#BBB] text-[11px] font-black whitespace-nowrap cursor-not-allowed"
              >
                인증 (준비중)
              </button>
            </div>
          </Field>

          {/* 비밀번호 + 확인 */}
          <Field label="비밀번호">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
          </Field>

          <Field label="비밀번호 확인">
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              placeholder="비밀번호를 한 번 더 입력해주세요"
              className={`w-full px-4 py-3 rounded-xl border text-[13px] font-bold text-[#1D1C1C] outline-none transition-colors ${
                passwordConfirm.length === 0
                  ? 'border-[#1D1C1C]/12 focus:border-[#F77019]'
                  : passwordsMatch
                    ? 'border-green-400'
                    : 'border-red-400'
              }`}
            />
            {passwordConfirm.length > 0 && !passwordsMatch && (
              <span className="text-[10px] font-bold text-red-500">비밀번호가 일치하지 않아요</span>
            )}
          </Field>

          {error && (
            <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl bg-[#F77019] text-white text-[13px] font-black hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <button
            onClick={() => router.push('/auth/login')}
            className="text-[11px] font-bold text-[#999] hover:text-[#1D1C1C] transition-colors"
          >
            이미 계정이 있으신가요? 로그인
          </button>

          <SocialLoginButtons />
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[9px] font-bold text-[#BBB] normal-case">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function CheckButton({ status, onClick, disabled }: { status: AvailabilityState; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === 'checking'}
      className="px-4 py-3 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black whitespace-nowrap hover:opacity-90 disabled:opacity-40 transition-colors flex items-center justify-center"
    >
      {status === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '중복확인'}
    </button>
  )
}

function AvailabilityHint({ status, takenLabel, availableLabel }: { status: AvailabilityState; takenLabel: string; availableLabel: string }) {
  if (status === 'available') {
    return <span className="flex items-center gap-1 text-[10px] font-bold text-green-600"><Check className="w-3 h-3" />{availableLabel}</span>
  }
  if (status === 'taken') {
    return <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><X className="w-3 h-3" />{takenLabel}</span>
  }
  return null
}
