'use client'

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { getDraft, listSubmitted } from './new-request/storage'
import {
  PROJECT_TYPE_OPTIONS,
  STAGE_OPTIONS,
  calculateCost,
  type RequestFormData,
} from './new-request/types'

function fmtWon(n: number) {
  return n.toLocaleString('ko-KR')
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return '방금 전'
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

const MOCK_REVIEWERS = [
  { nickname: 'Reviewer_A', status: 'completed' },
  { nickname: 'Reviewer_B', status: 'completed' },
  { nickname: 'Reviewer_C', status: 'reviewing' },
  { nickname: 'Reviewer_D', status: 'invited' },
  { nickname: 'Reviewer_E', status: 'invited' },
]

interface Props {
  projectId: string
}

export default function ProjectDetailPage({ projectId }: Props) {
  const router = useRouter()
  const [project, setProject] = useState<RequestFormData | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const fromDraft = getDraft(projectId)
    if (fromDraft) {
      setProject(fromDraft)
      setHydrated(true)
      return
    }
    const submitted = listSubmitted().find((p) => p.id === projectId)
    if (submitted) setProject(submitted)
    setHydrated(true)
  }, [projectId])

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

  const typeMeta = PROJECT_TYPE_OPTIONS.find((o) => o.value === project.projectType)
  const typeColor = project.projectType === 'light' ? '#F77019' : '#1565C0'
  const stageMeta = STAGE_OPTIONS.find((s) => s.value === project.stage)
  const cost = calculateCost(project)
  const isSubmitted = project.status === 'submitted'

  const reviewers = isSubmitted ? MOCK_REVIEWERS.slice(0, project.evaluatorCount || 5) : []
  const completedCount = reviewers.filter((r) => r.status === 'completed').length
  const progressPct = reviewers.length > 0 ? Math.round((completedCount / reviewers.length) * 100) : 0
  const allDone = isSubmitted && completedCount >= reviewers.length && reviewers.length > 0

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
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded ml-auto ${
                isSubmitted
                  ? allDone
                    ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                    : 'bg-[#F77019]/10 text-[#F77019]'
                  : 'bg-[#F5F5F5] text-[#999]'
              }`}
            >
              {isSubmitted ? (allDone ? '분석 완료' : '리뷰 진행 중') : '작성 중'}
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight">
            {project.productName || '(제목 미작성)'}
          </h1>
          {project.oneLineDesc && (
            <p className="text-sm text-[#666] font-medium">{project.oneLineDesc}</p>
          )}
          <p className="text-[10px] text-[#999] font-bold">
            {relativeTime(project.updatedAt)} · {stageMeta?.title ?? project.stage}
          </p>
        </div>
      </div>

      {/* 리뷰어 진행 현황 */}
      {isSubmitted && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F77019]" />
              <h2 className="text-sm font-black">리뷰어 진행 현황</h2>
            </div>
            <span className="text-[11px] font-black text-[#F77019]">
              {completedCount} / {reviewers.length}명 완료
            </span>
          </div>

          <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F77019] rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {reviewers.map((r) => (
              <div
                key={r.nickname}
                className="flex items-center gap-2 rounded-xl bg-[#F5F5F5] px-3 py-2"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    r.status === 'completed'
                      ? 'bg-[#2E7D32]'
                      : r.status === 'reviewing'
                      ? 'bg-[#F77019]'
                      : 'bg-[#CCC]'
                  }`}
                />
                <span className="text-[10px] font-bold text-[#666]">{r.nickname}</span>
                <span className="text-[9px] font-bold text-[#999] ml-auto">
                  {r.status === 'completed' ? '완료' : r.status === 'reviewing' ? '진행 중' : '대기'}
                </span>
              </div>
            ))}
          </div>

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
                ⏳ 모든 리뷰어 평가 완료 후 AI 리포트가 자동 생성됩니다
              </p>
            </div>
          )}
        </div>
      )}

      {/* 비용 요약 */}
      {isSubmitted && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-black mb-4">비용 요약</h2>
          <div className="flex flex-col gap-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#666] font-bold">캐시 차감</span>
              <span className="font-black">{fmtWon(cost.cashCost)}C</span>
            </div>
            {project.projectType !== 'light' && cost.preAuthAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#666] font-bold">사례금 사전 승인 ({project.evaluatorCount}명)</span>
                  <span className="font-black">{fmtWon(cost.preAuthAmount)}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666] font-bold">플랫폼 수수료 (15%)</span>
                  <span className="font-black">{fmtWon(cost.platformCommissionTotal)}원</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t border-[#1D1C1C]/5 mt-1">
              <span className="font-black">캐시 총 소모</span>
              <span className="font-black text-[#F77019] text-sm">{fmtWon(cost.cashCost)}C</span>
            </div>
          </div>
        </div>
      )}

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
        {project.alternativeAndLimit && (
          <InfoField label="기존 대안과 한계">
            <p className="text-[11px] font-bold text-[#666] leading-relaxed">{project.alternativeAndLimit}</p>
          </InfoField>
        )}
        {project.ourDifference && (
          <InfoField label="차별점">
            <p className="text-[11px] font-bold text-[#666] leading-relaxed">{project.ourDifference}</p>
          </InfoField>
        )}

        {(project.ageGroups.length > 0 || project.occupations.length > 0 || project.jobRoles.length > 0) && (
          <InfoField label="타겟 고객">
            <div className="flex flex-wrap gap-1.5">
              {project.ageGroups.map((a) => (
                <span
                  key={a}
                  className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1565C0]/10 text-[#1565C0] border border-[#1565C0]/20"
                >
                  {a}
                </span>
              ))}
              {project.occupations.map((o) => (
                <span
                  key={o}
                  className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#666] border border-[#1D1C1C]/10"
                >
                  {o}
                </span>
              ))}
              {project.jobRoles.map((j) => (
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
      {project.questions.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-[#666]" />
            <h2 className="text-sm font-black">검증 질문 ({project.questions.length}개)</h2>
          </div>
          <div className="flex flex-col gap-3">
            {project.questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3">
                <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                  Q{i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-bold text-[#1D1C1C]">{q.text}</p>
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
        {!isSubmitted && (
          <button
            onClick={() => router.push(`/builder/new-request?draftId=${project.id}`)}
            className="flex-1 py-3 rounded-xl bg-[#1D1C1C] text-white text-[12px] font-black flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
          >
            이어서 작성하기
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {isSubmitted && allDone && (
          <button
            onClick={() => router.push(`/builder/reports/${project.id}`)}
            className="flex-1 py-3 rounded-xl bg-[#F77019] text-white text-[12px] font-black flex items-center justify-center gap-2 hover:bg-[#e0621a] transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            AI 리포트 보기
          </button>
        )}
        {isSubmitted && !allDone && (
          <div className="flex-1 flex items-center gap-2 py-3 rounded-xl bg-[#F5F5F5] px-4">
            <Clock className="w-4 h-4 text-[#999]" />
            <span className="text-[11px] font-bold text-[#999]">리뷰어 평가 진행 중...</span>
            <CheckCircle2 className="w-4 h-4 text-[#F77019] ml-auto" />
            <span className="text-[11px] font-black text-[#F77019]">{completedCount}/{reviewers.length}</span>
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
