'use client'

import { Briefcase, Clock, Coins, Sparkles, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { listSubmitted } from '@/components/builder/new-request/storage'
import {
  PROJECT_TYPE_OPTIONS,
  REVIEWER_COMMISSION_RATE,
  TARGET_REVIEWER_ROLES,
  calculateCost,
  calculateDeepDeadline,
  type RequestFormData,
} from '@/components/builder/new-request/types'

function fmt(n: number): string {
  return n.toLocaleString('ko-KR')
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return '오늘 등록'
  if (days === 1) return '어제 등록'
  if (days < 7) return `${days}일 전 등록`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function ReviewerFeedPage() {
  // 추후 Supabase: reviewer_profiles.job_title에서 로드
  const [myRole, setMyRole] = useState<string>('PM')
  const [hydrated, setHydrated] = useState(false)
  const [submitted, setSubmitted] = useState<RequestFormData[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'light' | 'standard' | 'deep'>('all')

  useEffect(() => {
    setSubmitted(listSubmitted())
    setHydrated(true)
  }, [])

  const filtered = useMemo(
    () => (typeFilter === 'all' ? submitted : submitted.filter((p) => p.projectType === typeFilter)),
    [submitted, typeFilter],
  )

  const recommended = useMemo(
    () => filtered.filter((p) => p.targetReviewerRoles.includes(myRole)),
    [filtered, myRole],
  )

  const others = useMemo(
    () => filtered.filter((p) => !p.targetReviewerRoles.includes(myRole)),
    [filtered, myRole],
  )

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black">참여 가능 의뢰</h1>
          <p className="text-[11px] text-[#666] font-medium">
            내 직군에 매칭된 추천 의뢰부터 확인하세요 — 사례금은 수수료 {Math.round(REVIEWER_COMMISSION_RATE * 100)}% 차감 후 실수령액으로 표시됩니다.
          </p>
        </div>

        {/* 내 직군 표시 + 변경 (Demo: 추후 reviewer_profiles에서 로드) */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#1565C0]/15 bg-[#1565C0]/5">
          <Briefcase className="w-3.5 h-3.5 text-[#1565C0]" />
          <span className="text-[10px] font-bold text-[#666]">내 직군</span>
          <select
            value={myRole}
            onChange={(e) => setMyRole(e.target.value)}
            className="bg-transparent text-[12px] font-black text-[#1565C0] outline-none cursor-pointer"
          >
            {TARGET_REVIEWER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
        <FilterPill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
          전체
        </FilterPill>
        {PROJECT_TYPE_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.value}
            active={typeFilter === opt.value}
            onClick={() => setTypeFilter(opt.value)}
          >
            {opt.title}
          </FilterPill>
        ))}
      </div>

      {!hydrated ? (
        <div className="h-64 rounded-3xl bg-white animate-pulse" />
      ) : (
        <>
          {/* 추천 섹션 — 내 직군 매칭 */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F77019]" />
                <h2 className="text-sm font-black">
                  내 직군 추천 <span className="text-[#999] text-xs font-bold">· {myRole}</span>
                </h2>
                <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-full">
                  {recommended.length}건
                </span>
              </div>
            </div>

            {recommended.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] p-8 text-center">
                <p className="text-[11px] font-bold text-[#999]">현재 {myRole} 직군에 매칭된 의뢰가 없습니다</p>
                <p className="text-[10px] font-medium text-[#CCC] mt-1">아래 전체 의뢰에서 다른 프로젝트도 확인해보세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recommended.map((p) => (
                  <ProjectCard key={p.id} project={p} recommended />
                ))}
              </div>
            )}
          </section>

          {/* 전체 섹션 */}
          {others.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#666]" />
                <h2 className="text-sm font-black">전체 의뢰</h2>
                <span className="text-[10px] font-bold text-[#999] bg-[#F5F5F5] px-2 py-0.5 rounded-full">
                  {others.length}건
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {others.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {submitted.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] p-12 text-center flex flex-col gap-2">
              <p className="text-sm font-black text-[#999]">아직 참여 가능한 의뢰가 없습니다</p>
              <p className="text-[11px] font-medium text-[#CCC]">크리에이터들이 의뢰를 등록하면 여기에 표시됩니다</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-8 rounded-full transition-colors ${
        active ? 'bg-[#1D1C1C] text-white' : 'bg-white border border-[#1D1C1C]/10 text-[#666] hover:border-[#1D1C1C]/30'
      }`}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────── */

function ProjectCard({ project, recommended }: { project: RequestFormData; recommended?: boolean }) {
  const cost = calculateCost(project)
  const typeMeta = PROJECT_TYPE_OPTIONS.find((o) => o.value === project.projectType)

  // Deep — 체험기간 + 평가 작성 기간 분할 표시
  const deepBd =
    project.projectType === 'deep'
      ? calculateDeepDeadline(project.experienceDeadline, project.deadlineDays)
      : null

  return (
    <article
      className={`relative rounded-2xl border bg-white p-5 flex flex-col gap-3 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${
        recommended ? 'border-[#F77019]/30 bg-[#FFF8F2]' : 'border-[#1D1C1C]/5'
      }`}
    >
      {recommended && (
        <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-[#F77019] text-white text-[9px] font-black flex items-center gap-1 shadow-sm">
          <Sparkles className="w-2.5 h-2.5" /> 내 직군 추천
        </span>
      )}

      {/* 상단 메타 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white"
          style={{
            background:
              project.projectType === 'light'
                ? '#1CAE66'
                : project.projectType === 'standard'
                  ? '#1565C0'
                  : '#F77019',
          }}
        >
          {typeMeta?.title ?? '?'}
        </span>
        {project.categories.slice(0, 2).map((c) => (
          <span key={c} className="text-[9px] font-bold text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">
            {c}
          </span>
        ))}
        <span className="text-[9px] text-[#999] font-medium ml-auto">{relativeDate(project.updatedAt)}</span>
      </div>

      {/* 한 줄 소개 */}
      <h3 className="text-[14px] font-black text-[#1D1C1C] leading-snug line-clamp-2 min-h-[2.6em]">
        &ldquo;{project.oneLineDesc || '(제목 미작성)'}&rdquo;
      </h3>

      {/* 사례금 + 기간 */}
      <div className="flex items-center justify-between gap-4 py-2 border-y border-[#1D1C1C]/5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#999] font-bold">실 수령액</span>
          {project.projectType === 'light' ? (
            <span className="text-[12px] font-black text-[#1D1C1C]">EXP 적립</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <Coins className="w-3 h-3 text-[#F77019]" />
              <span className="text-[13px] font-black text-[#F77019]">
                {fmt(cost.reviewerNetPerPerson)}원
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-[9px] text-[#999] font-bold">기한</span>
          {deepBd ? (
            <span className="text-[11px] font-bold text-[#1D1C1C]">
              체험 {deepBd.experienceDays}일 + 평가 {deepBd.reviewWritingDays}일
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#666]" />
              <span className="text-[11px] font-bold text-[#1D1C1C]">최대 {project.deadlineDays}일</span>
            </div>
          )}
        </div>
      </div>

      {/* 모집 진행률 — 추후 Supabase match count 연동 */}
      {project.projectType !== 'light' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-[#666]">
            <span>참여 모집</span>
            <span className="text-[#F77019]">0 / {project.evaluatorCount}명</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
            <div className="h-full rounded-full bg-[#F77019]" style={{ width: '0%' }} />
          </div>
        </div>
      )}

      {/* 타겟 직군 */}
      {project.targetReviewerRoles.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.targetReviewerRoles.slice(0, 4).map((r) => (
            <span
              key={r}
              className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1565C0]/10 text-[#1565C0] border border-[#1565C0]/20"
            >
              {r}
            </span>
          ))}
          {project.targetReviewerRoles.length > 4 && (
            <span className="text-[9px] font-bold text-[#999]">+{project.targetReviewerRoles.length - 4}</span>
          )}
        </div>
      )}

      {/* 액션 */}
      <button
        type="button"
        className="w-full py-2.5 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:bg-[#F77019] transition-colors mt-1"
      >
        참여하기
      </button>
    </article>
  )
}
