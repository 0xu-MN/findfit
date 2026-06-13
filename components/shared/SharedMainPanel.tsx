'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

const rotatingWords = ['고객의 목소리', '정직한 피드백', '시장 검증', '실제 소비자', '검증된 데이터']
const quickChips   = ['단백질 쉐이크', '비건 간식', '여성 청결제', '홈트레이닝 기구', '스킨케어']

const aiResult = {
  target: '20~34세 여성',
  desc: '운동 경험자, 단백질 섭취 관심 높음\n체형/열량/간식, 건강 관심 소비 성향',
  count: 425, recruitCount: 42, cost: '12,500', days: 5,
  insight: '맛 관련 의견이 가장 많이 수집될 가능성이 높습니다.',
  insightSub: '단맛, 텍스처, 포만감에 대한 리뷰가 핵심 인사이트가 될 거예요.',
}

const activityCards = [
  { id:1, img:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=160&q=80', badge:'리뷰 모집',   badgeColor:'#F77019', title:'단백질 쉐이크 리뷰 모집중',      sub:'50,000 FC · 35명 모집' },
  { id:2, img:'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=160&q=80', badge:'리뷰 등록',   badgeColor:'#1565C0', title:'고단백 쉐이크 리뷰 등록!',        sub:'방금 전' },
  { id:3, img:'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&q=80', badge:'라운지 인기', badgeColor:'#6B21A8', title:'리뷰어 사례금 얼마가 적당할까요?', sub:'128 · 10분 전' },
  { id:4, img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=160&q=80', badge:'의뢰 모집',   badgeColor:'#F77019', title:'비건 에너지바 리뷰 모집',         sub:'30,000 FC · 20명 모집' },
  { id:5, img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=160&q=80', badge:'리뷰 등록',   badgeColor:'#1565C0', title:'스킨케어 3종 세트 리뷰 완료',     sub:'15분 전' },
  { id:6, img:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=160&q=80', badge:'의뢰 모집',   badgeColor:'#F77019', title:'소상공인 정산 앱 UX 검증 모집',   sub:'25,000 FC · 15명 모집' },
  { id:7, img:'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=160&q=80', badge:'리뷰 등록',   badgeColor:'#2E7D32', title:'반려동물 영양제 신규 등록',        sub:'2분 전' },
]

const pillStats = [
  { icon:'📋', label:'진행중 프로젝트', value:'329+' },
  { icon:'✍️', label:'평균 리뷰',       value:'1,842건' },
  { icon:'⭐', label:'평균 만족도',     value:'4.8 / 5.0' },
  { icon:'👥', label:'리뷰어',         value:'148,291명' },
]

export default function SharedMainPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isWide,    setIsWide]    = useState(false)
  const [wordIdx,   setWordIdx]   = useState(0)
  const [wordVis,   setWordVis]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [searched,  setSearched]  = useState(false)
  const [liveCount, setLiveCount] = useState(1248)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setIsWide(e[0].contentRect.width > 680))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setWordVis(false)
      setTimeout(() => { setWordIdx(i => (i + 1) % rotatingWords.length); setWordVis(true) }, 320)
    }, 2800)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 3 - 1)), 4000)
    return () => clearInterval(iv)
  }, [])

  const handleSearch = () => { if (search.trim()) setSearched(true) }
  const handleChip   = (chip: string) => { setSearch(chip); setSearched(true) }

  // 축소 모드 — 네이버 스타일 (작은 타이틀 + 검색창 중심)
  if (!isWide) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center select-none overflow-hidden px-5 pt-12"
      >
        {/* 작은 브랜드 타이틀 */}
        <div className="flex flex-col items-center gap-1.5 mb-7">
          <span className="text-[22px] font-black tracking-tight">
            <span className="text-[#F77019]">Find</span>
            <span className="text-[#1D1C1C]">Fit</span>
          </span>
          <span className="text-[10px] font-bold text-[#999] tracking-wide">
            좋은 브랜드는 <span className="text-[#F77019]">{rotatingWords[wordIdx]}</span>에서 시작됩니다
          </span>
        </div>

        {/* 검색창 — 큰 사이즈, 중앙 강조 */}
        <div
          className="w-full max-w-[420px] flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all focus-within:shadow-[0_0_0_2px_rgba(247,112,25,0.18)]"
          style={{ background: '#FFFFFF', border: '2px solid #1D1C1C' }}
        >
          <Sparkles className="w-4 h-4 text-[#F77019] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearched(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="검증하고 싶은 아이디어를 입력해보세요"
            className="flex-1 bg-transparent text-[13px] font-medium text-[#1D1C1C] placeholder-[#999] outline-none min-w-0"
          />
          <button
            onClick={handleSearch}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95"
            style={{ background: search ? '#F77019' : '#1D1C1C' }}
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 추천 검색어 칩 */}
        <div className="w-full max-w-[420px] flex items-center gap-1.5 flex-wrap justify-center mt-4">
          {quickChips.slice(0, 5).map((chip) => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#1D1C1C]/10 text-[#555] bg-white hover:border-[#F77019]/40 hover:text-[#F77019] transition-all"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* 하단 라이브 카운터 (작게) */}
        <div className="flex items-center gap-1.5 mt-auto mb-8 text-[10px] font-bold text-[#999]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span>
            현재 <span className="text-[#1D1C1C] font-black">{liveCount.toLocaleString()}명</span> 활동 중
          </span>
        </div>
      </div>
    )
  }

  // 확장 모드 — 기존 풀 디자인
  return (
    <>
      <style>{`
        @keyframes ff-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .ff-marquee-track { display:flex; gap:14px; width:max-content; animation:ff-marquee 38s linear infinite; }
      `}</style>

      <div ref={containerRef} className="w-full h-full flex flex-col overflow-hidden select-none">

        {/* ① 타이틀 (배지 + 2줄) */}
        <div className="text-center pt-5 pb-4 flex-shrink-0">
          {/* 그라데이션 스트로크 배지 — wrapper approach for reliable gradient border */}
          <div className="inline-flex mb-3"
            style={{ padding: '1.5px', borderRadius: '999px', background: 'linear-gradient(to right, #F77019, #189DF7)' }}>
            <div className="inline-flex items-center justify-center"
              style={{
                padding: '5px 15px',
                borderRadius: '999px',
                background: '#F8F8F8',
              }}>
              <span style={{ color: '#999999', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                크리에이터와 리뷰어가 함께만드는 가치
              </span>
            </div>
          </div>
          <p className="font-black text-[#1D1C1C] leading-tight"
            style={{ fontSize:'clamp(28px,3vw,42px)' }}>
            좋은 브랜드는
          </p>
          <h1 className="font-black text-[#1D1C1C] leading-tight mt-1 flex items-center justify-center gap-2 flex-wrap"
            style={{ fontSize:'clamp(28px,3vw,42px)' }}>
            <span className="text-[#F77019] inline-block"
              style={{
                opacity: wordVis ? 1 : 0,
                transform: wordVis ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}>
              {rotatingWords[wordIdx]}
            </span>
            <span>에서 시작됩니다.</span>
          </h1>
        </div>

        {/* ② 알약 통계 (고정, 스크롤 없음) */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2 pb-4 flex-wrap px-6">
          {pillStats.map((s, i) => (
            <div key={i}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(29,28,28,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
              <span className="text-[11px]">{s.icon}</span>
              <span className="text-[9px] text-[#AAA] font-semibold whitespace-nowrap">{s.label}</span>
              <span className="text-[10px] font-black text-[#1D1C1C] whitespace-nowrap">{s.value}</span>
              <span className="text-[8px] font-bold text-[#22C55E]">▲</span>
            </div>
          ))}
        </div>

        {/* ③ 메인 박스 — 검색(좌) + AI 추천(우) */}
        <div className="flex-shrink-0 rounded-3xl overflow-hidden"
          style={{
            maxWidth: 840,
            width: 'calc(100% - 48px)',
            marginLeft: 'auto',
            marginRight: 'auto',
            background:'rgba(255,255,255,0.92)',
            border:'1px solid rgba(29,28,28,0.07)',
            boxShadow:'0 4px 24px rgba(0,0,0,0.05)',
          }}>
          <div className={`flex ${isWide ? 'flex-row' : 'flex-col'}`}>

            {/* 좌: 검색 */}
            <div className="flex flex-col gap-4 p-6" style={{ flex: isWide ? '1 1 52%' : undefined }}>
              <h2 className="font-black text-[#1D1C1C]" style={{ fontSize:'clamp(14px,1.4vw,19px)' }}>
                어떤 제품을 검증하고 싶으신가요?
              </h2>

              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all focus-within:shadow-[0_0_0_2px_rgba(139,92,246,0.15)]"
                style={{ background:'#F5F5F7', border:'1.5px solid rgba(29,28,28,0.06)' }}>
                <Sparkles className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                <input
                  type="text" value={search}
                  onChange={e => { setSearch(e.target.value); setSearched(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="예) 20대 여성을 타깃한 단백질 쉐이크를 출시하려고 해요"
                  className="flex-1 bg-transparent text-[12px] font-medium text-[#1D1C1C] placeholder-[#C0C0C0] outline-none"
                />
                <button onClick={handleSearch}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                  style={{ background: search ? '#F77019' : '#1D1C1C' }}>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-[#999]">추천 검색어</span>
                {quickChips.map(chip => (
                  <button key={chip} onClick={() => handleChip(chip)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#1D1C1C]/10 text-[#555] bg-white hover:border-[#F77019]/40 hover:text-[#F77019] transition-all">
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 우: AI 추천 결과 — 항상 표시, 검색 전/후 상태 구분 */}
            {isWide && (
              <div className="flex flex-col gap-4 p-6"
                style={{ flex:'1 1 48%', borderLeft:'1px solid rgba(29,28,28,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span className="text-[11px] font-black text-[#8B5CF6]">FindFit AI 추천 결과</span>
                  {!searched && (
                    <span className="ml-auto text-[9px] font-bold text-[#CCC] bg-[#F5F5F7] px-2 py-0.5 rounded-full">
                      검색 후 분석 결과가 나타납니다
                    </span>
                  )}
                </div>

                {searched ? (
                  /* 검색 후: 실제 결과 */
                  <>
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0" style={{ width:78, height:48 }}>
                        {[0,1,2].map(i => (
                          <div key={i}
                            className="absolute top-0 w-11 h-11 rounded-full border-2 border-white flex items-center justify-center text-white text-[11px] font-black"
                            style={{ left:i*17, zIndex:3-i, background:['#F77019','#8B5CF6','#1565C0'][i] }}>
                            {['여','남','20'][i]}
                          </div>
                        ))}
                        <div className="absolute -bottom-0.5 left-5 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full"
                          style={{ background:'#F77019', zIndex:10, whiteSpace:'nowrap' }}>
                          {aiResult.count.toLocaleString()}명
                        </div>
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-[#1D1C1C]">{aiResult.target}</p>
                        <p className="text-[10px] text-[#999] mt-0.5 leading-relaxed whitespace-pre-line">{aiResult.desc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1D1C1C]/5">
                      {[
                        { label:'예상 모집 인원', value:`${aiResult.recruitCount}명` },
                        { label:'예상 비용',      value:`${aiResult.cost} FC` },
                        { label:'예상 완료 기간', value:`${aiResult.days}일` },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-[#8B5CF6]">{s.label}</span>
                          <span className="text-[14px] font-black text-[#1D1C1C]">{s.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl px-4 py-3 flex gap-2"
                      style={{ background:'#EEF2FF', border:'1px solid #C7D2FE' }}>
                      <span className="text-[13px] flex-shrink-0">📍</span>
                      <div>
                        <p className="text-[11px] font-black text-[#3730A3]">{aiResult.insight}</p>
                        <p className="text-[10px] text-[#6366F1] mt-0.5 leading-relaxed">{aiResult.insightSub}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* 검색 전: 프리뷰 플레이스홀더 */
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
                      <Sparkles className="w-6 h-6 text-[#8B5CF6]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-black text-[#1D1C1C]">AI 맞춤 분석</p>
                      <p className="text-[10px] text-[#999] mt-1 leading-relaxed">
                        제품이나 아이디어를 검색하면<br />
                        타겟 고객·예상 비용·인사이트를<br />
                        AI가 즉시 분석해드려요
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      {['20~34세 여성 · 헬스/뷰티 관심','30~45세 직장인 · IT 얼리어답터','25~39세 1인 가구 · 간편식 선호'].map((ex,i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                          style={{ background:'#F8F8FA', border:'1px solid rgba(139,92,246,0.08)' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'#C4B5FD' }} />
                          <span className="text-[9px] text-[#999] font-medium">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ④ 실시간 활동 */}
        <div className="flex-shrink-0 rounded-3xl overflow-hidden flex items-stretch"
          style={{
            maxWidth: 840,
            width: 'calc(100% - 48px)',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: 16,
            marginBottom: 16,
            background:'rgba(255,255,255,0.9)',
            border:'1px solid rgba(29,28,28,0.07)',
            boxShadow:'0 4px 20px rgba(0,0,0,0.04)',
            height: 120,
          }}>
          {/* 좌: 레이블 */}
          <div className="flex flex-col items-center justify-center gap-2 px-5 border-r border-[#1D1C1C]/5 flex-shrink-0"
            style={{ minWidth:72 }}>
            <p className="text-[14px] font-black text-[#1D1C1C] text-center leading-snug">실시간<br />활동</p>
            <span className="text-[8px] font-black text-white px-2 py-0.5 rounded-full"
              style={{ background:'#EF4444' }}>LIVE</span>
          </div>

          {/* 중: 마퀴 */}
          <div className="flex-1 overflow-hidden flex items-center relative min-w-0">
            <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
              style={{ background:'linear-gradient(to right,rgba(255,255,255,0.9),transparent)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
              style={{ background:'linear-gradient(to left,rgba(255,255,255,0.9),transparent)' }} />
            <div className="pl-5 overflow-hidden w-full">
              <div className="ff-marquee-track">
                {[...activityCards,...activityCards].map((card,i) => (
                  <ActivityCard key={i} card={card} />
                ))}
              </div>
            </div>
          </div>

          {/* 우: 현재 활동 수 */}
          <div className="flex flex-col items-center justify-center gap-1 px-5 border-l border-[#1D1C1C]/5 flex-shrink-0 cursor-pointer group"
            style={{ minWidth:80 }}>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[9px] font-bold text-[#999]">현재</span>
            </div>
            <span className="text-[16px] font-black text-[#1D1C1C] leading-tight">
              {liveCount.toLocaleString()}명
            </span>
            <span className="text-[9px] font-bold text-[#999]">활동 중</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#CCC] group-hover:text-[#F77019] mt-1 transition-colors" />
          </div>
        </div>

      </div>
    </>
  )
}

function ActivityCard({ card }: { card: (typeof activityCards)[0] }) {
  return (
    <div className="flex-shrink-0 flex items-center rounded-2xl overflow-hidden border border-[#1D1C1C]/5 hover:border-[#F77019]/20 hover:shadow-sm transition-all cursor-pointer bg-white"
      style={{ width:190, height:100 }}>
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width:90, height:100 }}>
        <img src={card.img} alt={card.title} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full whitespace-nowrap"
          style={{ background:card.badgeColor }}>
          {card.badge}
        </span>
      </div>
      <div className="flex-1 px-3 py-3 flex flex-col justify-center gap-1.5 min-w-0">
        <p className="text-[11px] font-extrabold text-[#1D1C1C] leading-snug line-clamp-2">{card.title}</p>
        <p className="text-[9px] text-[#999] font-medium overflow-hidden text-ellipsis whitespace-nowrap">{card.sub}</p>
      </div>
    </div>
  )
}
