'use client'

import { MoreHorizontal, Plus, Search, FileText, LayoutGrid, List, Trash2 } from 'lucide-react'
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

export default function ProjectListPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [drafts, setDrafts] = useState<RequestFormData[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
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
        .then(({ data }) => {
          setProjects((data as ProjectRow[]) ?? [])
          setHydrated(true)
        })
    })
  }, [])

  // 진행 중 = 목표 미달, 결과 분석 중 = 목표 달성(리포트 생성/완료)
  const inProgress = projects.filter((p) => p.completed_count < p.target_count)
  const analyzing = projects.filter((p) => p.completed_count >= p.target_count)

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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            내 프로젝트{' '}
            <span className="text-[#999] text-sm font-bold">{hydrated ? draftCount + inProgressCount : ''}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#F5F5F5] rounded-lg p-1">
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
          <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-lg px-3 py-1.5 w-64 shadow-sm focus-within:border-[#F77019] transition-colors">
            <Search className="w-4 h-4 text-[#999] mr-2" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>
          <button
            onClick={newDraft}
            className="bg-[#1D1C1C] text-white text-xs font-black px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#333] transition-colors"
          >
            <Plus className="w-4 h-4" />새 프로젝트
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex items-start gap-6 w-full h-full pb-8">
        {/* 작성 중 */}
        <div className="flex-1 flex flex-col gap-3">
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

            {hydrated && drafts.length === 0 && (
              <p className="text-[10px] font-bold text-[#CCC] text-center mt-1">
                임시저장된 작성중인 의뢰가 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 진행 중 */}
        <div className="flex-1 flex flex-col gap-3">
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

                  <div className="flex items-center gap-2 mt-1 pt-3 border-t border-[#1D1C1C]/5 text-[10px] text-[#999] font-bold group-hover:text-[#F77019] transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    실시간 결과 보기
                  </div>
                </button>
              )
            })}

            {hydrated && inProgress.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#1D1C1C]/10 rounded-xl bg-[#FAFAFA]/50 text-center gap-2">
                <FileText className="w-6 h-6 text-[#CCC]" />
                <span className="text-[10px] font-bold text-[#999]">진행 중인 프로젝트가 없습니다</span>
              </div>
            )}
          </div>
        </div>

        {/* 결과 분석 중 */}
        <div className="flex-1 flex flex-col gap-3">
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
              <button
                key={s.id}
                onClick={() => router.push(`/builder/reports/${s.id}`)}
                className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-left"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-xs font-extrabold group-hover:text-[#F77019] transition-colors line-clamp-1 pr-4">
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
                <div className="flex items-center gap-2 mt-1 pt-3 border-t border-[#1D1C1C]/5 text-[10px] text-[#999] font-bold group-hover:text-[#F77019] transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  AI 리포트 보기
                </div>
              </button>
            ))}

            {hydrated && analyzing.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#1D1C1C]/10 rounded-xl bg-[#FAFAFA]/50 text-center gap-2">
                <FileText className="w-6 h-6 text-[#CCC]" />
                <span className="text-[10px] font-bold text-[#999]">분석 중인 프로젝트가 없습니다</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
