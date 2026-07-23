'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken'

// 온보딩(가입 직후 필수 완료) / 계정 설정(언제든 수정) 두 군데서 같이 쓰는
// 폼 — 소셜 로그인은 이메일/비번 가입 폼(닉네임·실명·전화·생년월일 수집)을
// 아예 건너뛰기 때문에, 그 정보를 나중에라도 채우게 하려면 이 폼이 필요하다.
export default function ProfileForm({
  mode,
  onDone,
}: {
  mode: 'onboarding' | 'settings'
  onDone: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [originalNickname, setOriginalNickname] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<AvailabilityState>('idle')
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [originalPhone, setOriginalPhone] = useState('')
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(null)
  const [birthDate, setBirthDate] = useState('')

  // 휴대폰 인증 흐름 상태 — 번호를 바꾸면 다시 인증해야 하므로 phone !==
  // originalPhone이면 phoneVerifiedAt이 있어도 미인증으로 취급한다.
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('users')
        .select('nickname, real_name, phone, phone_verified_at, birth_date')
        .eq('id', user.id)
        .single()
      if (data) {
        setOriginalNickname(data.nickname ?? '')
        setNickname(data.nickname ?? '')
        setRealName(data.real_name ?? '')
        setPhone(data.phone ?? '')
        setOriginalPhone(data.phone ?? '')
        setPhoneVerifiedAt(data.phone_verified_at ?? null)
        setBirthDate(data.birth_date ?? '')
      }
      setLoading(false)
    })
  }, [])

  const isPhoneVerified = phoneVerifiedAt !== null && phone === originalPhone

  const sendCode = async () => {
    if (!phone.trim()) { setPhoneError('휴대폰 번호를 입력해주세요'); return }
    setSendingCode(true)
    setPhoneError(null)
    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const body = await res.json()
      if (!res.ok) { setPhoneError(body.error ?? '인증코드 발송에 실패했어요'); return }
      setOtpSent(true)
    } finally {
      setSendingCode(false)
    }
  }

  const confirmCode = async () => {
    if (!otpCode.trim()) { setPhoneError('인증코드를 입력해주세요'); return }
    setVerifyingCode(true)
    setPhoneError(null)
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      })
      const body = await res.json()
      if (!res.ok) { setPhoneError(body.error ?? '인증에 실패했어요'); return }
      setPhoneVerifiedAt(new Date().toISOString())
      setOriginalPhone(phone)
      setOtpSent(false)
      setOtpCode('')
    } finally {
      setVerifyingCode(false)
    }
  }

  const checkNickname = async () => {
    if (!nickname.trim() || nickname.trim() === originalNickname) { setNicknameStatus('idle'); return }
    setNicknameStatus('checking')
    try {
      const res = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'nickname', value: nickname.trim() }),
      })
      const json = await res.json()
      setNicknameStatus(json.available ? 'available' : 'taken')
    } catch {
      setNicknameStatus('idle')
    }
  }

  // 실제 법적 나이 인증(CI/PASS)이 아니라 본인이 입력한 값 기준 자진신고 게이트.
  const age = birthDate ? computeAge(birthDate) : null
  const underAge = age !== null && age < 19

  const canSubmit =
    nickname.trim().length >= 2 &&
    nicknameStatus !== 'taken' &&
    (!birthDate || !underAge) &&
    (mode !== 'onboarding' || isPhoneVerified) &&
    !saving

  const handleSave = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)

    if (nickname.trim() !== originalNickname) {
      const res = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'nickname', value: nickname.trim() }),
      })
      const json = await res.json()
      if (!json.available) {
        setNicknameStatus('taken')
        setError('이미 사용 중인 닉네임입니다.')
        setSaving(false)
        return
      }
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // update는 row가 없으면 0건 매칭으로 조용히 no-op 되어버려서(에러도 안 남),
    // public.users row가 어떤 이유로든 누락된 계정이 계속 온보딩 화면에
    // 갇히는 문제가 있었다 — upsert로 바꿔 row 부재를 방어한다.
    // phone은 여기서 같이 안 보낸다 — /api/auth/phone/verify가 phone과
    // phone_verified_at을 원자적으로 같이 세팅하는 유일한 경로여야, 인증
    // 안 된 번호가 phone 컬럼에 들어가는 불일치가 안 생긴다.
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        nickname: nickname.trim(),
        real_name: realName.trim() || null,
        birth_date: birthDate || null,
      })

    setSaving(false)
    if (updateError) { setError('저장 중 오류가 발생했습니다.'); return }
    onDone()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#999]" /></div>
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === 'onboarding' && (
        <p className="text-[12px] text-[#666] font-bold leading-relaxed">
          소셜 로그인은 닉네임 설정 과정을 안 거치기 때문에, 서비스 이용을 위해 몇 가지만 마저 입력해주세요.
        </p>
      )}

      <Field label="닉네임">
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setNicknameStatus('idle') }}
            placeholder="2자 이상"
            className="flex-1 px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
          />
          <button
            type="button"
            onClick={checkNickname}
            disabled={nickname.trim().length < 2 || nicknameStatus === 'checking'}
            className="px-4 py-3 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black whitespace-nowrap hover:opacity-90 disabled:opacity-40 flex items-center justify-center"
          >
            {nicknameStatus === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '중복확인'}
          </button>
        </div>
        {nicknameStatus === 'available' && <span className="flex items-center gap-1 text-[10px] font-bold text-green-600"><Check className="w-3 h-3" />사용 가능한 닉네임이에요</span>}
        {nicknameStatus === 'taken' && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><X className="w-3 h-3" />이미 사용 중인 닉네임이에요</span>}
      </Field>

      <Field label="실명">
        <input
          type="text"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          placeholder="정산·본인확인용 (선택)"
          className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
        />
      </Field>

      <Field label="전화번호" hint={mode === 'onboarding' ? '다중계정 방지를 위해 인증이 필요해요' : undefined}>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setOtpSent(false); setPhoneError(null) }}
            placeholder="01000000000"
            className="flex-1 px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
          />
          {isPhoneVerified ? (
            <span className="px-4 py-3 rounded-xl bg-green-50 text-green-600 text-[11px] font-black whitespace-nowrap flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />인증 완료
            </span>
          ) : (
            <button
              type="button"
              onClick={sendCode}
              disabled={sendingCode || !phone.trim()}
              className="px-4 py-3 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black whitespace-nowrap hover:opacity-90 disabled:opacity-40 flex items-center justify-center"
            >
              {sendingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : otpSent ? '재발송' : '인증코드 발송'}
            </button>
          )}
        </div>

        {phoneVerifiedAt !== null && phone !== originalPhone && (
          <span className="text-[10px] font-bold text-amber-600">번호를 변경했어요 — 다시 인증해주세요</span>
        )}

        {otpSent && !isPhoneVerified && (
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmCode()}
              placeholder="인증코드 6자리"
              className="flex-1 px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
            />
            <button
              type="button"
              onClick={confirmCode}
              disabled={verifyingCode || !otpCode.trim()}
              className="px-4 py-3 rounded-xl bg-[#F77019] text-white text-[11px] font-black whitespace-nowrap hover:opacity-90 disabled:opacity-40 flex items-center justify-center"
            >
              {verifyingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '확인'}
            </button>
          </div>
        )}

        {phoneError && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><X className="w-3 h-3" />{phoneError}</span>}
      </Field>

      <Field label="생년월일" hint="만 19세 미만은 이용이 제한돼요 (자진 입력 기준)">
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[13px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
        />
        {underAge && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><X className="w-3 h-3" />만 19세 미만은 가입/이용이 제한돼요</span>
        )}
      </Field>

      {error && <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl bg-[#F77019] text-white text-[13px] font-black hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {mode === 'onboarding' ? '완료' : '저장'}
      </button>
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
