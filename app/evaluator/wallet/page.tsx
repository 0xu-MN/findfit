'use client'

import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import { createClient } from '@/lib/supabase/client'
import { Check, CheckCircle, ChevronDown, Clock, Landmark, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

type Distribution = {
  id: string
  amount: number
  withholding_tax: number | null
  net_amount: number | null
  status: 'pending' | 'completed' | 'pending_registration' | 'failed'
  paid_at: string | null
  created_at: string
  projects?: { title: string } | null
}

const SETTLEMENT_DAY = 25

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협', 'IBK기업', 'SC제일',
  '카카오뱅크', '케이뱅크', '토스뱅크', '새마을금고', '신협', '우체국',
]

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

function getNextSettlementDate() {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), SETTLEMENT_DAY)
  if (now.getDate() >= SETTLEMENT_DAY) {
    target.setMonth(target.getMonth() + 1)
  }
  return target
}

// 계좌 등록이 /reviewer/account-setup이라는 별도 페이지+네비 항목으로
// 분리돼 있었는데, 어차피 정산(포인트 지갑)이랑 한 세트인 정보라서
// 여기 지갑 화면 안에 카드로 합쳤다.
function AccountSettingsCard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [verified, setVerified] = useState(false)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [showBankList, setShowBankList] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('reviewer_profiles')
        .select('bank_name, account_number, account_holder, is_account_verified')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setBankName(data.bank_name ?? '')
        setAccountNumber(data.account_number ?? '')
        setAccountHolder(data.account_holder ?? '')
        setVerified(Boolean(data.is_account_verified))
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isValid = bankName && accountNumber.length >= 10 && accountHolder.length >= 2

  const handleSave = async () => {
    if (!isValid || saving) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase
      .from('reviewer_profiles')
      .update({
        bank_name: bankName,
        account_number: accountNumber, // TODO: pgcrypto 암호화 적용
        account_holder: accountHolder,
        is_account_verified: true, // Mock: 실제는 PortOne 계좌 인증 후 true
        portone_partner_id: `mock-partner-${user.id}`, // Mock: 실제 PortOne 파트너 등록 후 교체
      })
      .eq('user_id', user.id)

    setSaving(false)
    if (error) { alert('저장 중 오류가 발생했습니다'); return }
    setVerified(true)
    setEditing(false)
  }

  if (loading) return null

  return (
    <div className="rounded-2xl border border-[#1D1C1C]/10 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[#1565C0]" />
          <h2 className="text-[13px] font-black">정산 계좌</h2>
          {verified && !editing && (
            <span className="text-[9px] font-black text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Check className="w-3 h-3" /> 등록됨
            </span>
          )}
        </div>
        {verified && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-black text-[#1565C0] hover:underline"
          >
            변경
          </button>
        )}
      </div>

      {!editing && verified ? (
        <p className="text-[11px] font-bold text-[#666]">
          {bankName} {accountNumber.replace(/(\d{3,4})(\d+)(\d{4})/, '$1-****-$3')} · {accountHolder}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {!verified && (
            <p className="text-[10px] font-bold text-[#999]">
              사례금을 받으려면 계좌를 등록해주세요.
            </p>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBankList(!showBankList)}
              className="w-full h-10 rounded-xl bg-[#F5F5F5] border border-transparent flex items-center justify-between px-4 text-[11px] font-bold"
            >
              <span className={bankName ? 'text-[#1D1C1C]' : 'text-[#999]'}>{bankName || '은행을 선택하세요'}</span>
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

          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="계좌번호 (숫자만, - 없이)"
            maxLength={20}
            className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px] font-bold"
          />

          <input
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="예금주 이름"
            maxLength={30}
            className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px] font-bold"
          />

          <div className="flex items-center gap-2">
            <button
              disabled={!isValid || saving}
              onClick={handleSave}
              className={`flex-1 h-10 rounded-xl text-[12px] font-black transition-colors ${
                isValid && !saving
                  ? 'bg-[#F77019] text-white hover:bg-[#E05A00]'
                  : 'bg-[#F5F5F5] text-[#999] cursor-not-allowed'
              }`}
            >
              {saving ? '저장 중...' : '계좌 저장'}
            </button>
            {verified && (
              <button
                onClick={() => setEditing(false)}
                className="h-10 px-4 rounded-xl text-[11px] font-black border border-[#1D1C1C]/10 text-[#666] hover:bg-[#1D1C1C]/5"
              >
                취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WalletContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [tab, setTab] = useState<'completed' | 'pending'>('completed')
  const [loading, setLoading] = useState(true)

  const nextSettlement = getNextSettlementDate()
  const now = new Date()
  const daysLeft = Math.ceil((nextSettlement.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('distributions')
        .select('*, projects(title)')
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false })

      setDistributions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const completed = distributions.filter((d) => d.status === 'completed')
  const pending = distributions.filter((d) => d.status !== 'completed')

  const totalEarned = completed.reduce((s, d) => s + (d.net_amount ?? d.amount), 0)
  const pendingTotal = pending.reduce((s, d) => s + d.amount, 0)
  const list = tab === 'completed' ? completed : pending

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-black">포인트 지갑</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#1D1C1C]/10 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-bold text-[#999]">누적 정산 금액</p>
          <p className="text-xl font-black text-[#1565C0] mt-1">{fmt(totalEarned)}원</p>
          <p className="text-[10px] text-[#999] font-bold">{completed.length}건 완료</p>
        </div>
        <div className="rounded-2xl border border-[#1D1C1C]/10 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-bold text-[#999]">정산 대기 중</p>
          <p className="text-xl font-black text-[#1D1C1C] mt-1">{fmt(pendingTotal)}원</p>
          <p className="text-[10px] text-[#999] font-bold">{pending.length}건</p>
        </div>
      </div>

      {/* 계좌 등록 — 여기서 바로 설정 */}
      <AccountSettingsCard />

      {/* 다음 정산일 안내 */}
      <div className="rounded-2xl border border-[#1565C0]/20 bg-[#1565C0]/5 p-5 flex items-center gap-3">
        <Wallet className="w-5 h-5 text-[#1565C0] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[11px] font-black text-[#1565C0]">
            다음 정산일: 매월 {SETTLEMENT_DAY}일 ({nextSettlement.toLocaleDateString('ko-KR')})
          </p>
          <p className="text-[10px] font-bold text-[#1565C0]/70 mt-0.5">
            {daysLeft > 0 ? `${daysLeft}일 후 정산 예정` : '오늘 정산됩니다'}
            {pendingTotal > 0 && ` · ${fmt(pendingTotal)}원 지급 예정`}
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 bg-white border border-[#1D1C1C]/10 p-1 rounded-xl w-fit">
        {(['completed', 'pending'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-[11px] font-black transition-colors ${
              tab === t ? 'bg-[#1565C0] text-white' : 'text-[#999] hover:text-[#1D1C1C]'
            }`}
          >
            {t === 'completed' ? '정산 완료' : '대기 중'}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-[11px] font-bold text-[#999]">불러오는 중...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[11px] font-bold text-[#999]">
              {tab === 'completed' ? '정산 완료된 내역이 없습니다' : '대기 중인 정산이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1D1C1C]/5">
            {list.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-6 py-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: d.status === 'completed' ? '#1565C010' : '#F5F5F5' }}>
                  {d.status === 'completed'
                    ? <CheckCircle className="w-4 h-4 text-[#1565C0]" />
                    : <Clock className="w-4 h-4 text-[#999]" />}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black text-[#1D1C1C]">
                    {d.projects?.title ?? '프로젝트'}
                  </p>
                  <p className="text-[10px] text-[#999] font-bold mt-0.5">
                    {d.paid_at
                      ? new Date(d.paid_at).toLocaleDateString('ko-KR')
                      : new Date(d.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-black text-[#1565C0]">
                    {fmt(d.net_amount ?? d.amount)}원
                  </p>
                  {(d.withholding_tax ?? 0) > 0 && (
                    <p className="text-[9px] text-[#999] font-bold">
                      원천징수 {fmt(d.withholding_tax!)}원
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EvaluatorWalletPage() {
  return (
    <ReviewerLayout>
      <WalletContent />
    </ReviewerLayout>
  )
}
