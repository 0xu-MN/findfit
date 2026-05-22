'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function NewRequestPage() {
  return (
    <div className="w-full flex flex-col gap-6 text-[#1D1C1C]">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black">새 의뢰 등록</h1>
        <p className="text-[11px] text-[#666] font-medium">6단계로 검증 가설을 명확히 정리해보세요</p>
      </div>

      {/* ── Stepper ── */}
      <div className="flex items-center gap-2 w-full max-w-[800px] text-[10px] font-bold">
        {[
          { step: 1, label: '기본 정보', active: true },
          { step: 2, label: '문제/솔루션', active: false },
          { step: 3, label: '타겟 고객', active: false },
          { step: 4, label: '검증 목표', active: false },
          { step: 5, label: '자료 첨부', active: false },
          { step: 6, label: '옵션/결제', active: false },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-center gap-2 flex-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0 ${s.active ? 'bg-[#F77019]' : 'bg-[#999]'}`}>
              {s.step}
            </div>
            <span className={`whitespace-nowrap ${s.active ? 'text-[#1D1C1C]' : 'text-[#999]'}`}>{s.label}</span>
            {i !== arr.length - 1 && (
              <div className={`flex-1 h-[1px] ml-2 ${s.active ? 'bg-[#F77019]' : 'bg-[#EEEEEE]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex items-start gap-6 w-full">
        
        {/* Left Form Area */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-black">기본 정보</h2>

            {/* Service Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold">서비스/제품명</label>
              <input 
                type="text" 
                className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold">한 줄 설명(30자)</label>
              <input 
                type="text" 
                className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold">카테고리</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="w-16 h-8 rounded-full bg-[#F5F5F5]" />
                ))}
              </div>
            </div>

            {/* Current Stage */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold">현재 단계</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { title: '아이디에이션', sub: '구체화 논의', active: false },
                  { title: '프로토타입', sub: '목업/와이어프레임', active: true },
                  { title: '베타', sub: '초기 사용자 테스트', active: false },
                  { title: '출시 후', sub: '시장 안착', active: false },
                ].map((stage) => (
                  <div 
                    key={stage.title} 
                    className={`flex flex-col p-4 rounded-xl cursor-pointer transition-colors ${
                      stage.active 
                        ? 'bg-[#F77019]/10 border border-[#F77019]' 
                        : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                    }`}
                  >
                    <span className={`text-[11px] font-black ${stage.active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{stage.title}</span>
                    <span className={`text-[9px] mt-1 ${stage.active ? 'text-[#F77019]/80' : 'text-[#999]'}`}>{stage.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Input Area */}
            <div className="w-full h-16 rounded-xl bg-[#F77019]/10 border border-[#F77019]/20 mt-2" />

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-6 mt-4 pr-4">
            <button className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
            <div className="flex flex-col items-center gap-2">
              <button className="bg-[#F77019] text-white text-[11px] font-black px-6 py-2.5 rounded-lg flex items-center gap-1 hover:bg-[#d95e0e] transition-colors shadow-sm">
                다음 <ChevronRight className="w-4 h-4" />
              </button>
              <button className="text-[9px] font-bold text-[#999] hover:underline">임시 저장</button>
            </div>
          </div>
        </div>

        {/* Right Summary Area */}
        <div className="w-[260px] rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex-shrink-0">
          <h3 className="text-xs font-black mb-5">의뢰 요약</h3>
          
          <div className="flex flex-col gap-4 text-[10px] font-bold text-[#666]">
            <div className="flex items-center justify-between">
              <span>설문 타입</span>
            </div>
            <div className="flex items-center justify-between">
              <span>타겟군</span>
            </div>
            <div className="flex items-center justify-between">
              <span>리포트</span>
            </div>
            <div className="flex items-center justify-between">
              <span>완료 시점</span>
            </div>
            
            <div className="h-[1px] bg-[#EEEEEE] my-1" />
            
            <div className="flex items-center justify-between">
              <span>참고 레퍼런스</span>
            </div>
            <div className="flex items-center justify-between">
              <span>보안 서약서</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
