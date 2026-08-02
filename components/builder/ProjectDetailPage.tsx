'use client'

import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  MessageSquareText,
  Package,
  Trash2,
  Users,
  Wallet,
  X,
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
  deadline: string | null
  extra_data: { financials?: { expectedPrice: number; expectedCost: number; marketingBudget: number } | null } | null
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
  // force_early만 재확인 모달을 거친다(손실이 확정되는 유일한 경우) —
  // proceed_short/complete_start는 되돌릴 수 없는 손해가 없어서 버튼 클릭
  // 즉시 실행한다.
  const [confirmForceEarly, setConfirmForceEarly] = useState(false)
  const [closing, setClosing] = useState<'force_early' | 'proceed_short' | 'complete_start' | null>(null)
  const [extending, setExtending] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // 재무 정보(예상 판매가/원가/마케팅 예산) — 등록 마법사에서만 입력받던 걸
  // 이미 등록된 프로젝트에도 나중에 추가/수정할 수 있게 한다(리포트의 Unit
  // Economics 계산에 쓰임). 값이 있으면 그걸로 폼을 채우고, 없으면 빈 폼.
  const [editingFinancials, setEditingFinancials] = useState(false)
  const [financialsForm, setFinancialsForm] = useState({ expectedPrice: '', expectedCost: '', marketingBudget: '' })
  const [savingFinancials, setSavingFinancials] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: p }, { data: q }, { data: m }] = await Promise.all([
      supabase
        .from('projects')
        .select(
          'id, title, one_liner, categories, stage, project_type, status, problem, solution, alternative_limit, target_age_range, target_jobs, target_count, completed_count, access_method, created_at, deadline, extra_data'
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

  const openFinancialsEdit = () => {
    const f = project?.extra_data?.financials
    setFinancialsForm({
      expectedPrice: f?.expectedPrice ? String(f.expectedPrice) : '',
      expectedCost: f?.expectedCost ? String(f.expectedCost) : '',
      marketingBudget: f?.marketingBudget ? String(f.marketingBudget) : '',
    })
    setEditingFinancials(true)
  }

  const saveFinancials = async () => {
    setSavingFinancials(true)
    const res = await fetch(`/api/projects/${projectId}/financials`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedPrice: Number(financialsForm.expectedPrice) || 0,
        expectedCost: Number(financialsForm.expectedCost) || 0,
        marketingBudget: Number(financialsForm.marketingBudget) || 0,
      }),
    })
    setSavingFinancials(false)
    if (res.ok) {
      const { financials } = await res.json()
      setProject((p) => (p ? { ...p, extra_data: { ...(p.extra_data ?? {}), financials } } : p))
      setEditingFinancials(false)
    }
  }

  // 모집 중(active)이거나 이미 리뷰 단계(reviewing)인 프로젝트는 이미
  // 리뷰어 사례금이 걸려있을 수 있어서, 네이티브 confirm() 대신 환불 불가를
  // 명시하는 커스텀 모달로 한 번 더 물어본다. draft/pending_review처럼
  // 아직 아무도 모집 안 된 상태는 가벼운 native confirm으로 충분하다.
  const isRecruitingOrReviewing = project?.status === 'active' || project?.status === 'reviewing'

  const requestDelete = () => {
    if (isRecruitingOrReviewing) {
      setShowDeleteConfirm(true)
      return
    }
    if (!confirm('이 프로젝트를 삭제하시겠습니까? 질문/답변이 모두 함께 삭제되며 되돌릴 수 없습니다.')) return
    void handleDelete()
  }

  const handleDelete = async () => {
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

  const runCloseRecruitment = async (mode: 'force_early' | 'proceed_short' | 'complete_start') => {
    if (!project) return
    setClosing(mode)
    try {
      const res = await fetch(`/api/projects/${project.id}/close-recruitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (res.ok) {
        setProject((prev) => (prev ? { ...prev, status: 'reviewing' } : prev))
        setConfirmForceEarly(false)
      }
    } finally {
      setClosing(null)
    }
  }

  const handleExtendDeadline = async () => {
    if (!project) return
    setExtending(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/extend-deadline`, { method: 'POST' })
      const body = await res.json()
      if (res.ok && body.deadline) {
        setProject((prev) => (prev ? { ...prev, deadline: body.deadline } : prev))
      }
    } finally {
      setExtending(false)
    }
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
  const pendingMatches = matches.filter((m) => m.status === 'pending')
  const activeMatches = matches.filter((m) => m.status !== 'pending' && m.status !== 'dropped')

  const completedCount = project.completed_count
  const targetCount = project.target_count
  const progressPct = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0
  const allDone = completedCount >= targetCount && targetCount > 0

  const ageTags = project.target_age_range
    ? project.target_age_range.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C] px-4 sm:px-10 lg:px-[100px]">
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
              className={`text-[11px] font-black px-3 py-1.5 rounded-lg ml-auto ${
                project.status === 'pending_review'
                  ? 'bg-[#999]/10 text-[#666]'
                  : project.status === 'rejected'
                  ? 'bg-red-500/10 text-red-500'
                  : allDone
                  ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                  : 'bg-[#F77019]/10 text-[#F77019]'
              }`}
            >
              {project.status === 'pending_review'
                ? '검수 대기중'
                : project.status === 'rejected'
                ? '검수 반려됨'
                : allDone
                ? '분석 완료'
                : '리뷰 진행 중'}
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight">{project.title || '(제목 미작성)'}</h1>
          {project.one_liner && <p className="text-sm text-[#666] font-medium">{project.one_liner}</p>}
          <p className="text-[10px] text-[#999] font-bold">{stageMeta?.title ?? project.stage}</p>
        </div>
        <button
          onClick={requestDelete}
          disabled={deleting}
          title="프로젝트 삭제"
          className="mt-1 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#999] hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 모집 중/리뷰 진행 중인 프로젝트를 삭제하려 할 때 — 이미 리뷰어
          사례금이 걸려있을 수 있어서 실수/충동 삭제를 막는 토스트형 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: 'rgba(29,28,28,0.4)' }}>
          <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-[13px] font-black">정말 삭제할까요?</span>
            </div>
            <p className="text-[12px] font-bold text-[#666] leading-relaxed">
              {project.status === 'reviewing'
                ? '이미 모집이 마감되고 리뷰가 진행 중인 프로젝트예요.'
                : '지금 리뷰어를 모집 중인 프로젝트예요.'}{' '}
              지원 내역, 질문, 답변이 모두 함께 삭제되며 되돌릴 수 없어요.
            </p>
            <p className="text-[11px] font-black text-red-500 bg-red-50 rounded-xl px-3 py-2.5 leading-relaxed">
              이미 모집된 리뷰어 사례금은 삭제해도 환불되지 않아요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#F5F5F5] text-[#666] text-[12px] font-black hover:bg-[#EBEBEB] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12px] font-black hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {deleting ? '삭제하는 중...' : '네, 삭제할게요'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* 모집 마감/리뷰 시작 선택권 — 상황(마감일 지남 여부 × 목표 인원
            도달 여부)에 따라 3가지 화면으로 나뉜다. 관리자가 개별 리뷰어
            지원을 수락해도 프로젝트는 여기서 크리에이터가 명시적으로
            시작하기 전까진 active 상태 그대로라 리뷰 제출 자체가 막혀있다
            (app/api/reviews/[matchId]/submit이 status==='reviewing' 요구). */}
        {project.status === 'active' && (() => {
          const deadlinePassed = project.deadline ? new Date(project.deadline) < new Date() : false
          // ⚠️ 예전엔 completed_count(리뷰 "제출 완료" 수)로 모집 충족 여부를
          // 판단해서, 지원이 수락돼 모집 인원은 이미 다 찼는데도(활성 매칭
          // acceptedCount === targetCount) 아직 아무도 리뷰를 "제출"하지
          // 않았다는 이유로 "미달"로 잘못 표시되고 있었다 — 모집 충족은
          // 실제 수락된 인원(activeMatches) 기준으로 판단해야 한다.
          const acceptedCount = activeMatches.length
          const targetMet = acceptedCount >= targetCount && targetCount > 0

          // ── 케이스 3: 목표 인원 다 채움 — 경고 없이 바로 시작 ──
          if (targetMet) {
            return (
              <div className="rounded-2xl bg-[#F77019]/5 border border-[#F77019]/20 p-4 flex flex-col gap-3">
                <div>
                  <p className="text-[12px] font-black text-[#1D1C1C]">목표했던 리뷰어가 모두 모였어요!</p>
                  <p className="text-[10px] font-bold text-[#999] mt-0.5">지금 바로 프로젝트를 시작하고 리뷰를 받아보세요.</p>
                </div>
                <button
                  onClick={() => runCloseRecruitment('complete_start')}
                  disabled={closing !== null}
                  className="py-2.5 rounded-xl bg-[#F77019] text-white text-[12px] font-black hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {closing === 'complete_start' ? '시작하는 중...' : '지금 바로 시작하기'}
                </button>
              </div>
            )
          }

          // ── 케이스 2: 마감일 지남 + 미달 — 중립 톤, 선택지 2개 ──
          if (deadlinePassed) {
            return (
              <div className="rounded-2xl bg-[#F5F5F5] p-4 flex flex-col gap-3">
                <div>
                  <p className="text-[12px] font-black text-[#1D1C1C]">모집 마감일이 지났어요</p>
                  <p className="text-[10px] font-bold text-[#999] mt-0.5">목표했던 인원이 다 모이지 않았어요. 지금까지 모인 리뷰어로 시작하거나, 기간을 늘려 더 모집해볼 수 있어요.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <button
                      onClick={() => runCloseRecruitment('proceed_short')}
                      disabled={closing !== null}
                      className="w-full py-2.5 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {closing === 'proceed_short' ? '처리 중...' : '지금 모인 인원으로 시작하기'}
                    </button>
                    <span className="text-[9px] font-bold text-[#999] text-center">부족한 인원만큼의 금액은 전액 환불돼요</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <button
                      onClick={handleExtendDeadline}
                      disabled={extending}
                      className="w-full py-2.5 rounded-xl border border-[#1D1C1C]/15 text-[#666] text-[11px] font-black hover:bg-white transition-colors disabled:opacity-60"
                    >
                      {extending ? '연장하는 중...' : '모집 기간 연장하기'}
                    </button>
                    <span className="text-[9px] font-bold text-[#999] text-center">며칠 더 기다리며 리뷰어를 추가로 모을 수 있어요</span>
                  </div>
                </div>
              </div>
            )
          }

          // ── 케이스 1: 마감일 전 + 미달 — 가장 위험, 재확인 모달 필요 ──
          return (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setConfirmForceEarly(true)}
                className="py-2.5 rounded-xl border-2 border-[#F77019] text-[#F77019] text-[11px] font-black hover:bg-[#F77019]/5 transition-colors"
              >
                모집 마감 전에 조기 시작하기
              </button>
            </div>
          )
        })()}

        {confirmForceEarly && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: 'rgba(29,28,28,0.4)' }}>
            <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#F77019]">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[13px] font-black">정말 지금 시작할까요?</span>
              </div>
              <p className="text-[12px] font-bold text-[#666] leading-relaxed">
                아직 모집 마감일도 안 됐고, 목표한 인원({activeMatches.length}/{targetCount}명)도 다 채우지 못했어요. 지금 시작하면 부족한 인원만큼의 금액을 포함해 이미 결제한 금액은 환불되지 않아요.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmForceEarly(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F5F5] text-[#666] text-[12px] font-black hover:bg-[#EBEBEB] transition-colors"
                >
                  마감일까지 기다릴게요
                </button>
                <button
                  onClick={() => runCloseRecruitment('force_early')}
                  disabled={closing !== null}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12px] font-black hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {closing === 'force_early' ? '처리 중...' : '네, 지금 시작할게요'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 지원 승인/거절은 관리자 전용으로 이전됐다(/admin/applications) —
            크리에이터는 진행 상황만 읽기 전용으로 확인한다. */}
        {pendingMatches.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-[#F77019]">
              지원 검토 중 ({pendingMatches.length}명) — 관리자가 승인/거절을 처리합니다
            </span>
            {pendingMatches.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-xl bg-[#F77019]/5 border border-[#F77019]/20 px-3 py-2"
              >
                <span className="text-[10px] font-bold text-[#666]">{r.nickname ?? '익명 리뷰어'}</span>
                <span className="ml-auto text-[9px] font-black text-[#F77019]">검토 대기</span>
              </div>
            ))}
          </div>
        )}

        {activeMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {activeMatches.map((r) => {
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
        ) : pendingMatches.length === 0 ? (
          <div className="rounded-xl bg-[#F5F5F5] p-3 text-center">
            <p className="text-[10px] font-bold text-[#999]">아직 매칭된 리뷰어가 없습니다</p>
          </div>
        ) : null}

        {allDone ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/builder/reports/${project.id}`)}
              className="flex-1 py-3 rounded-xl bg-[#F77019] text-white text-[12px] font-black flex items-center justify-center gap-1.5 hover:bg-[#e0621a] transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              AI 리포트 보기
            </button>
            <button
              onClick={() => router.push(`/builder/reports/${project.id}/raw`)}
              className="flex-1 py-3 rounded-xl border border-[#1D1C1C]/12 text-[#1D1C1C] text-[12px] font-black flex items-center justify-center gap-1.5 hover:bg-[#F5F5F5] transition-colors"
            >
              <MessageSquareText className="w-4 h-4" />
              리뷰어 의견 보기
            </button>
          </div>
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

      {/* 재무 정보 — 리포트의 Unit Economics 계산에 쓰인다. 등록 마법사에서
          안 채웠거나 나중에 값이 바뀐 경우, 여기서 언제든 입력/수정할 수
          있게 한다(Light는 Unit Economics 자체가 안 나오므로 제외). */}
      {project.project_type !== 'light' && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#666]" />
              <h2 className="text-sm font-black">재무 정보 (선택)</h2>
            </div>
            {!editingFinancials && (
              <button
                onClick={openFinancialsEdit}
                className="text-[10px] font-black text-[#F77019] hover:underline"
              >
                {project.extra_data?.financials ? '수정' : '입력하기'}
              </button>
            )}
          </div>
          <p className="text-[10px] font-bold text-[#999] -mt-2">
            리포트의 Unit Economics(CAC/LTV) 계산에 쓰여요. 안 채우면 그 섹션이 비어있게 나와요.
          </p>

          {editingFinancials ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <NumberField
                  label="예상 판매가(원)"
                  value={financialsForm.expectedPrice}
                  onChange={(v) => setFinancialsForm((f) => ({ ...f, expectedPrice: v }))}
                />
                <NumberField
                  label="예상 원가(원)"
                  value={financialsForm.expectedCost}
                  onChange={(v) => setFinancialsForm((f) => ({ ...f, expectedCost: v }))}
                />
                <NumberField
                  label="월 마케팅 예산(원)"
                  value={financialsForm.marketingBudget}
                  onChange={(v) => setFinancialsForm((f) => ({ ...f, marketingBudget: v }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveFinancials}
                  disabled={savingFinancials}
                  className="px-4 py-2 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] disabled:opacity-60 transition-colors"
                >
                  {savingFinancials ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => setEditingFinancials(false)}
                  className="px-4 py-2 rounded-xl border border-[#1D1C1C]/12 text-[#666] text-[11px] font-black hover:bg-[#F5F5F5] transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : project.extra_data?.financials ? (
            <div className="grid grid-cols-3 gap-3">
              <FinancialStat label="예상 판매가" value={project.extra_data.financials.expectedPrice} />
              <FinancialStat label="예상 원가" value={project.extra_data.financials.expectedCost} />
              <FinancialStat label="월 마케팅 예산" value={project.extra_data.financials.marketingBudget} />
            </div>
          ) : (
            <p className="text-[10px] font-bold text-[#999]">아직 입력하지 않았어요.</p>
          )}
        </div>
      )}

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
          <>
            <button
              onClick={() => router.push(`/builder/reports/${project.id}`)}
              className="flex-1 py-3 rounded-xl bg-[#F77019] text-white text-[12px] font-black flex items-center justify-center gap-2 hover:bg-[#e0621a] transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              AI 리포트 보기
            </button>
            <button
              onClick={() => router.push(`/builder/reports/${project.id}/raw`)}
              className="flex-1 py-3 rounded-xl border border-[#1D1C1C]/12 text-[#1D1C1C] text-[12px] font-black flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
            >
              <MessageSquareText className="w-4 h-4" />
              리뷰어 의견 보기
            </button>
          </>
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

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] font-bold text-[#999]">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="h-10 rounded-xl border border-[#1D1C1C]/12 px-3 text-[12px] font-bold outline-none focus:border-[#F77019]"
      />
    </label>
  )
}

function FinancialStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#F5F5F5] p-3 flex flex-col gap-1">
      <span className="text-[9px] font-bold text-[#999]">{label}</span>
      <span className="text-[12px] font-black text-[#1D1C1C]">{value.toLocaleString('ko-KR')}원</span>
    </div>
  )
}
