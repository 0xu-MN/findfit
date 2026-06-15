'use client'

import DeepReportView from '@/components/report/DeepReportView'
import LightReportView from '@/components/report/LightReportView'
import StandardReportView from '@/components/report/StandardReportView'
import { createClient } from '@/lib/supabase/client'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

type AiReport = {
  id: string
  report_type: 'light' | 'standard' | 'deep'
  ai_engine_used: 'gemini' | 'claude'
  psf_score: number | null
  sean_ellis_pct: number | null
  recommendation: string | null
  report_data: Record<string, unknown>
  is_unlocked: boolean
  created_at: string
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<AiReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase: any = createClient()
      const { data } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('project_id', params.id)
        .single()
      setReport(data)
      setLoading(false)
    }
    fetch()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-[11px] font-bold text-[#999]">리포트 불러오는 중...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-[11px] font-bold text-[#999]">리포트를 찾을 수 없습니다</p>
      </div>
    )
  }

  const mode = (report.psf_score !== null || report.sean_ellis_pct !== null) ? 'pmf' : 'psf'

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">
              AI 리포트
            </span>
            <span className="text-[9px] font-bold text-[#999]">
              {report.ai_engine_used === 'claude' ? 'Claude' : 'Gemini'} 분석
            </span>
          </div>
          <h1 className="text-xl font-black">분석 결과</h1>
          <p className="text-[11px] text-[#999] font-bold mt-1">
            {new Date(report.created_at).toLocaleDateString('ko-KR')} 생성
          </p>
        </div>

        {/* 잠금 상태: Seed/Sprout 레벨 */}
        {!report.is_unlocked ? (
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none">
              <ReportContent report={report} mode={mode as 'psf' | 'pmf'} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-3xl">
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#1D1C1C]/5 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#999]" />
                </div>
                <p className="text-sm font-black">리포트가 잠겨있습니다</p>
                <p className="text-[11px] text-[#666] font-bold">Builder 레벨은 무료로 확인할 수 있어요</p>
                <div className="flex gap-2">
                  <button className="h-10 px-5 rounded-xl bg-[#F77019] text-white text-[11px] font-black">
                    9,900원으로 잠금 해제
                  </button>
                  <button className="h-10 px-5 rounded-xl bg-[#F5F5F5] text-[#666] text-[11px] font-black">
                    4,950원 (할인)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ReportContent report={report} mode={mode as 'psf' | 'pmf'} />
        )}
      </div>
    </div>
  )
}

function ReportContent({ report, mode }: { report: AiReport; mode: 'psf' | 'pmf' }) {
  if (report.report_type === 'light') {
    return <LightReportView data={report.report_data as Parameters<typeof LightReportView>[0]['data']} />
  }
  if (report.report_type === 'deep') {
    return <DeepReportView data={report.report_data as Parameters<typeof DeepReportView>[0]['data']} mode={mode} />
  }
  return <StandardReportView data={report.report_data as Parameters<typeof StandardReportView>[0]['data']} mode={mode} />
}
