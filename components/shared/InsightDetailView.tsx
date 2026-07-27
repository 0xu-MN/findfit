'use client'

import { ArrowLeft, Bookmark, Loader2, MessageSquare, Share2, ThumbsUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { InsightPost } from './SharedFeedPanel'

interface Props {
  postId: string
}

// 인사이트(구 "피드") 상세 — 노트폴리오 포트폴리오 상세 페이지 참고: 좌측에
// 작성자 배지/제목/본문/큰 커버 이미지가 세로로 흐르고, 우측에 좋아요·저장·
// 댓글·공유 아이콘 레일이 세로로 붙는 카드 레이아웃. /api/insights/[id]로
// 조회하며, 관리자가 작성한 글만 존재하므로 좋아요/댓글 수는 표시용 정적
// 카운트다(실제 상호작용 저장은 이번 범위 밖).
export default function InsightDetailView({ postId }: Props) {
  const router = useRouter()
  const [post, setPost] = useState<InsightPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/insights/${postId}`)
      if (!res.ok) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const { post: data } = await res.json()
      setPost(data)
      setLoading(false)
    }
    load()
  }, [postId])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[#F77019] animate-spin" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-sm font-black text-[#999]">글을 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="text-[11px] font-black text-[#F77019] hover:underline">
          뒤로 가기
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[11px] font-black text-[#666] hover:text-[#1D1C1C] transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        목록으로
      </button>

      <div className="rounded-[28px] border border-[#1D1C1C]/8 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.05)] overflow-hidden flex">
        {/* 본문 컬럼 */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 p-8 md:p-10">
          {/* 작성자 배지 — 관리자 전용 글이라 개인 닉네임 대신 FindFit 브랜드로 표기 */}
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
        </div>

        {/* 우측 액션 아이콘 레일 */}
        <div className="w-[88px] flex-shrink-0 border-l border-[#1D1C1C]/6 bg-[#FAFAFA] flex flex-col items-center gap-6 py-10">
          <RailButton
            icon={ThumbsUp}
            label="좋아요"
            active={liked}
            activeColor="#F77019"
            onClick={() => setLiked((v) => !v)}
          />
          <RailButton
            icon={Bookmark}
            label="저장"
            active={saved}
            activeColor="#1565C0"
            onClick={() => setSaved((v) => !v)}
          />
          <RailButton icon={MessageSquare} label="댓글" />
          <RailButton icon={Share2} label="공유" onClick={() => navigator.clipboard?.writeText(window.location.href)} />
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
      <span className="text-[9px] font-bold text-[#999]">{label}</span>
    </button>
  )
}
