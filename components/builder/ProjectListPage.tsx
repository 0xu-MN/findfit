'use client'

import { BarChart3, MessageSquareText, MoreHorizontal, Plus, Search, FileText, LayoutGrid, List, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { deleteDraft, listDrafts } from './new-request/storage'
import { getDraftTagLabel, type RequestFormData } from './new-request/types'

type ProjectRow = {
  id: string
  title: string
  target_count: number
  completed_count: number
  status: string
  created_at: string
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전 수정'
  if (m < 60) return `${m}분 전 수정`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전 수정`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전 수정`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function ProjectListPage({
  initialStatusFilter = 'all',
}: {
  // ProjectsWorkspace 좌측 "완료된 프로젝트" 메뉴에서 이 필터를 미리 선택된
  // 상태로 열기 위함 — 그 메뉴 항목은 별도 페이지가 아니라 이 리스트를
  // completed로 미리 필터링해서 보여주는 것뿐이다.
  initialStatusFilter?: 'all' | 'draft' | 'inProgress' | 'analyzing' | 'completed'
} = {}) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  // 완료된 프로젝트만 따로 모아 볼 수 있는 필터 — board 뷰에선 해당 컬럼만
  // 남기고, list 뷰에선 행을 필터링한다.
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'inProgress' | 'analyzing' | 'completed'>(initialStatusFilter)
  const [drafts, setDrafts] = useState<RequestFormData[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDrafts(listDrafts())
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setHydrated(true)
        return
      }
      supabase
        .from('projects')
        .select('id, title, target_count, completed_count, status, created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .then(async ({ data }) => {
          const rows = (data as ProjectRow[]) ?? []
          setProjects(rows)
          const doneIds = rows.filter((p) => p.completed_count >= p.target_count).map((p) => p.id)
          if (doneIds.length > 0) {
            const { data: reports } = await supabase
              .from('ai_reports')
              .select('project_id')
              .in('project_id', doneIds)
            setReportedIds(new Set((reports ?? []).map((r: { project_id: string | null }) => r.project_id).filter((id): id is string => Boolean(id))))
          }
          setHydrated(true)
        })
    })
  }, [])

  const inProgress = projects.filter((p) => p.completed_count < p.target_count)
  const analyzing = projects.filter((p) => p.completed_count >= p.target_count && !reportedIds.has(p.id))
  const completed = projects.filter((p) => p.completed_count >= p.target_count && reportedIds.has(p.id))

  const draftCount = drafts.length
  const inProgressCount = inProgress.length

  const openDraft = (id: string) => router.push(`/builder/new-request?draftId=${id}`)
  const newDraft = () => router.push('/builder/new-request')

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('작성 중인 임시저장 항목을 삭제하시겠습니까?')) return
    deleteDraft(id)
    setDrafts(listDrafts())
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('이 프로젝트를 삭제하시겠습니까? 리뷰어 지원 내역, 질문, 답변이 모두 함께 삭제되며 되돌릴 수 없습니다.')) return
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      alert('삭제 중 오류가 발생했습니다.')
      return
    }
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black">
            내 프로젝트{' '}
            <span className="text-[#999] text-sm font-bold">{hydrated ? draftCount + inProgressCount : ''}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/builder/new-request')}
            className="flex items-center gap-1.5 bg-[#F77019] text-white text-xs font-black px-4 py-2 rounded-lg hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> 프로젝트 등록하기
          </button>
          <div className="flex items-center bg-[#F5F5F5] rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-white shadow-sm text-[#1D1C1C]' : 'text-[#999] hover:text-[#666]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1D1C1C]' : 'text-[#999] hover:text-[#666]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-lg px-3 py-1.5 w-full sm:w-64 shadow-sm focus-within:border-[#F77019] transition-colors">
            <Search className="w-4 h-4 text-[#999] mr-2" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* 상태별 필터 탭 — "완료된 프로젝트만 모아서 보기" 요청 반영. board 뷰는
          해당 컬럼만 남기고, list 뷰는 행을 필터링한다. */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: 'all' as const, label: '전체', count: draftCount + inProgressCount + analyzing.length + completed.length },
          { key: 'draft' as const, label: '작성 중', count: draftCount },
          { key: 'inProgress' as const, label: '진행 중', count: inProgress.length },
          { key: 'analyzing' as const, label: '결과 분석 중', count: analyzing.length },
          { key: 'completed' as const, label: '완료됨', count: completed.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              statusFilter === t.key ? 'bg-[#1D1C1C] text-white' : 'bg-[#F5F5F5] text-[#666] hover:bg-[#EEEEEE]'
            }`}
          >
            {t.label} {t.count}
          </button>
        ))}
      </div>

      {/* View Mode Switching: Board vs List */}
      {viewMode === 'board' ? (
        <div className="flex items-start gap-6 w-full h-full pb-8 flex-wrap">
          {/* 작성 중 */}
          {(statusFilter === 'all' || statusFilter === 'draft') && (
          <div className="flex-1 min-w-[220px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#666]">작성 중</span>
                <span className="bg-[#EEEEEE] text-[#666] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {hydrated ? draftCount : 0}
                </span>
              </div>
              <button className="text-[#999] hover:text-[#1D1C1C] transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {hydrated && drafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => openDraft(d.id)}
                  className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-left"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs font-extrabold group-hover:text-[#F77019] transition-colors line-clamp-2 pr-2">
                      {d.productName || '(제목 미작성)'}
                    </h3>
                    <span
                      onClick={(e) => handleDeleteDraft(e, d.id)}
                      role="button"
                      title="삭제"
                      className="p-1 rounded-md text-[#CCC] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-[#F77019] bg-[#F77019]/10 px-2 py-1 rounded-md">
                      {getDraftTagLabel(d.currentStep)}
                    </span>
                    <span className="text-[9px] text-[#999] font-medium">{relativeTime(d.updatedAt)}</span>
                  </div>
                </button>
              ))}

              <button
                onClick={newDraft}
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-[#1D1C1C]/10 rounded-xl text-[11px] font-bold text-[#999] hover:bg-[#FAFAFA] hover:text-[#1D1C1C] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                새로 작성하기
              </button>
            </div>
          </div>
          )}

          {/* 진행 중 */}
          {(statusFilter === 'all' || statusFilter === 'inProgress') && (
          <div className="flex-1 min-w-[220px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#F77019]">진행 중</span>
                <span className="bg-[#F77019]/10 text-[#F77019] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {hydrated ? inProgressCount : 0}
                </span>
              </div>
              <button className="text-[#999] hover:text-[#1D1C1C] transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {hydrated && inProgress.map((s) => {
                const pct = s.target_count > 0 ? Math.round((s.completed_count / s.target_count) * 100) : 0
                return (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/builder/projects/${s.id}`)}
                    className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-left"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-xs font-extrabold group-hover:text-[#F77019] transition-colors line-clamp-1 pr-4">
                        {s.title || '(제목 미작성)'}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-[#2E7D32] whitespace-nowrap bg-[#2E7D32]/10 px-2 py-0.5 rounded">
                          {s.completed_count === 0 ? '매칭 대기중' : '응답 수집중'}
                        </span>
                        <span
                          onClick={(e) => handleDeleteProject(e, s.id)}
                          role="button"
                          title="삭제"
                          className="p-1 rounded-md text-[#CCC] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold text-[#666]">
                        <span>응답 수집률</span>
                        <span className="text-[#F77019]">{s.completed_count} / {s.target_count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F77019]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          )}

          {/* 결과 분석 중 */}
          {(statusFilter === 'all' || statusFilter === 'analyzing') && (
          <div className="flex-1 min-w-[220px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#666]">결과 분석 중</span>
                <span className="bg-[#EEEEEE] text-[#666] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {hydrated ? analyzing.length : 0}
                </span>
              </div>
              <button className="text-[#999] hover:text-[#1D1C1C] transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {hydrated && analyzing.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow group text-left"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xs font-extrabold line-clamp-1 pr-4">
                      {s.title || '(제목 미작성)'}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-[#F77019] whitespace-nowrap bg-[#F77019]/10 px-2 py-0.5 rounded">
                        수집 완료
                      </span>
                      <span
                        onClick={(e) => handleDeleteProject(e, s.id)}
                        role="button"
                        title="삭제"
                        className="p-1 rounded-md text-[#CCC] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#666]">
                    <span>응답 수집률</span>
                    <span className="text-[#F77019]">{s.completed_count} / {s.target_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/builder/reports/${s.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#F77019] text-white text-[10px] font-black hover:bg-[#e0621a] transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> 리포트
                    </button>
                    <button
                      onClick={() => router.push(`/builder/reports/${s.id}/raw`)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#1D1C1C]/12 text-[#1D1C1C] text-[10px] font-black hover:bg-[#F5F5F5] transition-colors"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" /> 리뷰 원본
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* 완료됨 */}
          {(statusFilter === 'all' || statusFilter === 'completed') && (
          <div className="flex-1 min-w-[220px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#2E7D32]">완료됨</span>
                <span className="bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {hydrated ? completed.length : 0}
                </span>
              </div>
              <button className="text-[#999] hover:text-[#1D1C1C] transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {hydrated && completed.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow group text-left"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xs font-extrabold line-clamp-1 pr-4">
                      {s.title || '(제목 미작성)'}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-[#2E7D32] whitespace-nowrap bg-[#2E7D32]/10 px-2 py-0.5 rounded">
                        분석 완료
                      </span>
                      <span
                        onClick={(e) => handleDeleteProject(e, s.id)}
                        role="button"
                        title="삭제"
                        className="p-1 rounded-md text-[#CCC] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/builder/reports/${s.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#F77019] text-white text-[10px] font-black hover:bg-[#e0621a] transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> 리포트
                    </button>
                    <button
                      onClick={() => router.push(`/builder/reports/${s.id}/raw`)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#1D1C1C]/12 text-[#1D1C1C] text-[10px] font-black hover:bg-[#F5F5F5] transition-colors"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" /> 리뷰 원본
                    </button>
                  </div>
                </div>
              ))}

              {hydrated && completed.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#1D1C1C]/10 rounded-xl bg-[#FAFAFA]/50 text-center gap-2">
                  <FileText className="w-6 h-6 text-[#CCC]" />
                  <span className="text-[10px] font-bold text-[#999]">완료된 프로젝트가 없습니다</span>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      ) : (
        /* 리스트형 테이블 뷰 */
        <div className="w-full bg-white border border-[#1D1C1C]/10 rounded-2xl shadow-sm overflow-hidden mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#1D1C1C]/10 text-[11px] font-bold text-[#777]">
                <th className="py-3 px-5">프로젝트 제목</th>
                <th className="py-3 px-5">상태</th>
                <th className="py-3 px-5 text-center">응답/목표 인원</th>
                <th className="py-3 px-5 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1C1C]/5 text-xs">
              {(statusFilter === 'all' || statusFilter === 'draft') && drafts.map((d) => (
                <tr key={d.id} onClick={() => openDraft(d.id)} className="hover:bg-[#F8F9FA] cursor-pointer transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#1D1C1C]">{d.productName || '(제목 미작성)'}</td>
                  <td className="py-3.5 px-5"><span className="text-[10px] font-bold bg-[#EEE] text-[#666] px-2 py-0.5 rounded">작성 중</span></td>
                  <td className="py-3.5 px-5 text-center text-[#999]">-</td>
                  <td className="py-3.5 px-5 text-right">
                    <button onClick={(e) => handleDeleteDraft(e, d.id)} className="p-1 text-[#CCC] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {(statusFilter === 'all' || statusFilter === 'inProgress') && inProgress.map((p) => (
                <tr key={p.id} onClick={() => router.push(`/builder/projects/${p.id}`)} className="hover:bg-[#F8F8F8] cursor-pointer transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#1D1C1C]">{p.title}</td>
                  <td className="py-3.5 px-5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F77019]/10 text-[#F77019]">진행 중</span></td>
                  <td className="py-3.5 px-5 text-center font-bold text-[#555]">{p.completed_count} / {p.target_count}</td>
                  <td className="py-3.5 px-5 text-right">
                    <button onClick={(e) => handleDeleteProject(e, p.id)} className="p-1 text-[#CCC] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {(statusFilter === 'all' || statusFilter === 'analyzing') && analyzing.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8F8F8] transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#1D1C1C]">{p.title}</td>
                  <td className="py-3.5 px-5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F77019]/10 text-[#F77019]">수집 완료</span></td>
                  <td className="py-3.5 px-5 text-center font-bold text-[#555]">{p.completed_count} / {p.target_count}</td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => router.push(`/builder/reports/${p.id}`)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors"><BarChart3 className="w-3.5 h-3.5" /> 리포트</button>
                      <button onClick={() => router.push(`/builder/reports/${p.id}/raw`)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1D1C1C]/12 text-[#1D1C1C] text-[11px] font-black hover:bg-[#F5F5F5] transition-colors"><MessageSquareText className="w-3.5 h-3.5" /> 리뷰 원본</button>
                      <button onClick={(e) => handleDeleteProject(e, p.id)} className="p-1 text-[#CCC] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(statusFilter === 'all' || statusFilter === 'completed') && completed.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8F8F8] transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#1D1C1C]">{p.title}</td>
                  <td className="py-3.5 px-5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2E7D32]/10 text-[#2E7D32]">완료됨</span></td>
                  <td className="py-3.5 px-5 text-center font-bold text-[#555]">{p.completed_count} / {p.target_count}</td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => router.push(`/builder/reports/${p.id}`)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors"><BarChart3 className="w-3.5 h-3.5" /> 리포트</button>
                      <button onClick={() => router.push(`/builder/reports/${p.id}/raw`)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1D1C1C]/12 text-[#1D1C1C] text-[11px] font-black hover:bg-[#F5F5F5] transition-colors"><MessageSquareText className="w-3.5 h-3.5" /> 리뷰 원본</button>
                      <button onClick={(e) => handleDeleteProject(e, p.id)} className="p-1 text-[#CCC] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
