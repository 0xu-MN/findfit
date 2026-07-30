'use client'

import { ArrowLeft, Bookmark, Loader2, MessageSquare, Share2, ThumbsUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InsightPost } from './SharedFeedPanel'

type Comment = { id: string; author_nickname: string; body: string; created_at: string }

interface Props {
  postId: string
  // 모달 모드(SharedFeedPanel 오버레이)에서만 넘어온다 — 있으면 뒤로가기
  // 대신 닫기 버튼을 쓰고, 다음/이전 글 버튼도 보여준다. 없으면(기존
  // /[basePath]/feed/[id] 단독 페이지) 지금까지처럼 전체 페이지로 렌더링.
  basePath?: 'builder' | 'evaluator'
  onClose?: () => void
  onNext?: () => void
  onPrev?: () => void
}

// 인사이트 상세 — 좋아요/스크랩/댓글/공유가 전부 장식용 로컬 state였던 걸
// 실제 백엔드(insight_likes/insight_scraps/insight_comments)로 교체했다.
export default function InsightDetailView({ postId, basePath, onClose, onNext, onPrev }: Props) {
  const router = useRouter()
  const [post, setPost] = useState<InsightPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setLoggedIn(Boolean(user)))
  }, [])

  // 모달 모드에서 화살표 키로도 다음/이전 글, Esc로 닫기 — 화면 양 끝의
  // 큰 버튼(ModalNavButtons)과 같은 동작을 키보드로도 쓸 수 있게.
  useEffect(() => {
    if (!onClose) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && onNext) onNext()
      else if (e.key === 'ArrowLeft' && onPrev) onPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNext, onPrev])

  useEffect(() => {
    setLoading(true)
    setShowComments(false)
    setComments(null)
    const load = async () => {
      const res = await fetch(`/api/insights/${postId}`)
      if (!res.ok) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const { post: data } = await res.json()
      setPost(data)
      setLiked(Boolean(data.liked_by_me))
      setLikeCount(data.like_count ?? 0)
      setSaved(Boolean(data.scrapped_by_me))
      setLoading(false)
    }
    load()
  }, [postId])

  const toggleLike = async () => {
    if (!loggedIn) return
    const next = !liked
    setLiked(next)
    setLikeCount((c) => c + (next ? 1 : -1))
    const res = await fetch(`/api/insights/${postId}/like`, { method: 'POST' })
    if (!res.ok) {
      // 실패하면 낙관적 업데이트를 되돌린다
      setLiked(!next)
      setLikeCount((c) => c + (next ? -1 : 1))
    }
  }

  const toggleSave = async () => {
    if (!loggedIn) return
    const next = !saved
    setSaved(next)
    const res = await fetch(`/api/insights/${postId}/scrap`, { method: 'POST' })
    if (!res.ok) setSaved(!next)
  }

  const openComments = async () => {
    setShowComments((v) => !v)
    if (comments === null) {
      const res = await fetch(`/api/insights/${postId}/comments`)
      const { comments: data } = await res.json()
      setComments(data ?? [])
    }
  }

  const submitComment = async () => {
    if (!commentInput.trim() || postingComment) return
    setPostingComment(true)
    const res = await fetch(`/api/insights/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentInput.trim() }),
    })
    setPostingComment(false)
    if (res.ok) {
      const { comment } = await res.json()
      setComments((prev) => [...(prev ?? []), comment])
      setCommentInput('')
    }
  }

  const handleShare = () => {
    const url = basePath
      ? `${window.location.origin}/${basePath}/feed/${postId}`
      : window.location.href
    navigator.clipboard?.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 1800)
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[#F77019] animate-spin" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-[28px]">
        <p className="text-sm font-black text-[#999]">글을 찾을 수 없습니다</p>
        <button onClick={() => (onClose ? onClose() : router.back())} className="text-[11px] font-black text-[#F77019] hover:underline">
          {onClose ? '닫기' : '뒤로 가기'}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto py-8">
      {/* 모달 모드(onClose 있음)에서는 이 작은 상단 바 대신, 화면 양 끝에
          큰 버튼(ModalNavButtons, Agent 위젯 토글 버튼과 같은 톤)을 띄운다
          — 예전엔 글 위에 작게 붙어있어서 안 보인다는 피드백이 있었다. */}
      {!onClose && (
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[11px] font-black text-[#666] hover:text-[#1D1C1C] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            목록으로
          </button>
        </div>
      )}

      <div className="rounded-[28px] border border-[#1D1C1C]/8 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row">
        {/* 본문 컬럼 */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 p-8 md:p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="FindFit" className="h-5 w-auto" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-[#1D1C1C]">FindFit</span>
              <span className="text-[10px] font-bold text-[#999]">
                {post.category ?? (post.type === 'newsroom' ? '뉴스룸' : '인사이트')}
              </span>
            </div>
            {post.tag && (
              <span className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-[#F77019]/10 text-[#F77019]">
                {post.tag}
              </span>
            )}
          </div>

          <h1 className="text-[24px] md:text-[28px] font-black text-[#1D1C1C] leading-snug">{post.title}</h1>

          <div className="flex items-center gap-2 text-[10px] font-bold text-[#999]">
            <span className="flex items-center gap-1">
              <img src="/logo.png" alt="" className="h-3 w-auto" />FindFit
            </span>
            <span>·</span>
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
          </div>

          <p className="text-[14px] text-[#333] leading-relaxed whitespace-pre-line">{post.body}</p>

          {post.cover_image_url && (
            <div className="w-full rounded-2xl overflow-hidden bg-[#F0F0F2]">
              <img src={post.cover_image_url} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          {/* 댓글 — 아이콘 레일에서 열고 닫는다 */}
          {showComments && (
            <div className="flex flex-col gap-3 pt-4 border-t border-[#1D1C1C]/6">
              <span className="text-[12px] font-black text-[#1D1C1C]">댓글 {comments?.length ?? 0}</span>
              {comments === null ? (
                <Loader2 className="w-4 h-4 text-[#999] animate-spin" />
              ) : comments.length === 0 ? (
                <p className="text-[11px] font-bold text-[#999]">첫 댓글을 남겨보세요</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {comments.map((c) => (
                    <div key={c.id} className="flex flex-col gap-0.5 bg-[#F8F9FA] rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#1D1C1C]">{c.author_nickname}</span>
                        <span className="text-[9px] font-bold text-[#999]">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <p className="text-[11px] font-medium text-[#333]">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
              {loggedIn && (
                <div className="flex gap-2 mt-1">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    placeholder="댓글을 입력하세요"
                    className="flex-1 h-9 rounded-lg bg-[#F5F5F5] px-3 text-[11px] font-bold outline-none focus:ring-1 focus:ring-[#F77019]"
                  />
                  <button
                    onClick={submitComment}
                    disabled={postingComment || !commentInput.trim()}
                    className="px-3 h-9 rounded-lg bg-[#F77019] text-white text-[11px] font-black disabled:opacity-50"
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측 액션 아이콘 레일 */}
        <div className="w-full md:w-[88px] flex-shrink-0 border-t md:border-t-0 md:border-l border-[#1D1C1C]/6 bg-[#FAFAFA] flex flex-row md:flex-col items-center justify-center gap-6 py-4 md:py-10">
          <RailButton
            icon={ThumbsUp}
            label={`좋아요${likeCount > 0 ? ` ${likeCount}` : ''}`}
            active={liked}
            activeColor="#F77019"
            onClick={toggleLike}
          />
          <RailButton
            icon={Bookmark}
            label="저장"
            active={saved}
            activeColor="#1565C0"
            onClick={toggleSave}
          />
          <RailButton icon={MessageSquare} label="댓글" active={showComments} activeColor="#2E7D32" onClick={openComments} />
          <RailButton icon={Share2} label={shareCopied ? '복사됨!' : '공유'} onClick={handleShare} />
        </div>
      </div>
    </div>
  )
}

function RailButton({
  icon: Icon,
  label,
  active,
  activeColor,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  activeColor?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
      style={{ color: active ? activeColor : undefined }}
    >
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors ${
          active ? '' : 'border-[#1D1C1C]/10 text-[#666] group-hover:border-[#F77019]/40 group-hover:text-[#F77019]'
        }`}
        style={active ? { borderColor: activeColor, color: activeColor, background: `${activeColor}12` } : undefined}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-[9px] font-bold text-[#999] whitespace-nowrap">{label}</span>
    </button>
  )
}
