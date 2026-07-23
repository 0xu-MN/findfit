'use client'

import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useCallback, useEffect, useState } from 'react'

import LightReportView from '@/components/report/LightReportView'
import StandardReportView, { type QuestionSummaryItem } from '@/components/report/StandardReportView'
import ReportPaidSections, { type ReportPaidData } from '@/components/report/ReportPaidSections'
import ExternalInterestCard from '@/components/report/ExternalInterestCard'
import ReportGrowthTools from '@/components/report/ReportGrowthTools'
import { createClient } from '@/lib/supabase/client'

type ReportData = {
  winner?: 'A' | 'B' | null
  ratio_summary?: string
  key_comments?: string[]
  one_line_recommendation?: string
  psf_score?: number
  sean_ellis_pct?: number
  recommendation?: 'continue' | 'pivot' | 'stop'
  key_insights?: string[]
  pattern_analysis?: string
  benchmark_comment?: string
  action_plan?: string[]
  pivot_scenarios?: string[]
  question_summary?: QuestionSummaryItem[]
  competitor_references?: ReportPaidData['competitor_references']
  market_size?: ReportPaidData['market_size']
  positioning_map?: ReportPaidData['positioning_map']
  unit_economics?: ReportPaidData['unit_economics']
  gtm_strategies?: ReportPaidData['gtm_strategies']
  scaleup_roadmap?: ReportPaidData['scaleup_roadmap']
}

// ai_reports 테이블의 최상위 컬럼(PSF 서브스코어 + verdict) — report_data
// JSONB와 별도로 저장되어 있어 따로 들고 온다 (lib/ai/generateReport.ts)
type ReportMeta = {
  verdict: 'GO' | 'CAUTION' | 'RECONSIDER' | null
  problem_exists_pct: number | null
  solution_acceptance_pct: number | null
  purchase_intent_pct: number | null
}

type ProjectMeta = {
  id: string
  title: string
  project_type: string | null
  stage: string | null
}

function makePsfPmf(stage: string | null): 'psf' | 'pmf' {
  return stage === 'idea' || stage === 'prototype' ? 'psf' : 'pmf'
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [meta, setMeta] = useState<ReportMeta | null>(null)
  const [engine, setEngine] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)

  // 저장된 ai_reports를 조회하고, 없으면 서버에서 생성(POST)한다.
  const fetchReport = useCallback(async (regenerate = false) => {
    setLoading(true)
    setError(null)
    try {
      // 1) 기존 리포트 조회 (재생성이 아니면)
      if (!regenerate) {
        const getRes = await fetch(`/api/ai-report/${projectId}`, { method: 'GET' })
        if (getRes.ok) {
          const { report: existing } = await getRes.json()
          if (existing) {
            setReport((existing.report_data ?? {}) as ReportData)
            setMeta(existing as ReportMeta)
            setEngine(existing.ai_engine_used ?? null)
            setLoading(false)
            return
          }
        }
      }
      // 2) 없거나 재생성 요청이면 생성
      const res = await fetch(`/api/ai-report/${projectId}`, { method: 'POST' })
      if (!res.ok) throw new Error(`리포트 생성 실패 (${res.status})`)
      const { report: saved } = await res.json()
      setReport((saved?.report_data ?? {}) as ReportData)
      setMeta((saved ?? null) as ReportMeta | null)
      setEngine(saved?.ai_engine_used ?? null)
      setUnlocked(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '리포트 생성 실패')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('projects')
      .select('id, title, project_type, stage')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        setProject((data as ProjectMeta) ?? null)
        if (data) fetchReport(false)
        else setLoading(false)
      })
  }, [projectId, fetchReport])

  const isLight = project?.project_type === 'light'
  const psfPmf: 'psf' | 'pmf' = makePsfPmf(project?.stage ?? null)

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-16">
      {/* 상단 바 */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#666]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="w-4 h-4 text-[#F77019]" />
          <h1 className="text-sm font-black">AI 리포트</h1>
          {project && (
            <span className="text-[10px] font-bold text-[#999] truncate max-w-[200px]">
              — {project.title || '(제목 없음)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && report && (
            <button
              onClick={() => fetchReport(true)}
              className="flex items-center gap-1.5 text-[10px] font-black text-[#666] hover:text-[#F77019] transition-colors px-2 py-1 rounded-lg hover:bg-[#F77019]/5"
            >
              <RefreshCw className="w-3 h-3" />
              재생성
            </button>
          )}
          {engine && (
            <span className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
              {engine}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#F77019]/20" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-[#F77019] border-t-transparent animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-black text-[#1D1C1C]">AI 리포트 생성 중...</p>
              <p className="text-[11px] font-bold text-[#999]">리뷰 데이터를 분석하고 있어요</p>
            </div>
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center max-w-sm">
              <p className="text-sm font-black text-red-700 mb-2">리포트 생성 실패</p>
              <p className="text-[11px] font-bold text-red-500 mb-4">{error}</p>
              {project && (
                <button
                  onClick={() => fetchReport(true)}
                  className="text-[11px] font-black text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                >
                  다시 시도
                </button>
              )}
            </div>
          </div>
        )}

        {/* 프로젝트 없음 */}
        {!loading && !error && !project && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-sm font-black text-[#999]">프로젝트를 찾을 수 없습니다</p>
            <button
              onClick={() => router.push('/builder/projects')}
              className="text-[11px] font-black text-[#F77019] hover:underline"
            >
              프로젝트 목록으로
            </button>
          </div>
        )}

        {/* 리포트 렌더 */}
        {!loading && !error && report && project && (
          <>
            {/* 메타 뱃지 */}
            <div className="flex items-center gap-2 mb-6">
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded text-white"
                style={{ background: isLight ? '#F77019' : '#1565C0' }}
              >
                {isLight ? 'Light' : 'Standard'}
              </span>
              {!isLight && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[#1D1C1C]/5 text-[#666]">
                  {psfPmf === 'psf' ? 'PSF 검증' : 'PMF 검증'}
                </span>
              )}
              <span className="text-[10px] font-bold text-[#999] ml-auto">
                {new Date().toLocaleDateString('ko-KR')} 생성
              </span>
            </div>

            {isLight ? (
              <LightReportView
                data={{
                  winner: (report.winner ?? null) as 'A' | 'B' | null,
                  ratio_summary: report.ratio_summary ?? '',
                  key_comments: report.key_comments ?? [],
                  one_line_recommendation: report.one_line_recommendation ?? '',
                }}
              />
            ) : (
              <>
                {meta?.verdict && (
                  <VerdictBanner
                    verdict={meta.verdict}
                    problemExistsPct={meta.problem_exists_pct}
                    solutionAcceptancePct={meta.solution_acceptance_pct}
                    purchaseIntentPct={meta.purchase_intent_pct}
                  />
                )}
                <StandardReportView
                  data={{
                    psf_score: report.psf_score ?? 0,
                    sean_ellis_pct: report.sean_ellis_pct ?? 0,
                    recommendation: report.recommendation ?? 'pivot',
                    benchmark_comment: report.benchmark_comment ?? '',
                    key_insights: report.key_insights ?? [],
                    question_summary: report.question_summary ?? [],
                  }}
                  mode={psfPmf}
                />

                {/* 외부 관심 현황 — 무료 티어, 공유 링크 생성/조회 포함 */}
                <div className="mt-4">
                  <ExternalInterestCard projectId={projectId} />
                </div>

                {/* 유료(고급) 콘텐츠 — 인사이트 2번 이후 전부.
                    베타 기간엔 무료로 열람 가능. 정식 출시 후 PortOne 결제
                    연동이 붙으면 이 버튼 문구("베타 기간 무료로 열람")와
                    잠금 게이트를 유료 결제 방식으로 되돌릴 것. */}
                <div className="mt-4">
                  {!unlocked ? (
                    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col items-center gap-3 text-center">
                      <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">
                        고급 분석
                      </span>
                      <p className="text-sm font-black text-[#1D1C1C]">추가 인사이트 · 시장 규모 · 포지셔닝 · 액션 플랜</p>
                      <p className="text-[11px] font-bold text-[#999]">베타 기간엔 무료로 열람할 수 있어요</p>
                      <button
                        onClick={() => setUnlocked(true)}
                        className="mt-1 px-5 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors"
                      >
                        베타 기간 무료로 열람
                      </button>
                    </div>
                  ) : (
                    <ReportPaidSections
                      data={{
                        key_insights: report.key_insights ?? [],
                        action_plan: report.action_plan ?? [],
                        pivot_scenarios: report.pivot_scenarios ?? [],
                        competitor_references: report.competitor_references ?? [],
                        market_size: report.market_size as ReportPaidData['market_size'],
                        positioning_map: report.positioning_map as ReportPaidData['positioning_map'],
                        unit_economics: report.unit_economics ?? null,
                        gtm_strategies: report.gtm_strategies ?? null,
                        scaleup_roadmap: report.scaleup_roadmap ?? null,
                      }}
                      recommendation={report.recommendation ?? 'pivot'}
                    />
                  )}
                </div>

                {unlocked && (
                  <div className="mt-4">
                    <ReportGrowthTools projectId={projectId} />
                  </div>
                )}
              </>
            )}

            {/* Light → Standard 업셀 */}
            {isLight && (
              <div className="mt-4 rounded-3xl border border-[#1565C0]/20 bg-[#1565C0]/5 p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#1565C0] bg-[#1565C0]/10 px-2 py-0.5 rounded">업그레이드</span>
                  <h3 className="text-sm font-black text-[#1565C0]">더 깊은 인사이트가 필요하신가요?</h3>
                </div>
                <p className="text-[11px] font-bold text-[#666]">
                  Standard 검증으로 전환하면 PSF/PMF 점수, 핵심 인사이트, 액션 플랜까지 받을 수 있어요.
                </p>
                <button
                  onClick={() => router.push('/builder/new-request')}
                  className="self-start px-4 py-2 rounded-xl bg-[#1565C0] text-white text-[11px] font-black hover:bg-[#1255a3] transition-colors"
                >
                  Standard 검증 시작하기
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI 생성 리포트 안내 — 상태와 무관하게 항상 고정 노출 */}
      <p className="max-w-2xl mx-auto px-6 text-[10px] font-medium text-[#BBB] text-center leading-relaxed">
        이 리포트는 AI가 리뷰어 응답 데이터를 바탕으로 자동 생성한 분석입니다. 실제 의사결정 전 참고용으로 활용해주세요.
      </p>
    </div>
  )
}

const VERDICT_META: Record<'GO' | 'CAUTION' | 'RECONSIDER', { label: string; color: string; bg: string; border: string }> = {
  GO: { label: 'GO — 계속 진행하세요', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  CAUTION: { label: 'CAUTION — 방향을 점검해보세요', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  RECONSIDER: { label: 'RECONSIDER — 재검토가 필요해요', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
}

// PSF 서브스코어 3종 + 최종 판정 — ai_reports 최상위 컬럼(report_data 밖)이라
// 별도로 렌더링한다.
function VerdictBanner({
  verdict,
  problemExistsPct,
  solutionAcceptancePct,
  purchaseIntentPct,
}: {
  verdict: 'GO' | 'CAUTION' | 'RECONSIDER'
  problemExistsPct: number | null
  solutionAcceptancePct: number | null
  purchaseIntentPct: number | null
}) {
  const meta = VERDICT_META[verdict]
  const subscores = [
    { label: '문제 공감도', value: problemExistsPct },
    { label: '솔루션 수용도', value: solutionAcceptancePct },
    { label: '구매 의향', value: purchaseIntentPct },
  ]

  return (
    <div
      className="rounded-3xl border p-6 mb-4 flex flex-col gap-4"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-white px-2.5 py-1 rounded-full" style={{ background: meta.color }}>
          FindFit 판정
        </span>
        <span className="text-base font-black" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {subscores.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/70 px-3 py-2.5 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-[#666]">{s.label}</span>
            <span className="text-lg font-black" style={{ color: meta.color }}>
              {s.value ?? '—'}
              {s.value !== null && '%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
