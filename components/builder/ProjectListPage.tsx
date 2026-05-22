'use client'

import { MoreHorizontal, Plus, Search, FileText, LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'

export default function ProjectListPage() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            내 프로젝트 <span className="text-[#999] text-sm font-bold">5</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#F5F5F5] rounded-lg p-1">
            <button 
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-white shadow-sm text-[#1D1C1C]' : 'text-[#999] hover:text-[#666]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1D1C1C]' : 'text-[#999] hover:text-[#666]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center bg-white border border-[#1D1C1C]/10 rounded-lg px-3 py-1.5 w-64 shadow-sm focus-within:border-[#F77019] transition-colors">
            <Search className="w-4 h-4 text-[#999] mr-2" />
            <input 
              type="text" 
              placeholder="프로젝트 검색..." 
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>
          <button className="bg-[#1D1C1C] text-white text-xs font-black px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#333] transition-colors">
            <Plus className="w-4 h-4" />
            새 프로젝트
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div className="flex items-start gap-6 w-full h-full pb-8">
        
        {/* Column: 작성 중 (Drafts) */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-[#666]">작성 중</span>
              <span className="bg-[#EEEEEE] text-[#666] text-[10px] font-bold px-2 py-0.5 rounded-full">2</span>
            </div>
            <button className="text-[#999] hover:text-[#1D1C1C] transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              { title: '두피 케어 성분 브랜드 네이밍', lastEdit: '오늘 오후 2:30 수정', tag: '기본 정보 작성중' },
              { title: '카페 브랜드 로고 디자인 평가', lastEdit: '어제 수정됨', tag: '설문지 맵핑중' },
            ].map((draft, i) => (
              <div key={i} className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-extrabold group-hover:text-[#F77019] transition-colors">{draft.title}</h3>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-[#F77019] bg-[#F77019]/10 px-2 py-1 rounded-md">{draft.tag}</span>
                  <span className="text-[9px] text-[#999] font-medium">{draft.lastEdit}</span>
                </div>
              </div>
            ))}
            
            <button className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-[#1D1C1C]/10 rounded-xl text-[11px] font-bold text-[#999] hover:bg-[#FAFAFA] hover:text-[#1D1C1C] transition-colors">
              <Plus className="w-3.5 h-3.5" />
              새로 작성하기
            </button>
          </div>
        </div>

        {/* Column: 진행 중 (In Progress) */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-[#F77019]">진행 중</span>
              <span className="bg-[#F77019]/10 text-[#F77019] text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
            </div>
            <button className="text-[#999] hover:text-[#1D1C1C] transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { title: '친환경 폼 패키지 디자인', progress: 85, left: '2시간 남음', total: 100 },
              { title: '가계부 앱 서비스 후보 조사', progress: 42, left: '3일 남음', total: 80 },
              { title: '리뉴얼 신제품 콘셉트 평가', progress: 18, left: '7일 남음', total: 50 },
            ].map((proj, i) => (
              <div key={i} className="bg-white border border-[#1D1C1C]/5 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-xs font-extrabold group-hover:text-[#F77019] transition-colors line-clamp-1 pr-4">{proj.title}</h3>
                  <span className="text-[10px] font-bold text-[#2E7D32] whitespace-nowrap bg-[#2E7D32]/10 px-2 py-0.5 rounded flex-shrink-0">{proj.left}</span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#666]">
                    <span>응답 수집률</span>
                    <span className="text-[#F77019]">{proj.progress} / {proj.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#F77019]" style={{ width: `${(proj.progress / proj.total) * 100}%` }} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-1 pt-3 border-t border-[#1D1C1C]/5 text-[10px] text-[#999] font-bold hover:text-[#1D1C1C] transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  실시간 결과 보기
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: 검토 대기 (Under Review) */}
        <div className="flex-1 flex flex-col gap-3 opacity-50 pointer-events-none">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-[#666]">결과 분석 중</span>
              <span className="bg-[#EEEEEE] text-[#666] text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
            </div>
            <button className="text-[#999] hover:text-[#1D1C1C] transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#1D1C1C]/10 rounded-xl bg-[#FAFAFA]/50 text-center gap-2">
            <FileText className="w-6 h-6 text-[#CCC]" />
            <span className="text-[10px] font-bold text-[#999]">분석 중인 프로젝트가 없습니다</span>
          </div>
        </div>

      </div>
    </div>
  )
}
