'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, ChevronDown, Loader2, X } from 'lucide-react'

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
  const [birthDate, setBirthDate] = useState('')
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
  const age = birthDate ? computeAge(birthDate) : null
  const underAge = age !== null && age < 19
  const canSubmit =
    email && password.length >= 6 && passwordsMatch && nickname.trim().length >= 2 &&
    birthDate && !underAge &&
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
      // check-availability는 public.users만 보는데, 이메일 확인 전
      // 중간에 끊긴 가입 등으로 auth.users에는 있지만 public.users엔 없는
      // 경우 "사용 가능"으로 잘못 통과시킬 수 있다 — 그 경우 여기서 원본
      // Supabase 영문 에러("User already registered")가 그대로 노출돼
      // 마치 회원가입 자체가 고장난 것처럼 보였다. 명확한 한글 메시지로.
      setError(
        signUpError.code === 'user_already_exists' || signUpError.message.toLowerCase().includes('already registered')
          ? '이미 가입된 이메일이에요. 로그인을 이용해주세요.'
          : signUpError.message
      )
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
        birth_date: birthDate || null,
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
          <img src="/logo.png" alt="FindFit" className="h-9 w-auto object-contain mx-auto" />
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

          {/* 생년월일 — 실제 CI/PASS 인증이 아니라 자진 입력 기준 만 19세 게이트 */}
          <Field label="생년월일" hint="만 19세 미만은 이용이 제한돼요">
            <BirthDateSelect value={birthDate} onChange={setBirthDate} />
            {underAge && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><X className="w-3 h-3" />만 19세 미만은 가입이 제한돼요</span>
            )}
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

function computeAge(birthDateStr: string): number {
  const birth = new Date(birthDateStr)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

// 브라우저 기본 <input type="date"> 대신 FindFit 톤에 맞춘 연/월/일 3분할
// 셀렉트 — 값은 기존과 동일하게 YYYY-MM-DD 문자열로 부모에 올려서
// computeAge 등 이후 검증 로직은 그대로 재사용한다.
function BirthDateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // 년/월/일을 각각 자체 상태로 들고 있는다 — 부모의 완성된 YYYY-MM-DD
  // 문자열(value)에서만 파생시키면, 셋 중 하나만 골랐을 때(아직 조합이
  // 안 끝나 부모 값이 ''로 남는 순간) 방금 고른 값도 함께 ''로 리셋돼
  // 화면에서 사라져 보이는 버그가 있었다 — 선택 상태 자체는 로컬로 유지하고,
  // 셋 다 채워졌을 때만 부모에 조합된 문자열을 올린다.
  const [year, setYear] = useState(() => (value ? value.split('-')[0] : ''))
  const [month, setMonth] = useState(() => (value ? value.split('-')[1] : ''))
  const [day, setDay] = useState(() => (value ? value.split('-')[2] : ''))

  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => String(thisYear - i))
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))

  const update = (y: string, m: string, d: string) => {
    setYear(y)
    setMonth(m)
    setDay(d)
    if (y && m && d) {
      // 월이 바뀌어 일수가 줄어드는 경우(예: 31일→2월) 마지막 날로 보정
      const maxDay = new Date(Number(y), Number(m), 0).getDate()
      const clampedDay = String(Math.min(Number(d), maxDay)).padStart(2, '0')
      setDay(clampedDay)
      onChange(`${y}-${m}-${clampedDay}`)
    } else {
      onChange('')
    }
  }

  return (
    <div className="flex gap-2">
      <DateSelect value={year} onChange={(v) => update(v, month, day)} placeholder="년" options={years} grow />
      <DateSelect value={month} onChange={(v) => update(year, v, day)} placeholder="월" options={months} />
      <DateSelect value={day} onChange={(v) => update(year, month, v)} placeholder="일" options={days} />
    </div>
  )
}

function DateSelect({
  value,
  onChange,
  placeholder,
  options,
  grow,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
  grow?: boolean
}) {
  return (
    <div className={`relative ${grow ? 'flex-[1.3]' : 'flex-1'}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-8 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors bg-white appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-[#999] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
