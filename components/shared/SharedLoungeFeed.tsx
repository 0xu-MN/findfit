'use client'

import {
  Heart,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  PenSquare,
  Repeat2,
  Send,
  Share2,
  Smile,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useRightPanel } from './RightPanelContext'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────────────────────────────────────── */
/*  데이터 모델                                              */
/* ─────────────────────────────────────────────────────── */

export type LoungePost = {
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

export const loungePosts: LoungePost[] = [
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
  {
    id: 3,
    author: '노코드빌더',
    authorHandle: 'nocode_builder',
    authorAvatarColor: '#2E7D32',
    category: 'SaaS',
    time: '3시간 전',
    body: 'AI 기반 협업 문서 도구를 만들고 있어요. 베타 테스트 의견 주실 분 모집합니다.\n특히 노션 대비 어떤 점이 매력적인지 듣고 싶어요.',
    images: 1,
    likes: 38,
    comments: 12,
  },
  {
    id: 4,
    author: '밀키트장인',
    authorHandle: 'meal_master',
    authorAvatarColor: '#E91E63',
    category: '커머스',
    time: '5시간 전',
    body: '1인 가구를 위한 프리미엄 반찬 구독 서비스 시장성 어떻게 보세요?\n월 9만원에 주 3회 배송 — 가격이 너무 비싼가 싶기도 하고요.',
    images: 0,
    likes: 47,
    comments: 23,
  },
  {
    id: 5,
    author: '핀테크크리에이터',
    authorHandle: 'fintech_creator',
    authorAvatarColor: '#FF8F00',
    category: '핀테크',
    time: '1일 전',
    body: '소상공인 정산 가속화 대시보드 PMF 테스트 완료! Sean Ellis Score 47% 나왔습니다 🎉\n검증 데이터가 너무 좋아서 공유합니다.',
    images: 2,
    likes: 89,
    comments: 31,
  },
  {
    id: 6,
    author: '펫사랑',
    authorHandle: 'pet_lover',
    authorAvatarColor: '#7B1FA2',
    category: '커머스',
    time: '2일 전',
    body: '반려동물 맞춤 영양제 정기배송 런칭 전 피드백 받고 싶어요.\n종/나이/체중 데이터 기반으로 박스를 조합해서 보내는 컨셉입니다.',
    images: 1,
    likes: 64,
    comments: 18,
  },
]

/* ─────────────────────────────────────────────────────── */
/*  메인 컴포넌트                                            */
/* ─────────────────────────────────────────────────────── */

export default function SharedLoungeFeed() {
  // SharedLoungeFeed는 DashboardLayout에서 '라운지' 탭일 때만 호출됨
  // (메인 탭은 SharedMainPanel, 피드 탭은 SharedFeedPanel이 담당)
  const { isExpanded: ctxExpanded, hasProvider } = useRightPanel()

  // 패널 너비 감지 (Context 외 fallback — 단독 페이지 호환)
  const containerRef = useRef<HTMLDivElement>(null)
  const [widthExpanded, setWidthExpanded] = useState(false)

  useEffect(() => {
    if (hasProvider || !containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidthExpanded(entry.contentRect.width > 900)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasProvider])

  // Context가 있으면 Context, 없으면 너비 측정 fallback
  const isExpanded = hasProvider ? ctxExpanded : widthExpanded

  const [nickname, setNickname] = useState<string | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setNickname(user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? null)
    })
  }, [])

  // 라운지 자체가 아직 백엔드 미연동이라(원래 loungePosts는 정적 목데이터),
  // "글쓰기"로 작성한 글은 로컬 state에만 앞쪽에 추가된다 — 새로고침하면
  // 사라지는 세션 한정 글쓰기다. 실제 영속화(Supabase insert)는 라운지
  // 백엔드 연동 시점의 범위.
  const [posts, setPosts] = useState<LoungePost[]>(loungePosts)
  const [composerOpen, setComposerOpen] = useState(false)

  const submitPost = (body: string) => {
    if (!body.trim()) return
    const newPost: LoungePost = {
      id: Date.now(),
      author: nickname ?? '게스트',
      authorHandle: (nickname ?? 'guest').toLowerCase().replace(/\s+/g, '_'),
      authorAvatarColor: '#F77019',
      category: '자유',
      time: '방금 전',
      body,
      images: 0,
      likes: 0,
      comments: 0,
    }
    setPosts((prev) => [newPost, ...prev])
    setComposerOpen(false)
  }

  const myPosts = posts.filter((p) => nickname && p.author === nickname)

  return (
    <div ref={containerRef} className="w-full h-full flex gap-6 select-none text-[#1D1C1C] min-w-0 animate-fade-in">
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-x-hidden pb-8">
        {/* 포스트 리스트 (트위터 스타일) — 상단 상시 컴포저는 없애고
            "글쓰기" 버튼(우측 사이드바)으로만 작성 모달을 연다 */}
        <div className="w-full rounded-2xl bg-white border border-[#1D1C1C]/5 divide-y divide-[#1D1C1C]/5 overflow-hidden">
          {posts.map((p) => (
            <LoungePostItem key={p.id} post={p} compact={!isExpanded} />
          ))}
        </div>
      </div>

      {/* 우측 사이드바 — 프로필/글쓰기 바로가기/내 글 관리. 넓은 화면에서만
          보여준다(좁으면 기존처럼 단일 컬럼) */}
      {isExpanded && (
        <LoungeSidebar nickname={nickname} myPosts={myPosts} onWriteClick={() => setComposerOpen(true)} />
      )}

      {composerOpen && (
        <ComposerModal nickname={nickname} onClose={() => setComposerOpen(false)} onSubmit={submitPost} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  글쓰기 모달                                              */
/* ─────────────────────────────────────────────────────── */

function ComposerModal({
  nickname,
  onClose,
  onSubmit,
}: {
  nickname: string | null
  onClose: () => void
  onSubmit: (body: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(29,28,28,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-3xl bg-white p-5 flex flex-col gap-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-black text-[#1D1C1C]">새 글 작성</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full text-[#999] hover:text-[#1D1C1C] hover:bg-[#F5F5F5] flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F77019] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
            {(nickname ?? 'C')[0]}
          </div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <textarea
              autoFocus
              rows={4}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="무슨 일이 일어나고 있나요?"
              className="w-full bg-transparent outline-none text-[#1D1C1C] placeholder-[#999] font-medium resize-none leading-relaxed text-[13px]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <CircleIcon><ImageIcon className="w-3.5 h-3.5" /></CircleIcon>
                <CircleIcon><Link2 className="w-3.5 h-3.5" /></CircleIcon>
                <CircleIcon><Smile className="w-3.5 h-3.5" /></CircleIcon>
                <CircleIcon><Sparkles className="w-3.5 h-3.5" /></CircleIcon>
              </div>
              <button
                onClick={() => onSubmit(value)}
                disabled={!value.trim()}
                className="px-4 py-1.5 rounded-full bg-[#F77019] text-white font-black hover:opacity-90 disabled:opacity-40 transition-all shadow-sm text-[11px]"
              >
                올리기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoungePostItem({ post, compact }: { post: LoungePost; compact?: boolean }) {
  return (
    <article
      className={`flex gap-3 hover:bg-[#FAFAFA] transition-colors cursor-pointer ${compact ? 'p-3.5' : 'p-5'}`}
    >
      {/* Avatar */}
      <div
        className={`rounded-full flex items-center justify-center text-white font-black flex-shrink-0 ${
          compact ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm'
        }`}
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
/*  우측 사이드바 — 프로필 + 글쓰기 바로가기 + 내 글 관리       */
/* ─────────────────────────────────────────────────────── */

function LoungeSidebar({
  nickname,
  myPosts,
  onWriteClick,
}: {
  nickname: string | null
  myPosts: LoungePost[]
  onWriteClick: () => void
}) {
  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col gap-4">
      {/* 프로필 카드 */}
      <div className="rounded-2xl bg-white border border-[#1D1C1C]/5 p-5 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-[#F77019]/10 flex items-center justify-center text-[#F77019]">
          <UserIcon className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-black text-[#1D1C1C]">{nickname ?? '게스트'}</span>
          <span className="text-[10px] font-bold text-[#999]">FindFit 멤버</span>
        </div>
        <button
          onClick={onWriteClick}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-opacity"
        >
          <PenSquare className="w-3.5 h-3.5" />
          글쓰기
        </button>
      </div>

      {/* 내가 쓴 글 관리 */}
      <div className="rounded-2xl bg-white border border-[#1D1C1C]/5 p-5 flex flex-col gap-3">
        <span className="text-[11px] font-black text-[#1D1C1C]">내가 쓴 글</span>
        {myPosts.length === 0 ? (
          <p className="text-[10px] font-bold text-[#999] py-4 text-center">아직 작성한 글이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myPosts.map((p) => (
              <div key={p.id} className="flex flex-col gap-1 p-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                <span className="text-[11px] font-bold text-[#1D1C1C] line-clamp-1">{p.body}</span>
                <span className="text-[9px] text-[#999] font-medium">{p.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
