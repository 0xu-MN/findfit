'use client'

import { ArrowLeft, BarChart3, Download, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useCallback, useEffect, useRef, useState } from 'react'

import LightReportView from '@/components/report/LightReportView'
import StandardReportView, {
  type QuestionSummaryItem,
  type PanelSummary,
  type DemographicBreakdownItem,
  type ResponseTimeSummary,
  type ReviewerNarrative,
  type StrongestObjection,
  type ThemeFrequencyItem,
  type VerbatimQuote,
} from '@/components/report/StandardReportView'
import ReportPaidSections, { type ReportPaidData } from '@/components/report/ReportPaidSections'
import ExternalInterestCard from '@/components/report/ExternalInterestCard'
import ReportGrowthTools from '@/components/report/ReportGrowthTools'
import { createClient } from '@/lib/supabase/client'
import { useAgentBubble } from '@/components/agent/AgentBubbleContext'

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
  action_plan?: ReportPaidData['action_plan']
  pivot_scenarios?: string[]
  question_summary?: QuestionSummaryItem[]
  panel_summary?: PanelSummary
  demographic_breakdown?: DemographicBreakdownItem[]
  response_time_summary?: ResponseTimeSummary
  reviewer_narratives?: ReviewerNarrative[]
  strongest_objection?: StrongestObjection
  theme_frequency?: ThemeFrequencyItem[]
  verbatim_quotes?: VerbatimQuote[]
  competitor_references?: ReportPaidData['competitor_references']
  market_size?: ReportPaidData['market_size']
  positioning_map?: ReportPaidData['positioning_map']
  unit_economics?: ReportPaidData['unit_economics']
  gtm_strategies?: ReportPaidData['gtm_strategies']
  scaleup_roadmap?: ReportPaidData['scaleup_roadmap']
  confidence_tiers?: ReportPaidData['confidence_tiers']
  sources?: ReportPaidData['sources']
  sean_ellis_segments?: { inTargetPct: number | null; outOfTargetPct: number | null }
  van_westendorp?: {
    too_cheap_median: number | null
    cheap_median: number | null
    expensive_median: number | null
    too_expensive_median: number | null
    acceptable_price_range: [number, number] | null
  } | null
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
  extra_data: { hypothesis?: string } | null
}

function makePsfPmf(stage: string | null): 'psf' | 'pmf' {
  return stage === 'idea' || stage === 'prototype' ? 'psf' : 'pmf'
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const agentBubble = useAgentBubble()
  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [meta, setMeta] = useState<ReportMeta | null>(null)
  const [engine, setEngine] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  // 리포트 확대/축소 — 슬라이더로 80~130% 조절, 본문 전체에 transform
  // scale을 적용한다(폰트만 키우는 게 아니라 레이아웃 전체 배율 조정).
  const [zoom, setZoom] = useState(100)
  // PDF 저장 — 브라우저 인쇄 대화상자(window.print)를 거치지 않고, 리포트
  // 본문 DOM을 캡처해서 진짜 .pdf 파일로 바로 다운로드한다. 헤더/좌측
  // 목차/사이드바는 이 ref 바깥에 있어서 애초에 캡처 대상에 안 들어간다.
  const reportContentRef = useRef<HTMLDivElement>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

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
      .select('id, title, project_type, stage, extra_data')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        setProject((data as ProjectMeta) ?? null)
        if (data) fetchReport(false)
        else setLoading(false)
      })

    // 이미 구매(또는 테스트 기간 waived_test)한 적 있으면 버튼 없이 바로 열람
    supabase
      .from('payments')
      .select('status')
      .eq('project_id', projectId)
      .eq('sku_type', 'deep_report')
      .in('status', ['captured', 'waived_test'])
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setUnlocked(true)
      })
  }, [projectId, fetchReport])

  // 지금 이 리포트가 화면에 떠 있다는 것만 버블에 알려준다 — 버블이 이미
  // 열려 있으면 자동으로 이 리포트 대화로 전환되고(AgentBubbleContext),
  // 닫혀 있으면 다음에 열 때 이 리포트 모드로 시작한다(FloatingAgentBubble).
  useEffect(() => {
    agentBubble.setActiveReportProjectId(projectId)
    return () => agentBubble.setActiveReportProjectId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // 심층 리포트 언락 — ENABLE_PAYMENT_GATE=false(기본값)면 서버가 결제 없이
  // 즉시 통과시키고 payments row만 waived_test로 남긴다.
  const handleUnlock = async () => {
    setUnlocking(true)
    setUnlockError(null)
    try {
      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuType: 'deep_report', amount: 9900, projectId }),
      })
      const body = await res.json()
      if (!res.ok) { setUnlockError(body.error ?? '결제 처리에 실패했습니다'); return }
      setUnlocked(true)
    } finally {
      setUnlocking(false)
    }
  }

  // PDF 저장 — window.print()(브라우저 인쇄 대화상자, 페이지 전체를 찍던
  // 방식)를 완전히 대체한다. 리포트 본문 DOM만 캡처해서 진짜 .pdf 파일로
  // 바로 다운로드한다(헤더/좌측 목차/사이드바는 이 ref 바깥이라 캡처 대상이
  // 아예 아님). 캡처 중엔 확대/축소 배율을 100%로 되돌려서 실제 레이아웃
  // 그대로 찍히게 한다.
  const handleDownloadPdf = async () => {
    if (!reportContentRef.current) return
    setGeneratingPdf(true)
    const prevZoom = zoom
    setZoom(100)
    try {
      await new Promise((resolve) => setTimeout(resolve, 150)) // 배율 리렌더 반영 대기
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
      while (heightLeft > 0) {
        position -= pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }
      pdf.save(`${project?.title || 'findfit-report'}.pdf`)
    } catch (err) {
      console.error('[PDF 저장 실패]', err)
      alert(`PDF 저장에 실패했어요: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setZoom(prevZoom)
      setGeneratingPdf(false)
    }
  }

  const isLight = project?.project_type === 'light'
  const psfPmf: 'psf' | 'pmf' = makePsfPmf(project?.stage ?? null)

  return (
    <div className="min-h-[calc(100vh-80px)] pb-16">
      {/* 상단 바 — 좌측에 리포트 목록이 상시 떠 있으므로(app/builder/reports/layout.tsx)
          뒤로가기는 보조 수단으로만 남겨둔다. 프로젝트 상세로 고정 이동시켜서
          "리뷰어 의견 보기" 페이지와 서로의 뒤로가기를 번갈아 누르며 두 화면
          사이만 왔다갔다 하던 문제를 없앤다(history.back() 대신 명시적 이동). */}
      {/* 인쇄/PDF 저장 시엔 헤더/버튼/목차 다 빼고 리포트 본문만 나오게
          한다 — 예전엔 창을 통째로 인쇄해서 사이드바·버튼까지 다 찍혔다. */}
      <style>{`
        @media print {
          .report-print-hide { display: none !important; }
          .report-zoom-wrapper { transform: none !important; }
          .report-content-col { max-width: 100% !important; }
          .report-print-header { display: flex !important; }
          [id^="report-"] { break-inside: avoid; }
        }
      `}</style>
      <div className="report-print-header hidden print:flex items-center gap-2 px-2 pb-4">
        <BarChart3 className="w-4 h-4 text-[#F77019]" />
        <h1 className="text-sm font-black">{project?.title || 'AI 리포트'}</h1>
        <span className="text-[10px] font-bold text-[#999] ml-auto">{new Date().toLocaleDateString('ko-KR')} 생성</span>
      </div>
      <div className="report-print-hide sticky top-0 z-20 -mx-2 mb-2 bg-[#F7F7F5] px-2 py-4 flex items-center gap-3 border-b border-[#1D1C1C]/8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => router.push(`/builder/projects/${projectId}`)}
          className="p-1.5 rounded-lg hover:bg-white transition-colors text-[#666]"
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
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => router.push(`/builder/reports/${projectId}/raw`)}
            className="text-[10px] font-black text-[#666] hover:text-[#F77019] transition-colors px-2 py-1 rounded-lg hover:bg-[#F77019]/5"
          >
            리뷰어 의견 보기
          </button>
          {!loading && report && (
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex items-center gap-1.5 text-[10px] font-black text-[#666] hover:text-[#F77019] transition-colors px-2 py-1 rounded-lg hover:bg-[#F77019]/5 disabled:opacity-50"
            >
              {generatingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {generatingPdf ? 'PDF 생성 중...' : 'PDF로 저장'}
            </button>
          )}
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

      <div className="flex items-start gap-6 px-6 py-8">
        {/* 목차 — 예전엔 본문 위에 가로로 얹혀 있어서 아래로 스크롤하면
            바로 안 보였다. 왼쪽에 sticky로 고정해서 스크롤 중에도 계속
            보이고, 지금 보고 있는 섹션이 자동으로 강조되게 한다. 확대/축소
            슬라이더도 같은 자리에 둔다(요청: "목차 부분에 위치가 나오게"). */}
        {!loading && !error && report && project && !isLight && (
          <ReportTableOfContents zoom={zoom} onZoomChange={setZoom} />
        )}

        <div className="report-content-col flex-1 min-w-0 flex justify-center">
        <div
          ref={reportContentRef}
          className="report-zoom-wrapper w-full max-w-2xl bg-[#F7F7F5]"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
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
              <>
                {/* 이 프로젝트가 검증하려던 가설 — 등록 시 입력했지만 이번에
                    고치기 전까지 저장만 되고 어디서도 안 보였다. */}
                {project.extra_data?.hypothesis && (
                  <div className="rounded-3xl border border-[#1565C0]/20 bg-[#1565C0]/5 p-6 mb-4">
                    <p className="text-[9px] font-black text-[#1565C0] bg-[#1565C0]/10 inline-block px-2 py-0.5 rounded mb-2">
                      이 프로젝트가 검증하려던 가설
                    </p>
                    <p className="text-[13px] font-bold text-[#1D1C1C] leading-relaxed">{project.extra_data.hypothesis}</p>
                  </div>
                )}
                <LightReportView
                  data={{
                    winner: (report.winner ?? null) as 'A' | 'B' | null,
                    ratio_summary: report.ratio_summary ?? '',
                    key_comments: report.key_comments ?? [],
                    verbatim_quotes: report.verbatim_quotes ?? [],
                    one_line_recommendation: report.one_line_recommendation ?? '',
                  }}
                />
              </>
            ) : (
              <>
                {/* Overview — 가설(등록 시 입력한 검증 목적)과 리뷰어 전체
                    반응을 요약 슬라이드 형태로 리포트 맨 위에 보여준다. */}
                <ReportOverview
                  hypothesis={project.extra_data?.hypothesis ?? null}
                  verdict={meta?.verdict ?? null}
                  problemExistsPct={meta?.problem_exists_pct ?? null}
                  solutionAcceptancePct={meta?.solution_acceptance_pct ?? null}
                  purchaseIntentPct={meta?.purchase_intent_pct ?? null}
                  keyInsight={report.key_insights?.[0] ?? null}
                  benchmarkComment={report.benchmark_comment ?? null}
                />
                <StandardReportView
                  data={{
                    psf_score: report.psf_score ?? 0,
                    sean_ellis_pct: report.sean_ellis_pct ?? 0,
                    recommendation: report.recommendation ?? 'pivot',
                    benchmark_comment: report.benchmark_comment ?? '',
                    key_insights: report.key_insights ?? [],
                    question_summary: report.question_summary ?? [],
                    confidence_tiers: report.confidence_tiers,
                    panel_summary: report.panel_summary,
                    demographic_breakdown: report.demographic_breakdown,
                    response_time_summary: report.response_time_summary,
                    reviewer_narratives: report.reviewer_narratives,
                    strongest_objection: report.strongest_objection,
                    theme_frequency: report.theme_frequency,
                    verbatim_quotes: report.verbatim_quotes,
                    sean_ellis_segments: report.sean_ellis_segments,
                    van_westendorp: report.van_westendorp,
                  }}
                  mode={psfPmf}
                />

                {/* 외부 관심 현황 — 무료 티어, 공유 링크 생성/조회 포함 */}
                <div className="mt-4">
                  <ExternalInterestCard projectId={projectId} />
                </div>

                {/* 유료(고급) 콘텐츠 — 인사이트 2번 이후 전부. 심층 리포트
                    9,900원 SKU. ENABLE_PAYMENT_GATE=false(기본값)면 서버가
                    결제 없이 즉시 통과(payments row는 waived_test로 기록) —
                    게이트를 켜면 실제 PortOne 결제 경로를 탄다. */}
                <div className="mt-4">
                  {!unlocked ? (
                    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col items-center gap-3 text-center">
                      <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">
                        고급 분석
                      </span>
                      <p className="text-sm font-black text-[#1D1C1C]">추가 인사이트 · 시장 규모 · 포지셔닝 · 액션 플랜</p>
                      <p className="text-[11px] font-bold text-[#999]">베타 기간엔 무료로 열람할 수 있어요</p>
                      {unlockError && (
                        <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{unlockError}</p>
                      )}
                      <button
                        onClick={handleUnlock}
                        disabled={unlocking}
                        className="mt-1 px-5 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors disabled:opacity-60"
                      >
                        {unlocking ? '확인 중...' : '베타 기간 무료로 열람'}
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
                        confidence_tiers: report.confidence_tiers,
                        sources: report.sources,
                      }}
                      recommendation={report.recommendation ?? 'pivot'}
                      projectId={projectId}
                      onFinancialsSaved={() => fetchReport(true)}
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
                  onClick={() => {
                    // 예전엔 그냥 /builder/new-request로 보내서, 방금 본
                    // 리포트/프로젝트 맥락은 다 버리고 "어떻게 검증을
                    // 시작할까요?"(Step0Modal)부터 다시 시작해야 했다 —
                    // 이 프로젝트를 이어서 Standard로 심화 검증하고 싶다는
                    // 맥락을 Agent에게 넘겨서, 대화로 다음 단계를 같이
                    // 설계하도록 한다(아이템 탐색 seed와 동일한 메커니즘).
                    agentBubble.openWithSeed(
                      `"${project?.title ?? '이 프로젝트'}"를 Light로 검증해봤는데, 이제 Standard로 더 깊게 검증하고 싶어요. PSF/PMF 점수랑 액션 플랜까지 받아보려면 어떻게 준비하면 좋을까요?`
                    )
                    router.push('/builder/new-request?skipIntro=1')
                  }}
                  className="self-start px-4 py-2 rounded-xl bg-[#1565C0] text-white text-[11px] font-black hover:bg-[#1255a3] transition-colors"
                >
                  Standard 검증 시작하기
                </button>
              </div>
            )}
          </>
        )}
        </div>
        </div>
      </div>

      {/* AI 생성 리포트 안내 — 상태와 무관하게 항상 고정 노출 */}
      <p className="max-w-2xl mx-auto px-6 text-[10px] font-medium text-[#BBB] text-center leading-relaxed">
        이 리포트는 AI가 리뷰어 응답 데이터를 바탕으로 자동 생성한 분석입니다. 실제 의사결정 전 참고용으로 활용해주세요.
      </p>
    </div>
  )
}

const VERDICT_META: Record<'GO' | 'CAUTION' | 'RECONSIDER', { headline: string; color: string }> = {
  GO: { headline: '이대로 진행해도 좋다', color: '#15803D' },
  CAUTION: { headline: '방향을 조금 점검해봐야 한다', color: '#B45309' },
  RECONSIDER: { headline: '다시 검토가 필요하다', color: '#B91C1C' },
}

// 리포트 맨 위 요약 슬라이드 — 등록할 때 적은 가설(무엇을 확인하려 했는지)과
// 리뷰어들의 종합 반응을 한 화면에 담는다. PSF 서브스코어 3종(ai_reports
// 최상위 컬럼)을 미니 도넛으로, 핵심 인사이트/벤치마크 코멘트를 하단 배너로.
function ReportOverview({
  hypothesis,
  verdict,
  problemExistsPct,
  solutionAcceptancePct,
  purchaseIntentPct,
  keyInsight,
  benchmarkComment,
}: {
  hypothesis: string | null
  verdict: 'GO' | 'CAUTION' | 'RECONSIDER' | null
  problemExistsPct: number | null
  solutionAcceptancePct: number | null
  purchaseIntentPct: number | null
  keyInsight: string | null
  benchmarkComment: string | null
}) {
  const meta = verdict ? VERDICT_META[verdict] : null
  const subscores = [
    { label: '문제 공감도', value: problemExistsPct },
    { label: '솔루션 수용도', value: solutionAcceptancePct },
    { label: '구매 의향', value: purchaseIntentPct },
  ]

  return (
    <div id="report-overview" className="rounded-3xl bg-[#FFF7F0] border border-[#F77019]/15 p-8 mb-4 flex flex-col gap-6">
      <div className="text-center flex flex-col items-center gap-3">
        <span className="text-[10px] font-black text-[#F77019] bg-white px-3 py-1 rounded-full tracking-widest">
          OVERVIEW
        </span>
        <h2 className="text-lg sm:text-xl font-black text-[#1D1C1C] leading-snug">
          리뷰어들은{' '}
          <span style={{ color: meta?.color ?? '#F77019' }}>
            &ldquo;{meta?.headline ?? '검증이 진행 중이다'}&rdquo;
          </span>
          {' '}라고 답했어요
        </h2>
        <p className="text-[12px] font-medium text-[#666] leading-relaxed max-w-xl">
          {hypothesis
            ? `이 프로젝트는 "${hypothesis}"를 확인하기 위해 등록됐고, 실제 리뷰어들의 반응을 모아봤어요.`
            : '이 프로젝트가 등록될 때 세운 가설을 바탕으로, 실제 리뷰어들의 반응을 모아봤어요.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {subscores.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] font-bold text-[#999]">{s.label}</span>
            <OverviewDonut pct={s.value} />
          </div>
        ))}
      </div>

      {(keyInsight || benchmarkComment) && (
        <div className="rounded-2xl px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }}>
          <p className="text-[9px] font-black text-white/80 tracking-widest mb-1.5">KEY INSIGHT</p>
          <p className="text-[13px] font-bold text-white leading-relaxed">{keyInsight ?? benchmarkComment}</p>
        </div>
      )}
    </div>
  )
}

function OverviewDonut({ pct }: { pct: number | null }) {
  const value = pct ?? 0
  const r = 28
  const circumference = 2 * Math.PI * r
  const dash = (value / 100) * circumference
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#F5F5F5" strokeWidth="8" />
        {pct !== null && (
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="#F77019"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        )}
      </svg>
      <span className="absolute text-[13px] font-black text-[#1D1C1C]">{pct !== null ? `${pct}%` : '—'}</span>
    </div>
  )
}

const TOC_SECTIONS: { id: string; label: string }[] = [
  { id: 'report-overview', label: 'Overview' },
  { id: 'report-score', label: '점수/판정' },
  { id: 'report-question-summary', label: '문항별 응답' },
  { id: 'report-demographic-breakdown', label: '성별 응답 차이' },
  { id: 'report-key-insights', label: '핵심 인사이트' },
  { id: 'report-panel-profile', label: '참여 패널' },
  { id: 'report-reviewer-narratives', label: '리뷰어별 의견' },
  { id: 'report-themes', label: '반복 주제' },
  { id: 'report-quotes', label: '원문 인용' },
  { id: 'report-more-insights', label: '추가 인사이트' },
  { id: 'report-action-plan', label: '액션 플랜' },
  { id: 'report-pivot', label: '성장/피봇' },
  { id: 'report-market-size', label: '시장 규모' },
  { id: 'report-positioning', label: '포지셔닝' },
  { id: 'report-unit-economics', label: 'Unit Economics' },
  { id: 'report-references', label: '참고 레퍼런스' },
]

// 리포트가 길어지면 원하는 섹션을 스크롤로 찾기 어려워서 추가 — 실제로
// 렌더 안 된 섹션의 링크를 눌러도 해당 id가 DOM에 없어 그냥 무시된다
// (에러 없이 조용히 아무 일도 안 일어남).
//
// 예전엔 본문 위에 가로 알약 목록으로 얹혀 있어서 스크롤해서 내려가면
// 안 보였다 — 왼쪽에 sticky로 고정해서 스크롤 중에도 계속 보이게 하고,
// IntersectionObserver로 지금 보고 있는 섹션을 자동으로 강조한다. 확대/
// 축소 슬라이더도 같은 자리(요청: "목차 부분에 위치가 나오게")에 둔다.
function ReportTableOfContents({ zoom, onZoomChange }: { zoom: number; onZoomChange: (z: number) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    const els = TOC_SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="print:hidden hidden lg:flex flex-col gap-4 w-[180px] flex-shrink-0 sticky top-24 max-h-[calc(100vh-120px)]">
      <div className="flex flex-col gap-1 pr-1 overflow-y-auto">
        <span className="text-[10px] font-black text-[#999] px-2 mb-1">목차</span>
        {TOC_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors truncate ${
              activeId === s.id ? 'text-[#F77019] bg-[#F77019]/10' : 'text-[#666] hover:text-[#F77019] hover:bg-[#F77019]/5'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="border-t border-[#1D1C1C]/8 pt-3 px-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#999]">화면 크기</span>
          <span className="text-[10px] font-bold text-[#666]">{zoom}%</span>
        </div>
        <input
          type="range"
          min={80}
          max={130}
          step={10}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-full accent-[#F77019]"
        />
      </div>
    </div>
  )
}
