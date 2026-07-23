'use client'

import { Search, FileText, TrendingUp, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReportRow = {
  id: string
  title: string
  completed_count: number
  created_at: string
  ai_reports: { psf_score: number | null; verdict: string | null }[] | { psf_score: number | null; verdict: string | null } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function ReportListPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('projects')
        .select('id, title, completed_count, created_at, ai_reports(psf_score, verdict)')
        .eq('creator_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      setReports((data ?? []) as ReportRow[])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => reports.filter((r) => r.title.toLowerCase().includes(query.toLowerCase())),
    [reports, query]
  )

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            완료된 리포트 <span className="text-[#999] text-sm font-bold">{reports.length}</span>
          </h1>
          <p className="text-[11px] text-[#666] font-medium mt-1">
            프로젝트가 완료되면 AI가 분석한 인사이트 리포트가 이곳에 자동으로 생성됩니다.
          </p>
        </div>

        <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-lg px-3 py-2 w-64 shadow-sm focus-within:border-[#F77019] transition-colors">
          <Search className="w-4 h-4 text-[#999] mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="리포트 제목 검색..."
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>
      </div>

      {/* ── Report List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-[#999] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] p-16 text-center">
          <p className="text-sm font-black text-[#999]">
            {reports.length === 0 ? '아직 완료된 리포트가 없습니다' : '검색 결과가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full pb-8">
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr] px-4 py-2 text-[10px] font-bold text-[#999]">
            <span>프로젝트 리포트명</span>
            <span className="text-center">참여 리뷰어 수</span>
            <span className="text-center">PSF 스코어</span>
            <span className="text-right">완료일</span>
          </div>

          {filtered.map((report) => {
            const aiReport = Array.isArray(report.ai_reports) ? report.ai_reports[0] : report.ai_reports
            return (
              <div
                key={report.id}
                onClick={() => router.push(`/builder/reports/${report.id}`)}
                className="grid grid-cols-[3fr_1fr_1fr_1fr] items-center bg-white border border-[#1D1C1C]/5 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#F77019]/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 bg-[#F77019]/10">
                    <FileText className="w-5 h-5 text-[#F77019]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-extrabold group-hover:text-[#F77019] transition-colors">
                      {report.title || '(제목 미작성)'}
                    </span>
                    <span className="text-[10px] text-[#999] flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                      분석 완료 및 리포트 발행됨
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-black">{report.completed_count}</span>
                  <span className="text-[10px] text-[#999] font-bold">명</span>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  {aiReport?.psf_score != null ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-[#F77019]" />
                      <span className="text-xs font-black">{Math.round(aiReport.psf_score)}</span>
                      <span className="text-[10px] text-[#999] font-bold">/ 100</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-[#999] font-bold">—</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#666]">
                    <Calendar className="w-3.5 h-3.5 text-[#999]" />
                    {fmtDate(report.created_at)}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg bg-[#1D1C1C] text-white hover:bg-[#F77019] transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
