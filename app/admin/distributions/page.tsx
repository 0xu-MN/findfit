'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type Distribution = {
  id: string
  status: 'pending' | 'completed' | 'pending_registration' | 'failed'
  amount: number
  net_amount: number | null
  withholding_tax: number | null
  created_at: string
  paid_at: string | null
  reviewer_id: string | null
  projects?: { title: string } | null
}

function fmt(n: number) { return n.toLocaleString('ko-KR') }

function relativeDate(iso: string | null) {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 1) return '오늘'
  if (d === 1) return '어제'
  return `${d}일 전`
}

export default function AdminDistributionsPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'completed'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/distributions')
      const { distributions: data } = await res.json()
      setDistributions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = distributions.filter((d) =>
    tab === 'completed' ? d.status === 'completed' : d.status !== 'completed'
  )

  const pendingCount = distributions.filter((d) => d.status !== 'completed').length

  const handleComplete = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/distributions/${id}/complete`, { method: 'POST' })
      if (res.ok) {
        setDistributions((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: 'completed', paid_at: new Date().toISOString() } : d)
        )
      }
    } finally {
      setProcessing(null)
    }
  }

  const totalPendingAmount = distributions
    .filter((d) => d.status !== 'completed')
    .reduce((sum, d) => sum + (d.net_amount ?? d.amount), 0)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors">
          ← 대시보드
        </a>
        <span className="text-[14px] font-black text-[#1D1C1C]">정산 관리</span>
        {pendingCount > 0 && (
          <span className="text-[10px] font-black text-white bg-[#F77019] px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* 요약 */}
        {tab === 'pending' && pendingCount > 0 && (
          <div className="bg-[#F77019]/5 border border-[#F77019]/20 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-[#F77019]">정산 대기 총액</p>
              <p className="text-xl font-black text-[#1D1C1C] mt-0.5">{fmt(totalPendingAmount)}원</p>
            </div>
            <p className="text-[10px] font-bold text-[#999]">인터넷뱅킹에서 직접 이체 후<br/>정산 완료 처리 해주세요</p>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-1 bg-white border border-[#1D1C1C]/8 rounded-2xl p-1 w-fit shadow-sm">
          {(['pending', 'completed'] as const).map((t) => {
            const count = distributions.filter((d) =>
              t === 'completed' ? d.status === 'completed' : d.status !== 'completed'
            ).length
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                  tab === t
                    ? 'bg-[#1D1C1C] text-white shadow-sm'
                    : 'text-[#999] hover:text-[#1D1C1C]'
                }`}
              >
                {t === 'pending' ? '대기 중' : '완료'} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-12 text-center">
            <p className="text-[12px] font-bold text-[#999]">
              {tab === 'pending' ? '정산 대기 건이 없습니다' : '완료된 정산이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((dist) => {
              const net = dist.net_amount ?? dist.amount
              const isProcessing = processing === dist.id
              const isDone = dist.status === 'completed'
              return (
                <div
                  key={dist.id}
                  className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4"
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-[#1D1C1C]">
                        {fmt(net)}원
                      </span>
                      {dist.withholding_tax && dist.withholding_tax > 0 && (
                        <span className="text-[9px] font-bold text-[#999] bg-[#F5F5F5] px-1.5 py-0.5 rounded">
                          원천징수 {fmt(dist.withholding_tax)}원 차감
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[9px] font-black text-[#2E7D32] bg-green-50 px-2 py-0.5 rounded-full">
                          완료
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#999]">
                      <span>프로젝트: {dist.projects?.title ?? '—'}</span>
                      <span>·</span>
                      <span>{isDone ? `지급일: ${relativeDate(dist.paid_at)}` : `생성: ${relativeDate(dist.created_at)}`}</span>
                    </div>
                  </div>

                  {!isDone && (
                    <button
                      onClick={() => handleComplete(dist.id)}
                      disabled={isProcessing}
                      className="shrink-0 flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors disabled:opacity-60"
                    >
                      {isProcessing
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />
                      }
                      정산 완료
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
