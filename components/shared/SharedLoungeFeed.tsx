'use client'

import { 
  Search, 
  Flame, 
  ArrowRight, 
  MessageSquare, 
  Heart, 
  Eye,
  Star,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

// Dummy feed data
const loungeFeedItems = [
  {
    id: 1,
    category: 'SaaS',
    categoryColor: '#F77019',
    title: 'AI 기반 협업 문서 도구 "SyncDoc" 피드백 부탁드립니다!',
    author: '노코드빌더',
    time: '2시간 전',
    views: 142,
    likes: 24,
    comments: 18,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
    hot: true
  },
  {
    id: 2,
    category: 'AI / 개발',
    categoryColor: '#1565C0',
    title: '이더리움 스마트 컨트랙트 원클릭 오딧 툴 — 아이디어 의견?',
    author: '블록체인마스터',
    time: '4시간 전',
    views: 98,
    likes: 15,
    comments: 9,
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=80&q=80',
    hot: false
  },
  {
    id: 3,
    category: '커머스',
    categoryColor: '#2E7D32',
    title: '1인 가구를 위한 프리미엄 반찬 구독 서비스 시장성 있을까요?',
    author: '밀키트장인',
    time: '6시간 전',
    views: 205,
    likes: 38,
    comments: 31,
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80',
    hot: true
  },
  {
    id: 4,
    category: '핀테크',
    categoryColor: '#E65100',
    title: '소상공인을 위한 일일 정산 가속화 대시보드 검증 완료!',
    author: '핀테크크리에이터',
    time: '1일 전',
    views: 312,
    likes: 67,
    comments: 42,
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=80&q=80',
    hot: false
  }
]

export default function SharedLoungeFeed() {
  return (
    <div className="w-full flex flex-col gap-6 select-none text-[#1D1C1C]">
      
      {/* ── Search Bar ── */}
      <div 
        className="w-full flex items-center gap-3 px-5 py-3 rounded-full border border-[#1D1C1C]/5 transition-all focus-within:border-[#F77019]/40 focus-within:shadow-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Search className="w-4 h-4 text-[#666] flex-shrink-0" />
        <input 
          type="text" 
          placeholder="라운지 피드 및 아이디어 검색..." 
          className="bg-transparent text-sm w-full outline-none text-[#1D1C1C] placeholder-[#999] font-medium"
        />
      </div>

      {/* ── Premium Recommended Highlights (Image 1 우측 상단 배너 컨셉) ── */}
      <div 
        className="w-full rounded-[24px] border p-6 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-md"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(247,112,25,0.12)',
        }}
      >
        {/* Glow behind banner */}
        <div 
          className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: '#F77019' }}
        />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#F77019]">
            <Flame className="w-3.5 h-3.5 animate-bounce" />
            WEEKLY RECOMMEND
          </div>
          <button className="text-[10px] font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5">
            전체보기 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Highlight Image & Info */}
        <div className="w-full h-36 rounded-xl relative overflow-hidden mb-4 border border-[#F77019]/10">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" 
            alt="Recommended Item" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Subtle Orange overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <span className="text-[10px] font-bold text-white bg-[#F77019] px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI 추천
            </span>
            <div className="flex items-center gap-1 text-white text-xs font-black">
              <Star className="w-3.5 h-3.5 fill-[#FFB74D] text-[#FFB74D]" />
              4.9 (53명 리뷰)
            </div>
          </div>
        </div>

        {/* Highlight Title */}
        <h4 className="text-sm font-black text-[#1D1C1C] leading-snug group-hover:text-[#F77019] transition-colors mb-2.5">
          "지인의 편향을 지우고 진짜 시장성만 걸러냅니다" — FindFit 플랫폼 활용법 가이드
        </h4>
        <p className="text-[11px] text-[#666] leading-relaxed mb-4">
          창업 아이디어를 혼자만 알고 있으면 아무것도 알 수 없습니다. 리뷰 단계를 설정하고, 도메인 전문가 매칭을 통해 72시간 안에 투자 심사 리포트 수준의 데이터를 확보하세요.
        </p>

        {/* Banner Action */}
        <button 
          className="w-full py-2.5 rounded-xl text-xs font-black text-white text-center hover:scale-[1.01] active:scale-[0.99] transition-all"
          style={{
            background: 'linear-gradient(135deg, #F77019 0%, #d95e0e 100%)',
            boxShadow: '0 4px 12px rgba(247,112,25,0.2)',
          }}
        >
          검증 성공 사례 연구 읽기
        </button>
      </div>

      {/* ── Lounge Community Feed List ── */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-black text-[#1D1C1C] flex items-center gap-2">
          실시간 라운지 피드
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
        </h3>

        {/* Feed Cards */}
        <div className="flex flex-col gap-3">
          {loungeFeedItems.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-[20px] bg-white border border-[#1D1C1C]/5 hover:border-[#F77019]/25 hover:shadow-sm transition-all duration-300 flex items-start justify-between gap-4 group cursor-pointer"
            >
              {/* Left Column: Post Details */}
              <div className="flex flex-col flex-1">
                {/* Category & Time */}
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                    style={{
                      color: item.categoryColor,
                      borderColor: `${item.categoryColor}25`,
                      background: `${item.categoryColor}08`
                    }}
                  >
                    {item.category}
                  </span>
                  <span className="text-[10px] text-[#999] font-medium">{item.time}</span>
                  {item.hot && (
                    <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      🔥 HOT
                    </span>
                  )}
                </div>

                {/* Title */}
                <h5 className="text-xs font-extrabold text-[#1D1C1C] leading-snug group-hover:text-[#F77019] transition-colors mb-2.5">
                  {item.title}
                </h5>

                {/* Author & Stats */}
                <div className="flex items-center justify-between text-[10px] text-[#666] font-semibold mt-1">
                  <span>@{item.author}</span>
                  
                  {/* Stats icons */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#999]" />
                      {item.views}
                    </span>
                    <span className="flex items-center gap-1 hover:text-[#E53935] transition-colors">
                      <Heart className="w-3.5 h-3.5 text-[#999] hover:fill-[#E53935]" />
                      {item.likes}
                    </span>
                    <span className="flex items-center gap-1 hover:text-[#F77019] transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-[#999]" />
                      {item.comments}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#1D1C1C]/5">
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
