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
  id: number | string
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
  // 실제 lounge_posts row에서 온 글만 좋아요 등 상호작용이 가능하다 —
  // 아래 정적 seed 데이터(HappeningSection 미리보기용)는 장식용이라
  // 백엔드 row가 없어서 상호작용 대상이 아니다.
  liked_by_me?: boolean
}

export type LoungeComment = { id: string; author_nickname: string; body: string; created_at: string }

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

  // 예전엔 lounge_posts 백엔드가 없어서 "글쓰기"가 로컬 state에만 앞쪽에
  // 추가되고 새로고침하면 사라졌다 — 이제 /api/lounge/posts로 실제
  // 영속화한다. 글이 하나도 없으면(첫 방문 등) 보여줄 게 없어 허전하니
  // 그때만 정적 seed를 대신 보여준다(seed는 상호작용 대상이 아님).
  const [posts, setPosts] = useState<LoungePost[]>([])
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  // 리포스트("인용해서 다시 쓰기") 대상 — 있으면 컴포저가 원글을 인용문으로
  // 미리 채워서 연다. 별도 repost 테이블 없이, 실제로 새 lounge_posts
  // row로 남기는 방식이라 새 인프라 없이 진짜로 동작한다.
  const [repostTarget, setRepostTarget] = useState<LoungePost | null>(null)
  // 댓글은 눌렀을 때만 불러온다 — Map<postId, Comment[] | null>(null=아직 안 불러옴)
  const [commentsByPost, setCommentsByPost] = useState<Record<string, LoungeComment[] | null>>({})
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null)

  const loadPosts = async () => {
    const res = await fetch('/api/lounge/posts')
    const { posts: data } = await res.json()
    const mapped: LoungePost[] = (data ?? []).map((p: {
      id: string; author_nickname: string; body: string; created_at: string
      like_count: number; comment_count: number; liked_by_me: boolean
    }) => ({
      id: p.id,
      author: p.author_nickname,
      authorHandle: p.author_nickname.toLowerCase().replace(/\s+/g, '_'),
      authorAvatarColor: '#F77019',
      category: '자유',
      time: new Date(p.created_at).toLocaleDateString('ko-KR'),
      body: p.body,
      images: 0,
      likes: p.like_count,
      comments: p.comment_count,
      liked_by_me: p.liked_by_me,
    }))
    setPosts(mapped)
    setPostsLoaded(true)
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitPost = async (body: string) => {
    if (!body.trim()) return
    const res = await fetch('/api/lounge/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      const { post: p } = await res.json()
      const newPost: LoungePost = {
        id: p.id,
        author: p.author_nickname,
        authorHandle: p.author_nickname.toLowerCase().replace(/\s+/g, '_'),
        authorAvatarColor: '#F77019',
        category: '자유',
        time: '방금 전',
        body: p.body,
        images: 0,
        likes: 0,
        comments: 0,
        liked_by_me: false,
      }
      setPosts((prev) => [newPost, ...prev])
    }
    setComposerOpen(false)
    setRepostTarget(null)
  }

  const toggleLike = async (postId: LoungePost['id']) => {
    if (typeof postId !== 'string') return // seed 목데이터는 상호작용 대상 아님
    setPosts((prev) => prev.map((p) => p.id === postId
      ? { ...p, liked_by_me: !p.liked_by_me, likes: p.likes + (p.liked_by_me ? -1 : 1) }
      : p))
    await fetch(`/api/lounge/posts/${postId}/like`, { method: 'POST' })
  }

  const toggleComments = async (postId: LoungePost['id']) => {
    if (typeof postId !== 'string') return
    const next = openCommentsFor === postId ? null : postId
    setOpenCommentsFor(next)
    if (next && commentsByPost[postId] === undefined) {
      const res = await fetch(`/api/lounge/posts/${postId}/comments`)
      const { comments } = await res.json()
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments ?? [] }))
    }
  }

  const submitComment = async (postId: LoungePost['id'], body: string) => {
    if (typeof postId !== 'string' || !body.trim()) return
    const res = await fetch(`/api/lounge/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    })
    if (!res.ok) return
    const { comment } = await res.json()
    setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }))
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p))
  }

  const [shareCopiedId, setShareCopiedId] = useState<LoungePost['id'] | null>(null)
  const handleShare = (post: LoungePost) => {
    if (typeof post.id !== 'string') return
    navigator.clipboard?.writeText(`${post.author}: ${post.body}\n\n${window.location.href}`)
    setShareCopiedId(post.id)
    setTimeout(() => setShareCopiedId(null), 1800)
  }

  const handleRepost = (post: LoungePost) => {
    if (typeof post.id !== 'string') return
    setRepostTarget(post)
    setComposerOpen(true)
  }

  const handleDelete = async (postId: LoungePost['id']) => {
    if (typeof postId !== 'string') return
    if (!window.confirm('이 글을 삭제할까요?')) return
    const res = await fetch(`/api/lounge/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const displayPosts = postsLoaded && posts.length === 0 ? loungePosts : posts
  const myPosts = displayPosts.filter((p) => nickname && p.author === nickname)

  return (
    <div ref={containerRef} className="w-full h-full flex gap-6 select-none text-[#1D1C1C] min-w-0 animate-fade-in">
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-x-hidden pb-8">
        {/* 포스트 리스트 (트위터 스타일) — 상단 상시 컴포저는 없애고
            "글쓰기" 버튼(우측 사이드바)으로만 작성 모달을 연다 */}
        <div className="w-full rounded-2xl bg-white border border-[#1D1C1C]/5 divide-y divide-[#1D1C1C]/5 overflow-hidden">
          {displayPosts.length === 0 ? (
            <p className="text-[11px] font-bold text-[#999] text-center py-10">
              아직 글이 없어요. 첫 글을 남겨보세요!
            </p>
          ) : (
            displayPosts.map((p) => (
              <LoungePostItem
                key={p.id}
                post={p}
                compact={!isExpanded}
                onLike={() => toggleLike(p.id)}
                onToggleComments={() => toggleComments(p.id)}
                commentsOpen={openCommentsFor === p.id}
                comments={typeof p.id === 'string' ? commentsByPost[p.id] : undefined}
                onSubmitComment={(body) => submitComment(p.id, body)}
                onShare={() => handleShare(p)}
                shareCopied={shareCopiedId === p.id}
                onRepost={() => handleRepost(p)}
              />
            ))
          )}
        </div>
      </div>

      {/* 우측 사이드바 — 프로필/글쓰기 바로가기/내 글 관리. 넓은 화면에서만
          보여준다(좁으면 기존처럼 단일 컬럼) */}
      {isExpanded && (
        <LoungeSidebar nickname={nickname} myPosts={myPosts} onWriteClick={() => setComposerOpen(true)} onDelete={handleDelete} />
      )}

      {composerOpen && (
        <ComposerModal
          nickname={nickname}
          quoting={repostTarget}
          onClose={() => { setComposerOpen(false); setRepostTarget(null) }}
          onSubmit={submitPost}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  글쓰기 모달                                              */
/* ─────────────────────────────────────────────────────── */

function ComposerModal({
  nickname,
  quoting,
  onClose,
  onSubmit,
}: {
  nickname: string | null
  quoting?: LoungePost | null
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
          <span className="text-[13px] font-black text-[#1D1C1C]">{quoting ? '인용해서 다시 쓰기' : '새 글 작성'}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full text-[#999] hover:text-[#1D1C1C] hover:bg-[#F5F5F5] flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {quoting && (
          <div className="rounded-2xl bg-[#F5F5F5] p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-[#1D1C1C]">{quoting.author}</span>
            <p className="text-[11px] text-[#666] font-medium line-clamp-3">{quoting.body}</p>
          </div>
        )}

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
                onClick={() => onSubmit(quoting ? `${value}\n\n인용: ${quoting.author}\n"${quoting.body}"` : value)}
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

function LoungePostItem({
  post,
  compact,
  onLike,
  onToggleComments,
  commentsOpen,
  comments,
  onSubmitComment,
  onShare,
  shareCopied,
  onRepost,
}: {
  post: LoungePost
  compact?: boolean
  onLike?: () => void
  onToggleComments?: () => void
  commentsOpen?: boolean
  comments?: LoungeComment[] | null
  onSubmitComment?: (body: string) => void
  onShare?: () => void
  shareCopied?: boolean
  onRepost?: () => void
}) {
  const [commentInput, setCommentInput] = useState('')
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
          <ActionIcon Icon={Heart} count={post.likes} hover="#E53935" active={post.liked_by_me} onClick={onLike} />
          <ActionIcon Icon={MessageSquare} count={post.comments} hover="#1565C0" active={commentsOpen} onClick={onToggleComments} />
          <ActionIcon Icon={Repeat2} hover="#2E7D32" onClick={onRepost} />
          <ActionIcon Icon={Share2} hover="#666" onClick={onShare} label={shareCopied ? '복사됨!' : undefined} />
        </div>

        {/* 실제 댓글 스레드 — lounge_comments 백엔드 연결 */}
        {commentsOpen && (
          <div className="flex flex-col gap-3 pt-3 pl-3 border-l-2 border-[#1565C0]/20">
            {comments === undefined || comments === null ? (
              <p className="text-[10px] font-bold text-[#999]">불러오는 중...</p>
            ) : comments.length === 0 ? (
              <p className="text-[10px] font-bold text-[#999]">첫 댓글을 남겨보세요</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-black text-[#1D1C1C]">{c.author_nickname}</span>
                  <p className="text-[11px] text-[#1D1C1C] font-medium leading-relaxed">{c.body}</p>
                </div>
              ))
            )}
            <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentInput.trim()) {
                    onSubmitComment?.(commentInput)
                    setCommentInput('')
                  }
                }}
                placeholder="댓글 작성..."
                className="flex-1 bg-[#F5F5F5] rounded-full px-4 py-1.5 outline-none text-[11px] text-[#1D1C1C] placeholder-[#999]"
              />
              <button
                onClick={() => { if (commentInput.trim()) { onSubmitComment?.(commentInput); setCommentInput('') } }}
                className="w-7 h-7 rounded-full text-[#999] hover:text-[#F77019] flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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
  onDelete,
}: {
  nickname: string | null
  myPosts: LoungePost[]
  onWriteClick: () => void
  onDelete: (postId: LoungePost['id']) => void
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
              <div key={p.id} className="flex items-start gap-2 p-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#1D1C1C] line-clamp-1">{p.body}</span>
                  <span className="text-[9px] text-[#999] font-medium">{p.time}</span>
                </div>
                <button
                  onClick={() => onDelete(p.id)}
                  title="삭제"
                  className="text-[9px] font-bold text-[#999] hover:text-red-500 flex-shrink-0 px-1.5 py-0.5 rounded transition-colors"
                >
                  삭제
                </button>
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
  active,
  onClick,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>
  count?: number
  hover: string
  small?: boolean
  active?: boolean
  onClick?: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className="flex items-center gap-1 group transition-colors"
      style={active ? { color: hover } : undefined}
      onMouseEnter={(e) => (e.currentTarget.style.color = hover)}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '' }}
    >
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label ? (
        <span className={`font-bold ${small ? 'text-[9px]' : 'text-[10px]'}`}>{label}</span>
      ) : count !== undefined && count > 0 ? (
        <span className={`font-bold ${small ? 'text-[9px]' : 'text-[10px]'}`}>{count}</span>
      ) : null}
    </button>
  )
}
