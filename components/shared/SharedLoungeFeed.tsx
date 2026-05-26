'use client'

import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
  Heart,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Search,
  Send,
  Share2,
  Smile,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type FeedItem = {
  id: number
  category: string
  categoryColor: string
  title: string
  body: string
  author: string
  authorHandle: string
  authorAvatarColor: string
  time: string
  views: number
  likes: number
  comments: number
  thumbnail: string
  hot: boolean
}

const loungeFeedItems: FeedItem[] = [
  {
    id: 1,
    category: 'SaaS',
    categoryColor: '#F77019',
    title: 'AI 기반 협업 문서 도구 "SyncDoc" 피드백 부탁드립니다!',
    body: '3개월간 사이드프로젝트로 만들어온 협업 문서 도구입니다. AI가 문서 컨텍스트를 이해해서 자동으로 요약/번역/태깅을 해줍니다. 베타 테스트 참여하실 분 모십니다 — 사용 후 솔직한 피드백 부탁드려요. 특히 기존 노션/구글독스 대비 어떤 차별점이 매력적인지 궁금합니다.',
    author: '노코드빌더',
    authorHandle: 'nocode_builder',
    authorAvatarColor: '#F77019',
    time: '2시간 전',
    views: 142,
    likes: 24,
    comments: 18,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    hot: true,
  },
  {
    id: 2,
    category: 'AI / 개발',
    categoryColor: '#1565C0',
    title: '이더리움 스마트 컨트랙트 원클릭 오딧 툴 — 아이디어 의견?',
    body: '솔리디티 컨트랙트 코드 한 줄 입력하면 AI가 보안 취약점을 자동 분석해주는 SaaS 아이디어입니다. 시장에 비슷한 게 있긴 한데 가격이 너무 비쌉니다 ($300/월~). 월 $29~49 가격대로 1인 개발자 타겟. 어떤 분들이 관심 있을까요?',
    author: '블록체인마스터',
    authorHandle: 'chain_master',
    authorAvatarColor: '#1565C0',
    time: '4시간 전',
    views: 98,
    likes: 15,
    comments: 9,
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80',
    hot: false,
  },
  {
    id: 3,
    category: '커머스',
    categoryColor: '#2E7D32',
    title: '1인 가구를 위한 프리미엄 반찬 구독 서비스 시장성 있을까요?',
    body: '1인 가구를 위한 주 3회 배송 반찬 구독 서비스 기획 중입니다. 가격대는 월 9만원 (회당 3,000~5,000원/반찬 3가지). 기존 마켓컬리/쿠팡 대비 차별점은 "주방장 직접 매칭" 컨셉. PMF 가능성 있을까요?',
    author: '밀키트장인',
    authorHandle: 'meal_master',
    authorAvatarColor: '#2E7D32',
    time: '6시간 전',
    views: 205,
    likes: 38,
    comments: 31,
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    hot: true,
  },
  {
    id: 4,
    category: '핀테크',
    categoryColor: '#F77019',
    title: '소상공인을 위한 일일 정산 가속화 대시보드 검증 완료!',
    body: 'FindFit으로 전문가 30명에게 PMF 테스트했고 Sean Ellis Score 47% 나왔습니다. 다음 단계로 시드 라운드 준비 중. 검증 데이터가 너무 좋아서 공유합니다.',
    author: '핀테크크리에이터',
    authorHandle: 'fintech_creator',
    authorAvatarColor: '#FF8F00',
    time: '1일 전',
    views: 312,
    likes: 67,
    comments: 42,
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    hot: false,
  },
  {
    id: 5,
    category: 'SaaS',
    categoryColor: '#F77019',
    title: 'B2B 영업 자동화 CRM 툴 MVP 테스트 패널 구합니다.',
    body: '세일즈포스 대비 1/10 가격으로 만든 B2B CRM입니다. 메일 자동화, 리드 스코어링, 미팅 노트 AI 요약 포함. 5명 정도 베타 테스터 모십니다.',
    author: '세일즈왕',
    authorHandle: 'sales_king',
    authorAvatarColor: '#7B1FA2',
    time: '1일 전',
    views: 180,
    likes: 45,
    comments: 12,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    hot: false,
  },
  {
    id: 6,
    category: '커머스',
    categoryColor: '#2E7D32',
    title: '반려동물 맞춤형 영양제 정기배송 런칭 전 피드백',
    body: '반려동물의 종/나이/체중/건강상태 데이터를 입력하면 맞춤 영양제 박스를 조합해 보내주는 서비스입니다. 월 4.9만원~. 시장 반응이 궁금합니다.',
    author: '펫사랑',
    authorHandle: 'pet_lover',
    authorAvatarColor: '#E91E63',
    time: '2일 전',
    views: 420,
    likes: 88,
    comments: 56,
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80',
    hot: true,
  },
]

export default function SharedLoungeFeed() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [activeSort, setActiveSort] = useState('최신순')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [composerValue, setComposerValue] = useState('')

  // 패널 넓이 감지
  const containerRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsExpanded(entry.contentRect.width > 900)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col gap-5 select-none text-[#1D1C1C] min-w-0 overflow-x-hidden">
      {/* ── Search Bar — 확장 모드에서만 표시 ── */}
      {isExpanded && (
        <div
          className="w-full flex items-center gap-3 px-5 py-3 rounded-full border border-[#1D1C1C]/5 transition-all focus-within:border-[#F77019]/40 focus-within:shadow-sm flex-shrink-0"
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
      )}

      {isExpanded ? (
        /* ══════════════════════════════════════════════════════════════ */
        /*                          확장 모드 (2열)                          */
        /* ══════════════════════════════════════════════════════════════ */
        <div className="w-full flex items-start gap-6 pb-8 animate-fade-in">
          {/* Left — 게시글 리스트 (~970px) */}
          <div className="flex-shrink-0 flex flex-col gap-4" style={{ width: 'min(970px, calc(100% - 360px - 1.5rem))' }}>
            <FilterBar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              activeSort={activeSort}
              setActiveSort={setActiveSort}
            />

            <div className="flex flex-col gap-4">
              {loungeFeedItems.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => toggleExpand(item.id)}
                  variant="wide"
                />
              ))}
            </div>
          </div>

          {/* Right — Profile + Composer */}
          <div className="w-[340px] flex-shrink-0 flex flex-col gap-4 sticky top-0">
            <ProfileCard />
            <Composer value={composerValue} onChange={setComposerValue} />
            <WeeklyRecommendMini />
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════ */
        /*                       수축 모드 (단일 컬럼)                        */
        /* ══════════════════════════════════════════════════════════════ */
        <div className="flex flex-col gap-4 w-full pb-8 animate-fade-in min-w-0">
          {/* 헤더 바로 아래 — 게시글 작성 placeholder (단일 row) */}
          <Composer value={composerValue} onChange={setComposerValue} compact />

          {/* 라운지 피드 — 인라인 확장 */}
          <div className="flex flex-col gap-3 min-w-0">
            <h3 className="text-sm font-black text-[#1D1C1C] flex items-center gap-2 px-1">
              실시간 라운지 피드
              <span className="w-1.5 h-1.5 rounded-full bg-[#81C784]" />
            </h3>

            <div className="flex flex-col gap-3 min-w-0">
              {loungeFeedItems.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => toggleExpand(item.id)}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  FeedCard — 인라인 확장 지원                              */
/* ─────────────────────────────────────────────────────── */

function FeedCard({
  item,
  expanded,
  onToggle,
  variant,
}: {
  item: FeedItem
  expanded: boolean
  onToggle: () => void
  variant: 'wide' | 'compact'
}) {
  return (
    <article
      className={`rounded-[24px] bg-white border transition-all duration-300 overflow-hidden ${
        expanded
          ? 'border-[#F77019]/40 shadow-[0_8px_28px_rgba(247,112,25,0.10)]'
          : 'border-[#1D1C1C]/5 hover:border-[#F77019]/20 hover:shadow-sm'
      }`}
    >
      <div className={`flex items-start gap-4 ${variant === 'wide' ? 'p-6' : 'p-5'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 rounded-full flex items-center justify-center text-white font-black ${
            variant === 'wide' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs'
          }`}
          style={{ background: item.authorAvatarColor }}
        >
          {item.author[0]}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Meta line */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-black text-[#1D1C1C]">{item.author}</span>
            <span className="text-[10px] text-[#999] font-medium">@{item.authorHandle}</span>
            <span className="text-[10px] text-[#999]">·</span>
            <span className="text-[10px] text-[#999] font-medium">{item.time}</span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ml-auto"
              style={{
                color: item.categoryColor,
                borderColor: `${item.categoryColor}25`,
                background: `${item.categoryColor}08`,
              }}
            >
              {item.category}
            </span>
            {item.hot && (
              <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                🔥 HOT
              </span>
            )}
          </div>

          {/* Title */}
          <h5
            onClick={onToggle}
            className={`font-black text-[#1D1C1C] leading-snug cursor-pointer hover:text-[#F77019] transition-colors ${
              variant === 'wide' ? 'text-[15px]' : 'text-[13px]'
            } ${expanded ? '' : 'line-clamp-2'}`}
          >
            {item.title}
          </h5>

          {/* Body preview (collapsed) or full (expanded) */}
          {expanded ? (
            <p className="text-[12px] text-[#444] leading-relaxed whitespace-pre-line">{item.body}</p>
          ) : (
            <p className="text-[11px] text-[#666] leading-relaxed line-clamp-1">{item.body}</p>
          )}

          {/* Thumbnail */}
          {expanded ? (
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mt-2 border border-[#1D1C1C]/5">
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ) : null}

          {/* View all toggle */}
          <button
            type="button"
            onClick={onToggle}
            className="self-start flex items-center gap-1 text-[10px] font-black text-[#F77019] hover:underline mt-0.5"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> 접기
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> view all
              </>
            )}
          </button>

          {/* Stats / Actions row */}
          <div
            className={`flex items-center justify-between text-[10px] text-[#999] font-bold ${
              expanded ? 'pt-3 mt-2 border-t border-[#1D1C1C]/5' : 'pt-2'
            }`}
          >
            <div className="flex items-center gap-4">
              <ActionBtn icon={<Heart className="w-3.5 h-3.5" />} count={item.likes} hoverColor="#E53935" />
              <ActionBtn icon={<MessageSquare className="w-3.5 h-3.5" />} count={item.comments} hoverColor="#F77019" />
              <ActionBtn icon={<Eye className="w-3.5 h-3.5" />} count={item.views} hoverColor="#666" />
            </div>
            {expanded && (
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-full hover:bg-[#1D1C1C]/5 flex items-center justify-center text-[#999] hover:text-[#1D1C1C] transition-colors">
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-full hover:bg-[#1D1C1C]/5 flex items-center justify-center text-[#999] hover:text-[#1D1C1C] transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Inline reply composer when expanded */}
          {expanded && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-full bg-[#F5F5F5] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#F77019]/30 transition-all">
              <Smile className="w-3.5 h-3.5 text-[#999] flex-shrink-0" />
              <input
                type="text"
                placeholder="댓글 작성..."
                className="flex-1 bg-transparent outline-none text-[11px] text-[#1D1C1C] placeholder-[#999]"
              />
              <button className="w-6 h-6 rounded-full bg-[#F77019] text-white flex items-center justify-center hover:opacity-90">
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right thumbnail (only when not expanded) */}
        {!expanded && (
          <div
            onClick={onToggle}
            className={`flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer border border-[#1D1C1C]/5 ${
              variant === 'wide' ? 'w-[120px] h-[120px]' : 'w-[72px] h-[72px]'
            }`}
          >
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
          </div>
        )}
      </div>
    </article>
  )
}

function ActionBtn({ icon, count, hoverColor }: { icon: React.ReactNode; count: number; hoverColor: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-[#999] transition-colors group"
      onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = '')}
    >
      {icon}
      <span className="text-[10px] font-bold">{count}</span>
    </button>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  Composer — 게시글 작성 placeholder                       */
/* ─────────────────────────────────────────────────────── */

function Composer({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  // Compact 모드 — 좁은 패널에 맞춘 단일 row (overflow 안 일어나게)
  if (compact) {
    const hasValue = value.trim().length > 0
    return (
      <div className="w-full rounded-full bg-white border border-[#1D1C1C]/5 hover:border-[#F77019]/20 transition-all flex items-center gap-2 pl-3 pr-1.5 py-1.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#F77019] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
          C
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="지금 검증하고 싶은 아이디어를 공유해보세요..."
          className="flex-1 min-w-0 bg-transparent outline-none text-[12px] text-[#1D1C1C] placeholder-[#999] font-medium"
        />
        <button
          disabled={!hasValue}
          className={`flex-shrink-0 rounded-full transition-all ${
            hasValue
              ? 'px-3 py-1.5 bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 shadow-sm'
              : 'w-8 h-8 text-[#999] hover:text-[#F77019] flex items-center justify-center'
          }`}
        >
          {hasValue ? '올리기' : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    )
  }

  // Expanded 모드 — 넉넉한 세로 레이아웃
  return (
    <div className="w-full rounded-[24px] bg-white border border-[#1D1C1C]/5 hover:border-[#F77019]/20 hover:shadow-sm transition-all flex flex-col gap-3 p-5 min-w-0">
      <div className="flex items-start gap-3 w-full min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#F77019] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          C
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={'무엇을 검증하고 싶으세요?\n전문 평가단과 함께 시장 반응을 빠르게 확인해보세요.'}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-[#1D1C1C] placeholder-[#999] font-medium resize-none leading-relaxed pt-1.5"
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#1D1C1C]/5">
        <div className="flex items-center gap-1">
          <ComposerIconBtn icon={<ImageIcon className="w-3.5 h-3.5" />} />
          <ComposerIconBtn icon={<Link2 className="w-3.5 h-3.5" />} />
          <ComposerIconBtn icon={<Smile className="w-3.5 h-3.5" />} />
          <ComposerIconBtn icon={<Sparkles className="w-3.5 h-3.5" />} />
        </div>
        <button
          disabled={!value.trim()}
          className="px-4 py-1.5 rounded-full bg-[#F77019] text-white text-[11px] font-black flex items-center gap-1 hover:opacity-90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3" />
          올리기
        </button>
      </div>
    </div>
  )
}

function ComposerIconBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button type="button" className="w-7 h-7 rounded-full text-[#999] hover:text-[#F77019] hover:bg-[#F77019]/8 transition-colors flex items-center justify-center">
      {icon}
    </button>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  ProfileCard — 우측 상단 프로필 (확장 모드)                */
/* ─────────────────────────────────────────────────────── */

function ProfileCard() {
  return (
    <div className="w-full rounded-[24px] bg-white border border-[#1D1C1C]/5 p-5 flex flex-col gap-4">
      {/* Cover */}
      <div className="h-16 -mx-5 -mt-5 mb-2 rounded-t-[24px] bg-gradient-to-br from-[#F77019] via-[#FF9F45] to-[#FFB74D]" />

      <div className="flex items-center gap-3 -mt-8">
        <div className="w-14 h-14 rounded-full bg-[#F77019] flex items-center justify-center text-white text-lg font-black border-4 border-white">
          C
        </div>
        <div className="flex flex-col gap-0.5 mt-6">
          <span className="text-[13px] font-black text-[#1D1C1C]">jungin0314</span>
          <span className="text-[10px] text-[#999] font-medium">@creator · 가입 3개월</span>
        </div>
      </div>

      <p className="text-[11px] text-[#666] font-medium leading-relaxed">
        1인 빌더 · SaaS / 헬스테크에 관심이 많습니다. 검증 가설부터 같이 정리해요.
      </p>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1D1C1C]/5">
        <Stat label="등록 의뢰" value="12" />
        <Stat label="완료" value="7" />
        <Stat label="진행 중" value="5" />
      </div>

      <button className="w-full py-2.5 rounded-full bg-[#1D1C1C] text-white text-[11px] font-black hover:opacity-90 transition-all">
        프로필 편집
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-black text-[#1D1C1C]">{value}</span>
      <span className="text-[9px] text-[#999] font-bold">{label}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  FilterBar — 카테고리 / 정렬                              */
/* ─────────────────────────────────────────────────────── */

function FilterBar({
  activeCategory,
  setActiveCategory,
  activeSort,
  setActiveSort,
  compact,
}: {
  activeCategory: string
  setActiveCategory: (v: string) => void
  activeSort: string
  setActiveSort: (v: string) => void
  compact?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? 'px-1' : ''}`}>
      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
        {['전체', 'SaaS', '커머스', '핀테크', 'AI / 개발'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full border transition-all ${
              activeCategory === cat
                ? 'bg-[#F77019]/10 border-[#F77019] text-[#F77019]'
                : 'bg-white border-[#1D1C1C]/10 text-[#666] hover:bg-[#F5F5F5]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#666]">
        {['최신순', '인기순', '댓글많은순'].map((sort) => (
          <button
            key={sort}
            onClick={() => setActiveSort(sort)}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              activeSort === sort ? 'text-[#F77019]' : 'text-[#999] hover:text-[#666]'
            }`}
          >
            {sort}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  Weekly Recommend                                       */
/* ─────────────────────────────────────────────────────── */


function WeeklyRecommendMini() {
  return (
    <div
      className="w-full rounded-[24px] border p-4 flex flex-col gap-2"
      style={{
        background: 'linear-gradient(180deg, #FFF3E0 0%, #FFFFFF 80%)',
        borderColor: 'rgba(29,28,28,0.05)',
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-black text-[#F77019]">
        <Flame className="w-3.5 h-3.5" />
        이번 주 추천
      </div>
      <p className="text-[11px] font-black text-[#1D1C1C] leading-snug">검증 성공 사례 연구</p>
      <button className="self-start text-[10px] font-bold text-[#F77019] hover:underline flex items-center gap-0.5">
        읽어보기 <ArrowRight className="w-2.5 h-2.5" />
      </button>
    </div>
  )
}
