'use client'

import DashboardLayout from '@/components/shared/DashboardLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, Wallet } from 'lucide-react'
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
    <DashboardLayout role="reviewer" rightPanel={<SharedLoungeFeed />}>
      <WalletContent />
    </DashboardLayout>
  )
}
