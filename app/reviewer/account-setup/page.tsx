'use client'

import { createClient } from '@/lib/supabase/client'
import { Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협', 'IBK기업', 'SC제일',
  '카카오뱅크', '케이뱅크', '토스뱅크', '새마을금고', '신협', '우체국',
]

export default function AccountSetupPage() {
  const router = useRouter()
  const [bankName, setBankName] = useState('')
  const [showBankList, setShowBankList] = useState(false)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const isValid = bankName && accountNumber.length >= 10 && accountHolder.length >= 2

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('로그인이 필요합니다'); setSubmitting(false); return }

    // 1. reviewer_profiles 업데이트 (PortOne 등록은 실제 키 연동 후 처리)
    const { error } = await supabase
      .from('reviewer_profiles')
      .update({
        bank_name: bankName,
        account_number: accountNumber, // TODO: pgcrypto 암호화 적용
        account_holder: accountHolder,
        is_account_verified: true,     // Mock: 실제는 PortOne 계좌 인증 후 true
        portone_partner_id: `mock-partner-${user.id}`, // Mock: 실제 PortOne 파트너 등록 후 교체
      })
      .eq('user_id', user.id)

    if (error) {
      alert('저장 중 오류가 발생했습니다')
      setSubmitting(false)
      return
    }

    // 2. pending_registration 상태의 distributions이 있으면 재시도 알림 (실제 PortOne 연동 후)
    // 현재는 Mock — 실제 PortOne API 키 연동 후 자동 지급 처리

    setDone(true)
    setTimeout(() => router.push('/evaluator/dashboard'), 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F77019] flex items-center justify-center">
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
          <p className="text-lg font-black">계좌 등록 완료!</p>
          <p className="text-[11px] text-[#999] font-bold">대기 중인 사례금이 곧 지급됩니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-black">계좌 등록</h1>
          <p className="text-[11px] text-[#999] font-bold mt-1">
            사례금을 수령할 계좌를 등록해주세요
          </p>
        </div>

        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          {/* 은행 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold">은행 선택</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBankList(!showBankList)}
                className="w-full h-10 rounded-xl bg-[#F5F5F5] border border-transparent flex items-center justify-between px-4 text-[11px] font-bold"
              >
                <span className={bankName ? 'text-[#1D1C1C]' : 'text-[#999]'}>
                  {bankName || '은행을 선택하세요'}
                </span>
                <ChevronDown className="w-4 h-4 text-[#999]" />
              </button>
              {showBankList && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl border border-[#1D1C1C]/10 bg-white shadow-lg z-20 max-h-48 overflow-y-auto">
                  {BANKS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => { setBankName(b); setShowBankList(false) }}
                      className={`w-full text-left px-4 py-2.5 text-[11px] font-bold hover:bg-[#F5F5F5] transition-colors ${
                        bankName === b ? 'text-[#F77019]' : 'text-[#1D1C1C]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 계좌번호 */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold">계좌번호</label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="숫자만 입력 (- 없이)"
              maxLength={20}
              className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px] font-bold"
            />
          </div>

          {/* 예금주 */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold">예금주</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="예금주 이름"
              maxLength={30}
              className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px] font-bold"
            />
          </div>

          <div className="rounded-xl bg-[#F77019]/5 border border-[#F77019]/20 p-3">
            <p className="text-[10px] font-bold text-[#F77019]/80">
              계좌 정보는 암호화되어 안전하게 저장됩니다. PortOne 본인인증을 통해 계좌가 검증됩니다.
            </p>
          </div>

          <button
            disabled={!isValid || submitting}
            onClick={handleSubmit}
            className={`w-full h-12 rounded-xl text-[13px] font-black transition-colors ${
              isValid && !submitting
                ? 'bg-[#F77019] text-white hover:bg-[#E05A00]'
                : 'bg-[#F5F5F5] text-[#999] cursor-not-allowed'
            }`}
          >
            {submitting ? '등록 중...' : '계좌 등록 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
