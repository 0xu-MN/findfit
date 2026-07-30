'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, MessageSquare, Clock, ChevronRight } from 'lucide-react'
import { loungePosts } from './SharedLoungeFeed'
import type { InsightPost } from './SharedFeedPanel'

const CATEGORY_PALETTE = ['#F77019', '#8B5CF6', '#1565C0', '#2E7D32', '#E91E63', '#FF8F00']
function colorFor(label: string | null): string {
  if (!label) return CATEGORY_PALETTE[0]
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length]
}

interface Props {
  // 크리에이터/리뷰어 각자의 라운지·피드 경로로 "더보기"가 이동해야 해서
  // 역할별 base path를 받는다 (데이터 자체는 role 무관 공용).
  basePath: 'builder' | 'evaluator'
  // 리뷰어 홈의 "실시간 활동" 티커 — 있으면 섹션 제목 바로 아래에 얹는다.
  activityTicker?: React.ReactNode
}

// "지금 FindFit에서 일어나고 있어요" — 예전엔 이 섹션 전체가 가짜 샘플
// 카드였는데, 라운지/피드/뉴스룸 각각 실제 콘텐츠(SharedLoungeFeed.tsx의
// loungePosts, SharedFeedPanel.tsx의 feedPosts/newsItems)를 그대로
// 재사용하도록 교체 — 원본 데이터는 그 파일들에서 export만 추가했을 뿐
// 내용/로직은 안 바꿨다.
export default function HappeningSection({ basePath, activityTicker }: Props) {
  const router = useRouter()
  const [feedPosts, setFeedPosts] = useState<InsightPost[]>([])
  const [newsItems, setNewsItems] = useState<InsightPost[]>([])

  useEffect(() => {
    const load = async () => {
      const [feedRes, newsRes] = await Promise.all([
        fetch('/api/insights?type=feed'),
        fetch('/api/insights?type=newsroom'),
      ])
      const feedBody = await feedRes.json()
      const newsBody = await newsRes.json()
      setFeedPosts(feedBody.posts ?? [])
      setNewsItems(newsBody.posts ?? [])
    }
    load()
  }, [])

  return (
    <section className="w-full max-w-[1500px] mx-auto flex flex-col gap-10 py-6 select-none">
      <h2 className="text-xl font-black text-[#1D1C1C] tracking-tight">
        지금 FindFit에서 일어나고 있어요
      </h2>

      {/* 라운지/인사이트 등 다른 섹션과 동일한 Row 레이아웃(좌측 라벨
          칼럼)을 써서, 실시간 동향만 유독 작고 붙어있는 느낌이 나던
          문제를 맞춘다 — "더보기"는 없는 섹션이라 라벨만 재사용. */}
      {activityTicker && (
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-start">
          <div className="pt-2 flex items-center gap-2 md:flex-col md:items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1CAE66] animate-pulse" />
            <h3 className="text-xl font-black text-[#1D1C1C]">실시간 동향</h3>
          </div>
          {activityTicker}
        </div>
      )}

      {/* ── 라운지 (실제 라운지 게시글) ── */}
      <Row title="라운지" onMore={() => router.push(`/${basePath}/lounge`)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loungePosts.slice(0, 4).map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/${basePath}/lounge`)}
              className="flex flex-col gap-2.5 group cursor-pointer p-4 rounded-2xl bg-white border border-[#1D1C1C]/8 hover:border-[#F77019]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                  style={{ background: post.authorAvatarColor }}
                >
                  {post.author[0]}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-[#1D1C1C] truncate">{post.author}</span>
                  <span className="text-[9px] text-[#999] font-medium">{post.time}</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-[#1D1C1C] leading-snug line-clamp-3 group-hover:text-[#F77019] transition-colors whitespace-pre-line">
                {post.body}
              </p>
              <div className="flex items-center gap-3 text-[#999] mt-auto pt-1">
                <span className="flex items-center gap-1 text-[10px] font-bold"><Heart className="w-3 h-3" />{post.likes}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold"><MessageSquare className="w-3 h-3" />{post.comments}</span>
              </div>
            </div>
          ))}
        </div>
      </Row>

      {/* ── 인사이트 (구 "피드", 실제 DB 콘텐츠) ── */}
      <Row title="인사이트" onMore={() => router.push(`/${basePath}/feed`)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {feedPosts.length === 0 ? (
            <p className="text-[11px] font-bold text-[#999] py-4 col-span-full">아직 등록된 인사이트가 없습니다</p>
          ) : feedPosts.slice(0, 4).map((post) => {
            const categoryColor = colorFor(post.category)
            return (
              <div
                key={post.id}
                onClick={() => router.push(`/${basePath}/feed/${post.id}`)}
                className="flex flex-col gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#EEE] border border-[#1D1C1C]/5 shadow-sm">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </div>
                {post.category && (
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded-md self-start"
                    style={{ color: categoryColor, background: `${categoryColor}12`, border: `1px solid ${categoryColor}20` }}
                  >
                    {post.category}
                  </span>
                )}
                <p className="text-[12px] font-bold text-[#1D1C1C] leading-snug line-clamp-2 group-hover:text-[#F77019] transition-colors">
                  {post.title}
                </p>
                <span className="text-[10px] text-[#999] font-medium flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{post.author}
                </span>
              </div>
            )
          })}
        </div>
      </Row>

      {/* ── 파인드핏 뉴스룸 (인사이트와 별개 콘텐츠) ── */}
      <Row title="파인드핏 뉴스룸" onMore={() => router.push(`/${basePath}/feed`)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newsItems.length === 0 ? (
            <p className="text-[11px] font-bold text-[#999] py-4 col-span-full">아직 등록된 소식이 없습니다</p>
          ) : newsItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/${basePath}/feed/${item.id}`)}
              className="p-4 rounded-2xl bg-white border border-[#1D1C1C]/10 hover:border-[#F77019] hover:shadow-md transition-all cursor-pointer flex flex-col gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md text-white" style={{ background: colorFor(item.tag) }}>
                  {item.tag ?? '소식'}
                </span>
                <span className="text-[10px] font-bold text-[#999]">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <h3 className="text-[13px] font-black text-[#1D1C1C] leading-snug group-hover:text-[#F77019] transition-colors line-clamp-2">
                {item.title}
              </h3>
              <p className="text-[11px] font-medium text-[#666] line-clamp-2 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Row>
    </section>
  )
}

function Row({ title, onMore, children }: { title: string; onMore: () => void; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-start">
      <div className="pt-2 flex items-center justify-between md:flex-col md:items-start gap-1">
        <h3 className="text-xl font-black text-[#1D1C1C]">{title}</h3>
        <button
          onClick={onMore}
          className="flex items-center gap-0.5 text-[10px] font-bold text-[#999] hover:text-[#F77019] transition-colors"
        >
          더보기 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {children}
    </div>
  )
}
