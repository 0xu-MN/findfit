'use client'

import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import ProfileForm from '@/components/account/ProfileForm'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/components/builder/new-request/types'
import { CheckCircle2, User, UserCog, Wallet, Settings, Landmark, Clock, Check, Loader2 } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협', 'IBK기업', 'SC제일',
  '카카오뱅크', '케이뱅크', '토스뱅크', '새마을금고', '신협', '우체국',
]

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export default function UnifiedSettingsPage() {
  return (
    <Suspense fallback={null}>
      <UnifiedSettingsContent />
    </Suspense>
  )
}

function UnifiedSettingsContent() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as 'account' | 'profile' | 'wallet') || 'account'
  const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'wallet'>(initialTab)

  useEffect(() => {
    const t = searchParams.get('tab') as 'account' | 'profile' | 'wallet'
    if (t) setActiveTab(t)
  }, [searchParams])

  // 계정 설정 State
  const [accountSaved, setAccountSaved] = useState(false)

  // 프로필 설정 State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [level, setLevel] = useState('general')
  const [domainTags, setDomainTags] = useState<string[]>([])

  // 포인트 지갑 & 계좌 State
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [verified, setVerified] = useState(false)
  const [walletSaving, setWalletSaving] = useState(false)
  const [walletSaved, setWalletSaved] = useState(false)
  const [distributions, setDistributions] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load Profile
      const { data: profile } = await supabase
        .from('reviewer_profiles')
        .select('domain_tags, level, bank_name, account_number, account_holder, is_account_verified')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile) {
        setDomainTags(profile.domain_tags ?? [])
        setLevel(profile.level ?? 'general')
        setBankName(profile.bank_name ?? '')
        setAccountNumber(profile.account_number ?? '')
        setAccountHolder(profile.account_holder ?? '')
        setVerified(Boolean(profile.is_account_verified))
      }
      setProfileLoading(false)

      // Load Distributions
      const { data: dists } = await supabase
        .from('distributions')
        .select('*, projects(title)')
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false })

      setDistributions(dists ?? [])
    }
    loadData()
  }, [])

  const handleProfileSave = async () => {
    setProfileSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('reviewer_profiles')
        .update({ domain_tags: domainTags })
        .eq('user_id', user.id)
    }
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handleWalletSave = async () => {
    setWalletSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('reviewer_profiles')
        .update({
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: accountHolder,
          is_account_verified: true,
        })
        .eq('user_id', user.id)
      setVerified(true)
    }
    setWalletSaving(false)
    setWalletSaved(true)
    setTimeout(() => setWalletSaved(false), 2000)
  }

  const toggleTag = (tag: string) => {
    setDomainTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const totalEarned = distributions.filter((d) => d.status === 'completed').reduce((s, d) => s + (d.net_amount ?? d.amount), 0)

  return (
    <ReviewerLayout>
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 text-[#1D1C1C] py-2">
        <h1 className="text-2xl font-black">통합 설정</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Navigation Sidebar Tabs */}
          <div className="flex lg:flex-col gap-1.5 p-2 rounded-2xl bg-white border border-[#1D1C1C]/10 shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'account' ? 'bg-[#1565C0] text-white shadow-sm' : 'text-[#666] hover:bg-[#F5F5F5]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>계정 설정</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'profile' ? 'bg-[#1565C0] text-white shadow-sm' : 'text-[#666] hover:bg-[#F5F5F5]'
              }`}
            >
              <UserCog className="w-4 h-4" />
              <span>프로필 설정</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'wallet' ? 'bg-[#1565C0] text-white shadow-sm' : 'text-[#666] hover:bg-[#F5F5F5]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>포인트 지갑 & 계좌</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex flex-col gap-6 bg-white border border-[#1D1C1C]/10 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] min-h-[480px]">
            {activeTab === 'account' && (
              <div className="flex flex-col gap-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-black">계정 설정</h2>
                  <p className="text-xs text-[#666] font-medium mt-1">로그인 이메일, 닉네임 및 비밀번호를 관리합니다.</p>
                </div>
                <ProfileForm mode="settings" onDone={() => { setAccountSaved(true); setTimeout(() => setAccountSaved(false), 2000) }} />
                {accountSaved && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> 계정 정보가 성공적으로 변경되었습니다.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6 max-w-xl">
                <div>
                  <h2 className="text-lg font-black">평가단 프로필 설정</h2>
                  <p className="text-xs text-[#666] font-medium mt-1">관심 분야를 설정하시면 어울리는 의뢰가 우선 추천됩니다.</p>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#F8F9FA] border border-[#1D1C1C]/5">
                  <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">평가단 등급</span>
                  <p className="text-sm font-black text-[#1565C0]">{level === 'expert' ? '전문가 리뷰어' : '일반 리뷰어'}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-black text-[#999] uppercase tracking-wider">관심 전문 분야</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((tag) => {
                      const active = domainTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                            active
                              ? 'border-[#1565C0] bg-[#1565C0]/10 text-[#1565C0]'
                              : 'border-[#1D1C1C]/10 text-[#666] hover:border-[#1D1C1C]/30'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="mt-2 h-11 rounded-xl bg-[#1565C0] text-white text-xs font-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 self-start px-6"
                >
                  {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {profileSaved && <CheckCircle2 className="w-4 h-4 text-white" />}
                  저장하기
                </button>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-black">포인트 지갑 & 정산 계좌</h2>
                  <p className="text-xs text-[#666] font-medium mt-1">누적 정산금 확인 및 사례금을 지급받을 정산 계좌를 관리하세요.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#1D1C1C]/10 bg-[#F8F9FA] p-5">
                    <p className="text-[10px] font-bold text-[#999]">누적 정산 완료 금액</p>
                    <p className="text-2xl font-black text-[#1565C0] mt-1">{fmt(totalEarned)}원</p>
                  </div>
                  <div className="rounded-2xl border border-[#1D1C1C]/10 bg-[#F8F9FA] p-5">
                    <p className="text-[10px] font-bold text-[#999]">정산 상태</p>
                    <p className="text-sm font-black text-[#1D1C1C] mt-1 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> {verified ? '계좌 등록 완료' : '계좌 미등록'}
                    </p>
                  </div>
                </div>

                {/* Account Form */}
                <div className="flex flex-col gap-3 p-5 rounded-2xl border border-[#1D1C1C]/10 bg-white">
                  <h3 className="text-xs font-black text-[#1D1C1C] flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#1565C0]" /> 정산 계좌 등록 / 변경
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#F5F5F5] border-none text-xs font-bold outline-none"
                    >
                      <option value="">은행 선택</option>
                      {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="계좌번호 (- 없이)"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#F5F5F5] border-none text-xs font-bold outline-none"
                    />
                    <input
                      type="text"
                      placeholder="예금주"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#F5F5F5] border-none text-xs font-bold outline-none"
                    />
                  </div>
                  <button
                    onClick={handleWalletSave}
                    disabled={walletSaving || !bankName || !accountNumber}
                    className="mt-2 h-10 rounded-xl bg-[#1565C0] text-white text-xs font-black disabled:opacity-40 self-end px-5"
                  >
                    {walletSaving ? '저장 중...' : walletSaved ? '저장 완료!' : '계좌 정보 저장'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ReviewerLayout>
  )
}
