'use client'

import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import LightReportView from '@/components/report/LightReportView'
import StandardReportView from '@/components/report/StandardReportView'
import { getDraft, listSubmitted } from '@/components/builder/new-request/storage'
import { type RequestFormData } from '@/components/builder/new-request/types'
import type { ProjectForReport, Review } from '@/lib/ai/prompt'

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
  ai_engine_used?: string
  project_id?: string
}

function makeMockReviews(project: RequestFormData, count: number): Review[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock_reviewer_${i}`,
    answers: project.questions.reduce<Record<string, unknown>>((acc, q) => {
      if (q.type === 'multiple_choice' && q.options?.length) {
        acc[q.id] = q.options[i % q.options.length]
      } else if (q.type === 'likert') {
        acc[q.id] = ((i % 5) + 1).toString()
      } else {
        acc[q.id] = '좋은 아이디어인 것 같습니다. 더 다듬어지면 좋겠어요.'
      }
      return acc
    }, {}),
  }))
}

function makePsfPmf(stage: string): 'psf' | 'pmf' {
  return stage === 'idea' || stage === 'prototype' ? 'psf' : 'pmf'
}

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<RequestFormData | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (proj: RequestFormData) => {
    setLoading(true)
    setError(null)
    try {
      const reviewCount = proj.evaluatorCount || 5
      const reviews = makeMockReviews(proj, reviewCount)
      const psfPmf = makePsfPmf(proj.stage ?? '')

      const projectForReport: ProjectForReport = {
        id: proj.id,
        title: proj.productName || '(제목 없음)',
        project_type: (proj.projectType as 'light' | 'standard') ?? 'standard',
        psf_pmf_type: psfPmf,
        problem: proj.problem,
        solution: proj.ourDifference,
        questions: proj.questions.map((q) => ({ question_text: q.text })),
      }

      const res = await fetch(`/api/ai-report/${proj.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectForReport, reviews }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '리포트 생성 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fromDraft = getDraft(params.id)
    const proj = fromDraft ?? listSubmitted().find((p) => p.id === params.id) ?? null
    setProject(proj)
    if (proj) fetchReport(proj)
    else setLoading(false)
  }, [params.id, fetchReport])

  const isLight = project?.projectType === 'light'
  const psfPmf: 'psf' | 'pmf' = makePsfPmf(project?.stage ?? '')

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
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
              — {project.productName || '(제목 없음)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && report && (
            <button
              onClick={() => project && fetchReport(project)}
              className="flex items-center gap-1.5 text-[10px] font-black text-[#666] hover:text-[#F77019] transition-colors px-2 py-1 rounded-lg hover:bg-[#F77019]/5"
            >
              <RefreshCw className="w-3 h-3" />
              재생성
            </button>
          )}
          {report?.ai_engine_used && (
            <span className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
              {report.ai_engine_used}
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
                  onClick={() => fetchReport(project)}
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
                <StandardReportView
                  data={{
                    psf_score: report.psf_score ?? 0,
                    sean_ellis_pct: report.sean_ellis_pct ?? 0,
                    recommendation: report.recommendation ?? 'pivot',
                    key_insights: report.key_insights ?? [],
                    pattern_analysis: report.pattern_analysis ?? '',
                    benchmark_comment: report.benchmark_comment ?? '',
                    action_plan: report.action_plan ?? [],
                    pivot_scenarios: report.pivot_scenarios ?? [],
                  }}
                  mode={psfPmf}
                />

                {/* Standard 잠금 섹션 (딥 인사이트 업그레이드 유도) */}
                <div className="mt-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10 rounded-3xl" />
                  <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 blur-sm select-none">
                    <h3 className="text-sm font-black mb-4">고급 분석 (미리보기)</h3>
                    <div className="flex flex-col gap-3">
                      {['세그먼트별 반응 차이 분석', '감성 키워드 매핑', '의사결정 장벽 클러스터링'].map((t) => (
                        <div key={t} className="rounded-xl bg-[#F5F5F5] px-4 py-3">
                          <p className="text-[11px] font-bold text-[#666]">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                    <div className="bg-white rounded-2xl shadow-lg px-6 py-5 flex flex-col items-center gap-2 text-center">
                      <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">
                        Deep 분석 잠금
                      </span>
                      <p className="text-sm font-black text-[#1D1C1C]">고급 분석 잠금 해제</p>
                      <p className="text-[11px] font-bold text-[#999]">세그먼트 · 감성 · 장벽 분석 포함</p>
                      <button className="mt-1 px-5 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors">
                        9,900원으로 잠금 해제
                      </button>
                    </div>
                  </div>
                </div>
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
    </div>
  )
}
