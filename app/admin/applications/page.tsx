'use client'

import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

type ApplicationStatus = 'pending' | 'accepted' | 'dropped'

type Application = {
  id: string
  status: ApplicationStatus
  nickname: string | null
  applicant_email: string | null
  applicant_domain: string[] | null
  applicant_intro: string | null
  applied_at: string | null
  accepted_at: string | null
  projects?: { id: string; title: string } | null
}

const STATUS_CONFIG = {
  pending:  { label: '검토 중',  color: '#1565C0', icon: Clock },
  accepted: { label: '수락됨',  color: '#2E7D32', icon: CheckCircle2 },
  dropped:  { label: '거절됨',  color: '#999',    icon: XCircle },
} as const

const TABS: { key: ApplicationStatus | 'all'; label: string }[] = [
  { key: 'pending',  label: '검토 중' },
  { key: 'accepted', label: '수락됨' },
  { key: 'dropped',  label: '거절됨' },
]

function relativeDate(iso: string | null) {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 1) return '오늘'
  if (d === 1) return '어제'
  return `${d}일 전`
}

export default function AdminApplicationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: AnySupabase = createClient()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ApplicationStatus>('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('project_matches')
        .select('id, status, nickname, applicant_email, applicant_domain, applicant_intro, applied_at, accepted_at, projects(id, title)')
        .order('applied_at', { ascending: false })
      setApplications(data ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = applications.filter((a) => a.status === tab)

  const handleAccept = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/applications/${id}/accept`, { method: 'POST' })
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: 'accepted', accepted_at: new Date().toISOString() } : a)
        )
      }
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/applications/${id}/reject`, { method: 'POST' })
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: 'dropped' } : a)
        )
      }
    } finally {
      setProcessing(null)
    }
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors">
          ← 대시보드
        </a>
        <span className="text-[14px] font-black text-[#1D1C1C]">지원자 관리</span>
        {pendingCount > 0 && (
          <span className="text-[10px] font-black text-white bg-[#1565C0] px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* 탭 */}
        <div className="flex gap-1 bg-white border border-[#1D1C1C]/8 rounded-2xl p-1 w-fit shadow-sm">
          {TABS.filter((t) => t.key !== 'all').map((t) => {
            const key = t.key as ApplicationStatus
            const count = applications.filter((a) => a.status === key).length
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                  tab === key
                    ? 'bg-[#1D1C1C] text-white shadow-sm'
                    : 'text-[#999] hover:text-[#1D1C1C]'
                }`}
              >
                {t.label} {count > 0 && `(${count})`}
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
              {tab === 'pending' ? '검토할 지원이 없습니다' : '해당 상태의 지원이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((app) => {
              const cfg = STATUS_CONFIG[app.status]
              const isProcessing = processing === app.id
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-4"
                >
                  {/* 상단 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-[#1D1C1C]">
                          {app.applicant_email ?? '이메일 없음'}
                        </span>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ background: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#666]">
                        프로젝트: {app.projects?.title ?? '—'}
                        {app.nickname && ` · 닉네임: ${app.nickname}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#999] shrink-0">
                      {relativeDate(app.applied_at)}
                    </span>
                  </div>

                  {/* 직군 */}
                  {app.applicant_domain && app.applicant_domain.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {app.applicant_domain.map((d) => (
                        <span
                          key={d}
                          className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded-full"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 자기소개 */}
                  {app.applicant_intro && (
                    <p className="text-[11px] font-bold text-[#666] bg-[#F5F5F5] rounded-xl px-3 py-2 leading-relaxed">
                      {app.applicant_intro}
                    </p>
                  )}

                  {/* 액션 버튼 (pending만) */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAccept(app.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl bg-[#1565C0] text-white text-[11px] font-black hover:bg-[#1255a3] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        수락 + 이메일 발송
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl bg-[#F5F5F5] text-[#666] text-[11px] font-black hover:bg-[#EBEBEB] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        거절
                      </button>
                    </div>
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
