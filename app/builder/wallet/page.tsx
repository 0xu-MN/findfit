'use client'

import DashboardLayout from '@/components/shared/DashboardLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import { CREDIT_SOURCE_LABELS } from '@/lib/constants/credit'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

type CreditTransaction = {
  id: string
  created_at: string
  source: keyof typeof CREDIT_SOURCE_LABELS
  amount: number
  expires_at: string | null
}

type TabKey = 'all' | 'earn' | 'use' | 'expire'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',    label: '전체' },
  { key: 'earn',   label: '적립' },
  { key: 'use',    label: '사용' },
  { key: 'expire', label: '소멸' },
]

const EARN_SOURCES = new Set<string>(['refund', 'shortfall', 'promo', 'signup'])

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

function WalletContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [balance, setBalance] = useState(0)
  const [nextExpiry, setNextExpiry] = useState<{ amount: number; date: string } | null>(null)
  const [tab, setTab] = useState<TabKey>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: txs } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const list: CreditTransaction[] = txs ?? []
      setTransactions(list)
      setBalance(Math.max(0, list.reduce((s, t) => s + t.amount, 0)))

      const upcoming = list
        .filter((t) => EARN_SOURCES.has(t.source) && t.expires_at && t.amount > 0)
        .sort((a, b) => (a.expires_at! < b.expires_at! ? -1 : 1))
      if (upcoming.length > 0) {
        setNextExpiry({ amount: upcoming[0].amount, date: upcoming[0].expires_at! })
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = transactions.filter((t) => {
    if (tab === 'all') return true
    if (tab === 'earn') return EARN_SOURCES.has(t.source) && t.amount > 0
    if (tab === 'use') return t.source === 'use'
    if (tab === 'expire') return t.source === 'expire'
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-black">FIT 크레딧</h1>

      {/* 잔액 카드 */}
      <div
        className="rounded-3xl p-8 flex flex-col gap-3"
        style={{ background: 'linear-gradient(135deg, #F77019 0%, #FF9B4A 100%)' }}
      >
        <p className="text-[11px] font-black text-white/70">현재 잔액</p>
        <p className="text-4xl font-black text-white">
          {fmt(balance)}<span className="text-xl ml-1">C</span>
        </p>
        {nextExpiry && (
          <p className="text-[10px] font-bold text-white/80">
            {fmt(nextExpiry.amount)}C이 {new Date(nextExpiry.date).toLocaleDateString('ko-KR')}에 만료돼요
          </p>
        )}
        <button className="mt-2 h-9 px-5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-black w-fit transition-colors">
          크레딧 충전하기
        </button>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 bg-white border border-[#1D1C1C]/10 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-colors ${
              tab === t.key ? 'bg-[#F77019] text-white' : 'text-[#999] hover:text-[#1D1C1C]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 거래 내역 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-[11px] font-bold text-[#999]">불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[11px] font-bold text-[#999]">내역이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1D1C1C]/5">
            {filtered.map((t) => {
              const isEarn = EARN_SOURCES.has(t.source) && t.amount > 0
              return (
                <div key={t.id} className="flex items-center gap-3 px-6 py-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-[#1D1C1C]">
                      {CREDIT_SOURCE_LABELS[t.source] ?? t.source}
                    </p>
                    <p className="text-[10px] text-[#999] font-bold mt-0.5">
                      {new Date(t.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-black ${isEarn ? 'text-green-600' : 'text-[#999]'}`}>
                      {isEarn ? '+' : ''}{fmt(t.amount)}C
                    </p>
                    {isEarn && t.expires_at && (
                      <p className="text-[9px] text-[#999] font-bold">
                        {new Date(t.expires_at).toLocaleDateString('ko-KR')} 만료
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BuilderWalletPage() {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <WalletContent />
    </DashboardLayout>
  )
}
