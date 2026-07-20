'use client'

import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

type ProjectStatus = 'draft' | 'pending_review' | 'active' | 'rejected' | 'completed' | 'cancelled'

type ProjectRow = {
  id: string
  title: string
  one_liner: string | null
  project_type: string
  status: ProjectStatus
  categories: string[]
  target_count: number
  completed_count: number
  access_method: string
  creator_id: string | null
  created_at: string
}

const STATUS_LABEL: Record<ProjectStatus, { label: string; color: string }> = {
  draft: { label: '작성중', color: '#999' },
  pending_review: { label: '검수 대기', color: '#1565C0' },
  active: { label: '진행중(노출)', color: '#2E7D32' },
  rejected: { label: '반려됨', color: '#EF4444' },
  completed: { label: '완료', color: '#666' },
  cancelled: { label: '취소됨', color: '#999' },
}

const TABS: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'pending_review', label: '검수 대기' },
  { key: 'active', label: '진행중' },
  { key: 'rejected', label: '반려됨' },
  { key: 'all', label: '전체' },
]

function relativeDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 1) return '오늘'
  if (d === 1) return '어제'
  return `${d}일 전`
}

export default function AdminRequestsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ProjectStatus | 'all'>('pending_review')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/requests')
      const { projects: data } = await res.json()
      setProjects(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tab === 'all' ? projects : projects.filter((p) => p.status === tab)
  const pendingCount = projects.filter((p) => p.status === 'pending_review').length

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p)))
      }
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, { method: 'POST' })
      if (res.ok) {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)))
      }
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors">
          ← 대시보드
        </a>
        <span className="text-[14px] font-black text-[#1D1C1C]">프로젝트 검수</span>
        {pendingCount > 0 && (
          <span className="text-[10px] font-black text-white bg-[#1565C0] px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="bg-[#1565C0]/5 border border-[#1565C0]/20 rounded-2xl px-5 py-3">
          <p className="text-[11px] font-bold text-[#1565C0]">
            지금은 크리에이터가 등록하면 바로 &quot;진행중&quot; 상태로 리뷰어 피드에 노출됩니다.
            아래에서 승인/반려는 언제든 처리할 수 있지만, 강제 검수(제출 즉시 검수 대기로 전환)는 아직 켜져있지 않습니다.
          </p>
        </div>

        <div className="flex gap-1 bg-white border border-[#1D1C1C]/8 rounded-2xl p-1 w-fit shadow-sm">
          {TABS.map((t) => {
            const count = t.key === 'all' ? projects.length : projects.filter((p) => p.status === t.key).length
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                  tab === t.key ? 'bg-[#1D1C1C] text-white shadow-sm' : 'text-[#999] hover:text-[#1D1C1C]'
                }`}
              >
                {t.label} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-12 text-center">
            <p className="text-[12px] font-bold text-[#999]">해당 상태의 프로젝트가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => {
              const cfg = STATUS_LABEL[p.status]
              const isProcessing = processing === p.id
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-[#1D1C1C]">{p.title}</span>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ background: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-1.5 py-0.5 rounded">
                          {p.project_type}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#666]">
                        {p.one_liner ?? '—'} · {p.completed_count}/{p.target_count}명 · {p.access_method}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#999] shrink-0">{relativeDate(p.created_at)}</span>
                  </div>

                  {p.status === 'pending_review' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl bg-[#1565C0] text-white text-[11px] font-black hover:bg-[#1255a3] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        승인 (노출)
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl bg-[#F5F5F5] text-[#666] text-[11px] font-black hover:bg-[#EBEBEB] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        반려
                      </button>
                    </div>
                  )}
                  {p.status === 'active' && (
                    <button
                      onClick={() => handleReject(p.id)}
                      disabled={isProcessing}
                      className="self-start text-[10px] font-bold text-[#999] hover:text-[#EF4444] transition-colors flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" /> 이 프로젝트 반려(노출 중단)
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
