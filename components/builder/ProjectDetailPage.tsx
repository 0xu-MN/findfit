'use client'

import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  Package,
  Trash2,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { PROJECT_TYPE_OPTIONS, STAGE_OPTIONS } from './new-request/types'
import type { AccessMethod, ShippingStatus } from '@/types/database'

type ProjectRow = {
  id: string
  title: string
  one_liner: string | null
  categories: string[]
  stage: string | null
  project_type: string
  status: string
  problem: string | null
  solution: string | null
  alternative_limit: string | null
  target_age_range: string | null
  target_jobs: string[] | null
  target_count: number
  completed_count: number
  access_method: AccessMethod
  created_at: string
}

type QuestionRow = {
  id: string
  question_text: string
  options: string[] | null
  order_index: number
}

type MatchRow = {
  id: string
  nickname: string | null
  status: string
  submitted_at: string | null
  shipping_status: ShippingStatus
  shipping_address: string | null
}

const SHIPPING_LABEL: Record<ShippingStatus, string> = {
  not_required: '배송 불필요',
  pending: '배송 대기',
  shipped: '배송 중',
  delivered: '수령 완료',
}

interface Props {
  projectId: string
}

export default function ProjectDetailPage({ projectId }: Props) {
  const router = useRouter()
  const [project, setProject] = useState<ProjectRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [hydrated, setHydrated] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: p }, { data: q }, { data: m }] = await Promise.all([
      supabase
        .from('projects')
        .select(
          'id, title, one_liner, categories, stage, project_type, status, problem, solution, alternative_limit, target_age_range, target_jobs, target_count, completed_count, access_method, created_at'
        )
        .eq('id', projectId)
        .single(),
      supabase
        .from('review_questions')
        .select('id, question_text, options, order_index')
        .eq('project_id', projectId)
        .order('order_index'),
      // project_matches_for_creator 뷰 — reviewer_id/이메일 등 제외 (migration 009)
      supabase
        .from('project_matches_for_creator')
        .select('id, nickname, status, submitted_at, shipping_status, shipping_address')
        .eq('project_id', projectId),
    ])
    setProject((p as ProjectRow) ?? null)
    setQuestions((q as QuestionRow[]) ?? [])
    setMatches((m as MatchRow[]) ?? [])
    setHydrated(true)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까? 리뷰어 지원 내역, 질문, 답변이 모두 함께 삭제되며 되돌릴 수 없습니다.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    setDeleting(false)
    if (error) {
      alert('삭제 중 오류가 발생했습니다.')
      return
    }
    router.push('/builder/projects')
  }

  const updateShipping = async (matchId: string, status: ShippingStatus) => {
    // 낙관적 업데이트 — 실제 반영은 서버 API에서 소유권 검증 후 서비스 롤로
    // 처리 (project_matches는 RLS상 리뷰어 본인만 직접 UPDATE 가능하므로)
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, shipping_status: status } : m)))
    await fetch(`/api/builder/matches/${matchId}/shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_status: status }),
    })
  }

  if (!hydrated) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-[#F77019] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <FileText className="w-10 h-10 text-[#CCC]" />
        <p className="text-sm font-bold text-[#999]">프로젝트를 찾을 수 없습니다</p>
        <button
          onClick={() => router.back()}
          className="text-[11px] font-black text-[#F77019] hover:underline"
        >
          돌아가기
        </button>
      </div>
    )
  }

  const typeMeta = PROJECT_TYPE_OPTIONS.find((o) => o.value === project.project_type)
  const typeColor = project.project_type === 'light' ? '#F77019' : '#1565C0'
  const stageMeta = STAGE_OPTIONS.find((s) => s.value === project.stage)
  const isShipping = project.access_method === 'physical_shipping'

  const completedCount = project.completed_count
  const targetCount = project.target_count
  const progressPct = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0
  const allDone = completedCount >= targetCount && targetCount > 0

  const ageTags = project.target_age_range
    ? project.target_age_range.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* 뒤로가기 + 헤더 */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-1 p-1.5 rounded-lg hover:bg-[#1D1C1C]/5 transition-colors text-[#666]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {typeMeta && (
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white"
                style={{ background: typeColor }}
              >
                {typeMeta.title}
              </span>
            )}
            {project.categories.slice(0, 2).map((c) => (
              <span key={c} className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
                {c}
              </span>
            ))}
            {isShipping && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[#1565C0]/10 text-[#1565C0] flex items-center gap-1">
                <Package className="w-3 h-3" /> 실물 배송
              </span>
            )}
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded ml-auto ${
                allDone ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 'bg-[#F77019]/10 text-[#F77019]'
              }`}
            >
              {allDone ? '분석 완료' : '리뷰 진행 중'}
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight">{project.title || '(제목 미작성)'}</h1>
          {project.one_liner && <p className="text-sm text-[#666] font-medium">{project.one_liner}</p>}
          <p className="text-[10px] text-[#999] font-bold">{stageMeta?.title ?? project.stage}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="프로젝트 삭제"
          className="mt-1 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#999] hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 리뷰어 진행 현황 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F77019]" />
            <h2 className="text-sm font-black">리뷰어 진행 현황</h2>
          </div>
          <span className="text-[11px] font-black text-[#F77019]">
            {completedCount} / {targetCount}명 완료
          </span>
        </div>

        <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F77019] rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {matches.map((r) => {
              const done = Boolean(r.submitted_at) || r.status === 'completed'
              return (
                <div key={r.id} className="flex flex-col gap-1.5 rounded-xl bg-[#F5F5F5] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-[#2E7D32]' : 'bg-[#CCC]'}`}
                    />
                    <span className="text-[10px] font-bold text-[#666]">{r.nickname ?? '익명 리뷰어'}</span>
                    <span className="text-[9px] font-bold text-[#999] ml-auto">
                      {done ? '평가 완료' : '진행 중'}
                    </span>

                    {/* 배송형 프로젝트 — 리뷰어별 배송 상태 수동 제어 */}
                    {isShipping && (
                      <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-[#1D1C1C]/10">
                        <span className="text-[9px] font-black text-[#1565C0]">
                          {SHIPPING_LABEL[r.shipping_status]}
                        </span>
                        {r.shipping_status === 'pending' && (
                          <button
                            onClick={() => updateShipping(r.id, 'shipped')}
                            disabled={!r.shipping_address}
                            title={!r.shipping_address ? '리뷰어가 아직 배송지를 입력하지 않았어요' : undefined}
                            className="text-[9px] font-black px-2 py-0.5 rounded bg-[#1565C0] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            발송 처리
                          </button>
                        )}
                        {r.shipping_status === 'shipped' && (
                          <button
                            onClick={() => updateShipping(r.id, 'delivered')}
                            className="text-[9px] font-black px-2 py-0.5 rounded border border-[#1565C0] text-[#1565C0] hover:bg-[#1565C0]/5"
                          >
                            배송 완료
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 배송지 — 리뷰어가 승인 후 입력한 주소 (발송 처리 전 확인용) */}
                  {isShipping && r.shipping_address && (
                    <div className="flex items-start gap-1.5 pl-3.5 text-[9px] font-bold text-[#666]">
                      <span className="text-[#999] shrink-0">배송지</span>
                      <span className="whitespace-pre-wrap">{r.shipping_address}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-[#F5F5F5] p-3 text-center">
            <p className="text-[10px] font-bold text-[#999]">아직 매칭된 리뷰어가 없습니다</p>
          </div>
        )}

        {allDone ? (
          <button
            onClick={() => router.push(`/builder/reports/${project.id}`)}
            className="w-full py-3 rounded-xl bg-[#F77019] text-white text-[12px] font-black flex items-center justify-center gap-2 hover:bg-[#e0621a] transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            AI 리포트 보기
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="rounded-xl bg-[#1565C0]/5 border border-[#1565C0]/15 p-3">
            <p className="text-[10px] font-bold text-[#1565C0]">
              ⏳ 목표 인원의 평가 완료 후 AI 리포트가 자동 생성됩니다
            </p>
          </div>
        )}
      </div>

      {/* 프로젝트 내용 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#666]" />
          <h2 className="text-sm font-black">프로젝트 내용</h2>
        </div>

        {project.problem && (
          <InfoField label="문제 / Pain Point">
            <p className="text-[11px] font-bold text-[#1D1C1C] leading-relaxed whitespace-pre-wrap">
              {project.problem}
            </p>
          </InfoField>
        )}
        {project.alternative_limit && (
          <InfoField label="기존 대안과 한계">
            <p className="text-[11px] font-bold text-[#666] leading-relaxed">{project.alternative_limit}</p>
          </InfoField>
        )}
        {project.solution && (
          <InfoField label="차별점">
            <p className="text-[11px] font-bold text-[#666] leading-relaxed">{project.solution}</p>
          </InfoField>
        )}

        {(ageTags.length > 0 || (project.target_jobs?.length ?? 0) > 0) && (
          <InfoField label="타겟 고객">
            <div className="flex flex-wrap gap-1.5">
              {ageTags.map((a) => (
                <span
                  key={a}
                  className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1565C0]/10 text-[#1565C0] border border-[#1565C0]/20"
                >
                  {a}
                </span>
              ))}
              {(project.target_jobs ?? []).map((j) => (
                <span
                  key={j}
                  className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#666] border border-[#1D1C1C]/10"
                >
                  {j}
                </span>
              ))}
            </div>
          </InfoField>
        )}
      </div>

      {/* 검증 질문 */}
      {questions.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-[#666]" />
            <h2 className="text-sm font-black">검증 질문 ({questions.length}개)</h2>
          </div>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3">
                <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                  Q{i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-bold text-[#1D1C1C]">{q.question_text}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {q.options.map((opt) => (
                        <span
                          key={opt}
                          className="text-[9px] font-bold bg-white border border-[#1D1C1C]/10 px-2 py-0.5 rounded"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 액션 */}
      <div className="flex items-center gap-3 pb-8">
        {allDone ? (
          <button
            onClick={() => router.push(`/builder/reports/${project.id}`)}
            className="flex-1 py-3 rounded-xl bg-[#F77019] text-white text-[12px] font-black flex items-center justify-center gap-2 hover:bg-[#e0621a] transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            AI 리포트 보기
          </button>
        ) : (
          <div className="flex-1 flex items-center gap-2 py-3 rounded-xl bg-[#F5F5F5] px-4">
            <Clock className="w-4 h-4 text-[#999]" />
            <span className="text-[11px] font-bold text-[#999]">리뷰어 평가 진행 중...</span>
            <span className="text-[11px] font-black text-[#F77019] ml-auto">
              {completedCount}/{targetCount}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">{label}</span>
      {children}
    </div>
  )
}
