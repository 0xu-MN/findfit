'use client'

import { FileText, Search, Loader2 } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReportRow = {
  id: string
  title: string
  created_at: string
}

// 리포트 상세(app/builder/reports/[id]/page.tsx)를 노션처럼 "좌측 목록 +
// 우측 본문"으로 만들기 위한 좌측 레일. 조회 쿼리는 ReportListPage.tsx와
// 동일한 기준(ai_reports 존재 여부)을 그대로 재사용 — 로직 변경 없음, 좁은
// 목록 카드 형태로만 렌더링한다.
export default function ReportsSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const activeId = pathname?.split('/').pop() ?? null

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
        .select('id, title, created_at, ai_reports!inner(psf_score)')
        .eq('creator_id', user.id)
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
    <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 h-[calc(100vh-80px)] sticky top-20 py-6 pr-4 border-r border-[#1D1C1C]/8">
      <h2 className="text-sm font-black text-[#1D1C1C] px-1">리포트 목록</h2>

      <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-lg px-3 py-2 shadow-sm focus-within:border-[#F77019] transition-colors">
        <Search className="w-3.5 h-3.5 text-[#999] mr-2 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="리포트 검색..."
          className="w-full text-[11px] outline-none bg-transparent"
        />
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 text-[#999] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[10px] font-bold text-[#999] px-1 py-4 text-center">
            {reports.length === 0 ? '완료된 리포트가 없습니다' : '검색 결과가 없습니다'}
          </p>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/builder/reports/${r.id}`)}
              className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl transition-colors ${
                activeId === r.id ? 'bg-[#F77019]/10' : 'hover:bg-[#1D1C1C]/5'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${activeId === r.id ? 'text-[#F77019]' : 'text-[#999]'}`} />
              <span
                className={`text-[11px] font-bold truncate ${
                  activeId === r.id ? 'text-[#F77019]' : 'text-[#1D1C1C]'
                }`}
              >
                {r.title || '(제목 미작성)'}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
