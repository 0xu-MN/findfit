'use client'

import { Ban, CheckCircle2, Loader2, Search, UserX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type UserRole = 'builder' | 'evaluator' | 'admin'
type UserStatus = 'active' | 'suspended' | 'withdrawn'

type UserRow = {
  id: string
  email: string
  role: UserRole | null
  status: UserStatus
  created_at: string
  project_count: number
  completed_review_count: number
}

const STATUS_LABEL: Record<UserStatus, { label: string; color: string }> = {
  active: { label: '활성', color: '#2E7D32' },
  suspended: { label: '정지됨', color: '#F77019' },
  withdrawn: { label: '탈퇴', color: '#999' },
}

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  builder: { label: '크리에이터', color: '#F77019' },
  evaluator: { label: '리뷰어', color: '#1565C0' },
  admin: { label: '관리자', color: '#1D1C1C' },
}

function relativeDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 1) return '오늘 가입'
  if (d === 1) return '어제 가입'
  return `${d}일 전 가입`
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/users')
      const { users: data } = await res.json()
      setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (query && !u.email.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [users, roleFilter, statusFilter, query])

  const changeStatus = async (id: string, status: UserStatus) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
      }
    } finally {
      setProcessing(null)
    }
  }

  const activeCount = users.filter((u) => u.status === 'active').length
  const suspendedCount = users.filter((u) => u.status === 'suspended').length

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors">
          ← 대시보드
        </a>
        <span className="text-[14px] font-black text-[#1D1C1C]">유저 관리</span>
        <span className="text-[10px] font-bold text-[#999]">
          활성 {activeCount}명 {suspendedCount > 0 && `· 정지 ${suspendedCount}명`}
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* 검색 + 필터 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-xl px-3 py-2 w-72 shadow-sm focus-within:border-[#1D1C1C]/30 transition-colors">
            <Search className="w-4 h-4 text-[#999] mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이메일로 검색..."
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>

          <div className="flex gap-1 bg-white border border-[#1D1C1C]/8 rounded-xl p-1 shadow-sm">
            {(['all', 'builder', 'evaluator'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  roleFilter === r ? 'bg-[#1D1C1C] text-white' : 'text-[#999] hover:text-[#1D1C1C]'
                }`}
              >
                {r === 'all' ? '전체 역할' : ROLE_LABEL[r].label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-white border border-[#1D1C1C]/8 rounded-xl p-1 shadow-sm">
            {(['all', 'active', 'suspended', 'withdrawn'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  statusFilter === s ? 'bg-[#1D1C1C] text-white' : 'text-[#999] hover:text-[#1D1C1C]'
                }`}
              >
                {s === 'all' ? '전체 상태' : STATUS_LABEL[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-12 text-center">
            <p className="text-[12px] font-bold text-[#999]">조건에 맞는 유저가 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1D1C1C]/8 text-[10px] font-black text-[#999] uppercase tracking-wider">
                  <th className="px-5 py-3">이메일</th>
                  <th className="px-5 py-3">역할</th>
                  <th className="px-5 py-3">활동</th>
                  <th className="px-5 py-3">상태</th>
                  <th className="px-5 py-3">가입</th>
                  <th className="px-5 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const roleMeta = u.role ? ROLE_LABEL[u.role] : null
                  const statusMeta = STATUS_LABEL[u.status]
                  const isProcessing = processing === u.id
                  return (
                    <tr key={u.id} className="border-b border-[#1D1C1C]/5 last:border-0 hover:bg-[#FAFAFA]/60">
                      <td className="px-5 py-3 text-[12px] font-bold text-[#1D1C1C]">{u.email}</td>
                      <td className="px-5 py-3">
                        {roleMeta ? (
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ background: roleMeta.color }}
                          >
                            {roleMeta.label}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-[#999]">미선택</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[10px] font-bold text-[#666]">
                        {u.role === 'builder' && `등록 프로젝트 ${u.project_count}건`}
                        {u.role === 'evaluator' && `완료 리뷰 ${u.completed_review_count}건`}
                        {!u.role && '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ background: statusMeta.color }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[10px] font-bold text-[#999]">{relativeDate(u.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#999]" />
                          ) : (
                            <>
                              {u.status !== 'active' && (
                                <button
                                  onClick={() => changeStatus(u.id, 'active')}
                                  className="flex items-center gap-1 text-[9px] font-black text-[#2E7D32] hover:bg-[#2E7D32]/10 px-2 py-1 rounded-lg transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> 재활성
                                </button>
                              )}
                              {u.status !== 'suspended' && u.role !== 'admin' && (
                                <button
                                  onClick={() => changeStatus(u.id, 'suspended')}
                                  className="flex items-center gap-1 text-[9px] font-black text-[#F77019] hover:bg-[#F77019]/10 px-2 py-1 rounded-lg transition-colors"
                                >
                                  <Ban className="w-3 h-3" /> 정지
                                </button>
                              )}
                              {u.status !== 'withdrawn' && u.role !== 'admin' && (
                                <button
                                  onClick={() => changeStatus(u.id, 'withdrawn')}
                                  className="flex items-center gap-1 text-[9px] font-black text-[#999] hover:bg-[#999]/10 px-2 py-1 rounded-lg transition-colors"
                                >
                                  <UserX className="w-3 h-3" /> 탈퇴 처리
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
