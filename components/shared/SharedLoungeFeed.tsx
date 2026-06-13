'use client'

import {
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Repeat2,
  Send,
  Share2,
  Smile,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useRightPanel } from './RightPanelContext'

/* ─────────────────────────────────────────────────────── */
/*  데이터 모델                                              */
/* ─────────────────────────────────────────────────────── */

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

type LoungePost = {
  id: number
  author: string
  authorHandle: string
  authorAvatarColor: string
  category: string
  time: string
  body: string
  images: number // 0/1/2
  likes: number
  comments: number
  replies?: { author: string; avatarColor: string; body: string }[]
}

const loungeFeedItems: FeedItem[] = [
  { id: 1, category: 'SaaS', categoryColor: '#F77019', title: 'AI 기반 협업 문서 도구 "SyncDoc" 피드백 부탁드립니다!', body: '3개월간 사이드프로젝트로 만들어온 협업 문서 도구입니다. AI가 문서 컨텍스트를 이해해서 자동으로 요약/번역/태깅을 해줍니다.', author: '노코드빌더', authorHandle: 'nocode_builder', authorAvatarColor: '#F77019', time: '2시간 전', views: 142, likes: 24, comments: 18, thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', hot: true },
  { id: 2, category: 'AI / 개발', categoryColor: '#1565C0', title: '이더리움 스마트 컨트랙트 원클릭 오딧 툴 — 아이디어 의견?', body: '솔리디티 컨트랙트 코드 한 줄 입력하면 AI가 보안 취약점을 자동 분석해주는 SaaS 아이디어입니다.', author: '블록체인마스터', authorHandle: 'chain_master', authorAvatarColor: '#1565C0', time: '4시간 전', views: 98, likes: 15, comments: 9, thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80', hot: false },
  { id: 3, category: '커머스', categoryColor: '#2E7D32', title: '1인 가구를 위한 프리미엄 반찬 구독 서비스 시장성 있을까요?', body: '1인 가구를 위한 주 3회 배송 반찬 구독 서비스 기획 중입니다. PMF 가능성 있을까요?', author: '밀키트장인', authorHandle: 'meal_master', authorAvatarColor: '#2E7D32', time: '6시간 전', views: 205, likes: 38, comments: 31, thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80', hot: true },
  { id: 4, category: '핀테크', categoryColor: '#F77019', title: '소상공인을 위한 일일 정산 가속화 대시보드 검증 완료!', body: 'FindFit으로 전문가 30명에게 PMF 테스트했고 Sean Ellis Score 47% 나왔습니다.', author: '핀테크크리에이터', authorHandle: 'fintech_creator', authorAvatarColor: '#FF8F00', time: '1일 전', views: 312, likes: 67, comments: 42, thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80', hot: false },
  { id: 5, category: 'SaaS', categoryColor: '#F77019', title: 'B2B 영업 자동화 CRM 툴 MVP 테스트 패널 구합니다.', body: '세일즈포스 대비 1/10 가격으로 만든 B2B CRM입니다. 5명 정도 베타 테스터 모십니다.', author: '세일즈왕', authorHandle: 'sales_king', authorAvatarColor: '#7B1FA2', time: '1일 전', views: 180, likes: 45, comments: 12, thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', hot: false },
  { id: 6, category: '커머스', categoryColor: '#2E7D32', title: '반려동물 맞춤형 영양제 정기배송 런칭 전 피드백', body: '반려동물의 종/나이/체중/건강상태 데이터를 입력하면 맞춤 영양제 박스를 조합해 보내주는 서비스입니다.', author: '펫사랑', authorHandle: 'pet_lover', authorAvatarColor: '#E91E63', time: '2일 전', views: 420, likes: 88, comments: 56, thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80', hot: true },
]

const loungePosts: LoungePost[] = [
  {
    id: 1,
    author: '강똥',
    authorHandle: 'kang_ddong',
    authorAvatarColor: '#F77019',
    category: '카테고리1',
    time: '1일 전',
    body: '안녕하세요 저는 강똥입니다.\n안녕하세요 저는 강똥입니다. 안녕하세요 저는 강똥입니다. 안녕하세요 저는 강똥입니다.',
    images: 2,
    likes: 24,
    comments: 8,
  },
  {
    id: 2,
    author: '포뇨',
    authorHandle: 'ponyo',
    authorAvatarColor: '#1565C0',
    category: '포뇨 포뇨',
    time: '6시간 전',
    body: '안녕세여 저는 포뇨입니다.\n안녕세여 저는 포뇨입니다. 안녕세여 저는 포뇨입니다. 안녕세여 저는 포뇨입니다.',
    images: 1,
    likes: 12,
    comments: 4,
    replies: [
      {
        author: '포뇨 포뇨',
        avatarColor: '#999',
        body: '안녕세여 저는 포뇨입니다. 안녕세여 저는 포뇨입니다. 안녕세여 저는 포뇨입니다. 안녕세여 저는 포뇨입니다.',
      },
    ],
  },
]

/* ─────────────────────────────────────────────────────── */
/*  메인 컴포넌트                                            */
/* ─────────────────────────────────────────────────────── */

export default function SharedLoungeFeed() {
  // SharedLoungeFeed는 DashboardLayout에서 '라운지' 탭일 때만 호출됨
  // (메인 탭은 SharedMainPanel, 피드 탭은 SharedFeedPanel이 담당)
  const { isExpanded: ctxExpanded } = useRightPanel()
  const [composerValue, setComposerValue] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // 패널 너비 감지 (Context 외 fallback — 단독 페이지 호환)
  const containerRef = useRef<HTMLDivElement>(null)
  const [widthExpanded, setWidthExpanded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidthExpanded(entry.contentRect.width > 900)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const isExpanded = ctxExpanded || widthExpanded
  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col gap-5 select-none text-[#1D1C1C] min-w-0 overflow-x-hidden">
      {isExpanded ? (
        /* 확장 모드 — 트위터 스타일 (이미지 1) */
        <LoungeExpandedView />
      ) : (
        /* 수축 모드 — 기존 디자인 유지 (변경 X) */
        <CompactView
          composerValue={composerValue}
          setComposerValue={setComposerValue}
          expandedId={expandedId}
          toggleExpand={toggleExpand}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  CompactView — 패널 닫힘 모드 (건들지 않음)              */
/* ─────────────────────────────────────────────────────── */

function CompactView({
  composerValue,
  setComposerValue,
  expandedId,
  toggleExpand,
}: {
  composerValue: string
  setComposerValue: (v: string) => void
  expandedId: number | null
  toggleExpand: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-4 w-full pb-8 animate-fade-in min-w-0">
      <Composer value={composerValue} onChange={setComposerValue} compact />

      <div className="flex flex-col gap-3 min-w-0">
        <h3 className="text-sm font-black text-[#1D1C1C] flex items-center gap-2 px-1">
          실시간 라운지 피드
          <span className="w-1.5 h-1.5 rounded-full bg-[#81C784]" />
        </h3>

        <div className="flex flex-col gap-3 min-w-0">
          {loungeFeedItems.map((item) => (
            <CompactFeedCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => toggleExpand(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  LoungeExpandedView — 확장 모드 · 트위터 스타일 (이미지 1) */
/* ─────────────────────────────────────────────────────── */

function LoungeExpandedView() {
  return (
    <div className="w-full flex flex-col gap-4 pb-8 animate-fade-in min-w-0">
      {/* 상단 컴포저 */}
      <div className="w-full rounded-2xl bg-white border border-[#1D1C1C]/5 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#F77019] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          C
        </div>
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <textarea
            rows={2}
            placeholder="무슨 일이 일어나고 있나요?"
            className="w-full bg-transparent outline-none text-[13px] text-[#1D1C1C] placeholder-[#999] font-medium resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CircleIcon><ImageIcon className="w-3.5 h-3.5" /></CircleIcon>
              <CircleIcon><Link2 className="w-3.5 h-3.5" /></CircleIcon>
              <CircleIcon><Smile className="w-3.5 h-3.5" /></CircleIcon>
              <CircleIcon><Sparkles className="w-3.5 h-3.5" /></CircleIcon>
            </div>
            <button className="px-4 py-1.5 rounded-full bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-all shadow-sm">
              올리기
            </button>
          </div>
        </div>
      </div>

      {/* 포스트 리스트 (트위터 스타일) */}
      <div className="w-full rounded-2xl bg-white border border-[#1D1C1C]/5 divide-y divide-[#1D1C1C]/5 overflow-hidden">
        {loungePosts.map((p) => (
          <LoungePostItem key={p.id} post={p} />
        ))}
      </div>
    </div>
  )
}

function LoungePostItem({ post }: { post: LoungePost }) {
  return (
    <article className="p-5 flex gap-3 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
        style={{ background: post.authorAvatarColor }}
      >
        {post.author[0]}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* 메타 */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="font-black text-[#1D1C1C]">{post.author}</span>
          <span className="text-[#999] font-medium">{post.category}</span>
          <span className="text-[#999]">·</span>
          <span className="text-[#999] font-medium">{post.time}</span>
        </div>

        {/* 본문 */}
        <p className="text-[12px] text-[#1D1C1C] font-medium leading-relaxed whitespace-pre-line">{post.body}</p>

        {/* 이미지 그리드 */}
        {post.images > 0 && (
          <div className={`grid gap-2 rounded-2xl overflow-hidden ${post.images === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {Array.from({ length: post.images }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gradient-to-br from-[#E5E5E5] to-[#CCCCCC] rounded-2xl" />
            ))}
          </div>
        )}

        {/* 액션 바 */}
        <div className="flex items-center gap-6 text-[#999]">
          <ActionIcon Icon={Heart} count={post.likes} hover="#E53935" />
          <ActionIcon Icon={MessageSquare} count={post.comments} hover="#1565C0" />
          <ActionIcon Icon={Repeat2} count={0} hover="#2E7D32" />
          <ActionIcon Icon={Share2} count={0} hover="#666" />
        </div>

        {/* 인라인 답글 */}
        {post.replies && post.replies.length > 0 && (
          <div className="flex flex-col gap-3 pt-3 pl-3 border-l-2 border-[#1D1C1C]/10">
            {post.replies.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                  style={{ background: r.avatarColor }}
                >
                  {r.author[0]}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="text-[11px] font-black text-[#1D1C1C]">{r.author}</span>
                  <p className="text-[11px] text-[#1D1C1C] font-medium leading-relaxed">{r.body}</p>
                  <div className="flex items-center gap-3 mt-1 text-[#999]">
                    <ActionIcon Icon={Heart} hover="#E53935" small />
                    <ActionIcon Icon={MessageSquare} hover="#1565C0" small />
                    <ActionIcon Icon={Share2} hover="#666" small />
                  </div>
                </div>
              </div>
            ))}

            {/* 답글 작성 입력 */}
            <div className="flex items-center gap-2.5 mt-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                style={{ background: '#999' }}
              >
                C
              </div>
              <div className="flex-1 flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full bg-[#F5F5F5]">
                <input
                  type="text"
                  placeholder="답글 작성..."
                  className="flex-1 bg-transparent outline-none text-[11px] text-[#1D1C1C] placeholder-[#999]"
                />
                <button className="w-6 h-6 rounded-full text-[#999] hover:text-[#F77019] flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  공통 작은 컴포넌트들                                      */
/* ─────────────────────────────────────────────────────── */

function CircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="w-7 h-7 rounded-full text-[#999] hover:text-[#F77019] hover:bg-[#F77019]/8 transition-colors flex items-center justify-center">
      {children}
    </button>
  )
}

function ActionIcon({
  Icon,
  count,
  hover,
  small,
}: {
  Icon: React.ComponentType<{ className?: string }>
  count?: number
  hover: string
  small?: boolean
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 group transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.color = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.color = '')}
    >
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {count !== undefined && count > 0 && (
        <span className={`font-bold ${small ? 'text-[9px]' : 'text-[10px]'}`}>{count}</span>
      )}
    </button>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  Composer + CompactFeedCard — 수축 모드 전용 (이전 그대로) */
/* ─────────────────────────────────────────────────────── */

function Composer({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
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
  return null
}

function CompactFeedCard({
  item,
  expanded,
  onToggle,
}: {
  item: FeedItem
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <article
      className={`rounded-[24px] bg-white border transition-all duration-300 overflow-hidden ${
        expanded ? 'border-[#F77019]/40 shadow-[0_8px_28px_rgba(247,112,25,0.10)]' : 'border-[#1D1C1C]/5 hover:border-[#F77019]/20 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-black w-9 h-9 text-xs"
          style={{ background: item.authorAvatarColor }}
        >
          {item.author[0]}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-black text-[#1D1C1C]">{item.author}</span>
            <span className="text-[10px] text-[#999] font-medium">@{item.authorHandle}</span>
            <span className="text-[10px] text-[#999]">·</span>
            <span className="text-[10px] text-[#999] font-medium">{item.time}</span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ml-auto"
              style={{ color: item.categoryColor, borderColor: `${item.categoryColor}25`, background: `${item.categoryColor}08` }}
            >
              {item.category}
            </span>
            {item.hot && (
              <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                🔥 HOT
              </span>
            )}
          </div>

          <h5
            onClick={onToggle}
            className={`font-black text-[#1D1C1C] leading-snug cursor-pointer hover:text-[#F77019] transition-colors text-[13px] ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            {item.title}
          </h5>

          {expanded ? (
            <p className="text-[12px] text-[#444] leading-relaxed whitespace-pre-line">{item.body}</p>
          ) : (
            <p className="text-[11px] text-[#666] leading-relaxed line-clamp-1">{item.body}</p>
          )}

          {expanded && (
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mt-2 border border-[#1D1C1C]/5">
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="self-start flex items-center gap-1 text-[10px] font-black text-[#F77019] hover:underline mt-0.5"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> 접기</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> view all</>
            )}
          </button>

          <div className={`flex items-center justify-between text-[10px] text-[#999] font-bold ${expanded ? 'pt-3 mt-2 border-t border-[#1D1C1C]/5' : 'pt-2'}`}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {item.likes}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {item.comments}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item.views}</span>
            </div>
          </div>
        </div>

        {!expanded && (
          <div
            onClick={onToggle}
            className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer border border-[#1D1C1C]/5 w-[72px] h-[72px]"
          >
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
          </div>
        )}
      </div>
    </article>
  )
}
