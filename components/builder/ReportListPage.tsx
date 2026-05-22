'use client'

import { Search, FileText, Download, TrendingUp, Calendar, ChevronRight } from 'lucide-react'

const completedReports = [
  { id: 1, title: '클린뷰티 폼 패키지 디자인 리뷰', date: '2024.05.20', score: 4.6, resp: 100, color: '#F77019' },
  { id: 2, title: '웹사이트 메인페이지 맵핑 리뷰', date: '2024.05.18', score: 4.2, resp: 120, color: '#1565C0' },
  { id: 3, title: '비건 소녀 브랜드 사용 검증', date: '2024.05.15', score: 4.8, resp: 80, color: '#2E7D32' },
  { id: 4, title: '다이어트 보조제 패키지 A/B 테스트', date: '2024.05.02', score: 4.1, resp: 200, color: '#D84315' },
]

export default function ReportListPage() {
  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            완료된 리포트 <span className="text-[#999] text-sm font-bold">4</span>
          </h1>
          <p className="text-[11px] text-[#666] font-medium mt-1">
            프로젝트가 완료되면 AI가 분석한 인사이트 리포트가 이곳에 자동으로 생성됩니다.
          </p>
        </div>
        
        <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-lg px-3 py-2 w-64 shadow-sm focus-within:border-[#F77019] transition-colors">
          <Search className="w-4 h-4 text-[#999] mr-2" />
          <input 
            type="text" 
            placeholder="리포트 제목 검색..." 
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>
      </div>

      {/* ── Report List ── */}
      <div className="flex flex-col gap-3 w-full pb-8">
        
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr] px-4 py-2 text-[10px] font-bold text-[#999]">
          <span>프로젝트 리포트명</span>
          <span className="text-center">응답자 수</span>
          <span className="text-center">평균 만족도</span>
          <span className="text-right">완료일</span>
        </div>

        {completedReports.map((report) => (
          <div 
            key={report.id} 
            className="grid grid-cols-[3fr_1fr_1fr_1fr] items-center bg-white border border-[#1D1C1C]/5 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#F77019]/20 transition-all cursor-pointer group"
          >
            {/* Title & Icon */}
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: `${report.color}15` }}
              >
                <FileText className="w-5 h-5" style={{ color: report.color }} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-extrabold group-hover:text-[#F77019] transition-colors">{report.title}</span>
                <span className="text-[10px] text-[#999] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                  분석 완료 및 리포트 발행됨
                </span>
              </div>
            </div>

            {/* Respondents */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs font-black">{report.resp}</span>
              <span className="text-[10px] text-[#999] font-bold">명</span>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#F77019]" />
              <span className="text-xs font-black">{report.score}</span>
              <span className="text-[10px] text-[#999] font-bold">/ 5.0</span>
            </div>

            {/* Date & Action */}
            <div className="flex items-center justify-end gap-6">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#666]">
                <Calendar className="w-3.5 h-3.5 text-[#999]" />
                {report.date}
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-lg bg-[#FAFAFA] text-[#666] hover:bg-[#F77019]/10 hover:text-[#F77019] transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-[#1D1C1C] text-white hover:bg-[#F77019] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  )
}
