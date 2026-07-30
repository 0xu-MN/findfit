'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Clock, Loader2 } from 'lucide-react'
import { useRightPanel } from './RightPanelContext'
import InsightDetailView from './InsightDetailView'
import InsightModalNav from './InsightModalNav'

export type InsightPost = {
  id: string
  type: 'feed' | 'newsroom'
  title: string
  category: string | null
  tag: string | null
  cover_image_url: string | null
  body: string
  author: string
  created_at: string
  like_count?: number
  comment_count?: number
  liked_by_me?: boolean
  scrapped_by_me?: boolean
}

const FILTER_TABS = ['전체', '성공사례', '팁/노하우', '리뷰어 이야기', '트렌드']

// 카테고리/태그 문자열에 색을 고정 배정하기 위한 간단한 팔레트 — DB에는
// 색상을 안 저장하므로(관리자가 텍스트만 입력) 문자열 해시로 팔레트에서
// 하나를 골라 항상 같은 카테고리는 같은 색이 나오게 한다.
const PALETTE = ['#F77019', '#8B5CF6', '#1565C0', '#2E7D32', '#E91E63', '#FF8F00']
function colorFor(label: string | null): string {
  if (!label) return PALETTE[0]
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function readTime(body: string): string {
  return `${Math.max(1, Math.round(body.length / 350))}분`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR')
}

// 인사이트는 관리자만 작성 가능해서, 개인 닉네임(post.author) 대신 항상
// FindFit 브랜드 표기로 통일한다 — 작성자 필드는 DB/관리자 폼엔 남아있지만
// 공개 화면 렌더링에서는 안 쓴다.
function BrandByline({ compact }: { compact?: boolean }) {
  return (
    <span className={`flex items-center gap-1 font-black text-[#1D1C1C] ${compact ? 'text-[9px]' : ''}`}>
      <img src="/logo.png" alt="FindFit" className={compact ? 'h-2.5 w-auto' : 'h-3 w-auto'} />
      FindFit
    </span>
  )
}

interface Props {
  basePath: 'builder' | 'evaluator'
}

// "피드"(→ 화면 표기는 "인사이트") — 예전엔 전부 하드코딩된 샘플 글이었는데,
// 관리자만 작성 가능한 실제 DB 콘텐츠(insight_posts, /api/insights)로
// 교체했다. 카드를 클릭하면 노트폴리오 스타일 상세 페이지로 이동한다.
export default function SharedFeedPanel({ basePath }: Props) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('전체')
  const { isExpanded: ctxExpanded, hasProvider } = useRightPanel()

  const [feedPosts, setFeedPosts] = useState<InsightPost[]>([])
  const [newsItems, setNewsItems] = useState<InsightPost[]>([])
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
    }
    load()
  }, [])

  // 패널 너비 감지 — fallback (단독 페이지 호환)
  const containerRef = useRef<HTMLDivElement>(null)
  const [widthExpanded, setWidthExpanded] = useState(false)

  useEffect(() => {
    if (hasProvider || !containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidthExpanded(entry.contentRect.width > 700)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasProvider])

  // Context가 있으면 Context, 없으면 너비 측정 fallback
  const isExpanded = hasProvider ? ctxExpanded : widthExpanded
  const isNarrow = !isExpanded // 축소 모드일 때 반응형 적용

  const heroPost = feedPosts[0] ?? null
  // 최신 글도 그리드 목록에 같이 나오게 한다 — 히어로는 "크게 보여주는 것"일
  // 뿐 목록에서 빼는 게 아니다(예전엔 slice(1)이라 최신 글이 그리드엔 아예
  // 안 보여서 사용자가 "안 보인다"고 지적한 부분).
  const filtered = activeFilter === '전체'
    ? feedPosts
    : feedPosts.filter(p => p.category === activeFilter)

  // 예전엔 카드를 누르면 완전히 새 페이지로 이동해서, 목록으로 돌아왔다가
  // 다음 글을 또 눌러야 하는 흐름이었다 — 배경을 흐리게 두고 그 자리에서
  // 바로 다음 글로 넘어갈 수 있는 오버레이로 바꾼다. 히어로 + 그리드를
  // 하나의 순서(allPosts)로 합쳐서 다음/이전 버튼이 이 순서를 따라간다.
  const allPosts = [...feedPosts, ...newsItems]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIndex = selectedId ? allPosts.findIndex((p) => p.id === selectedId) : -1

  const goToDetail = (post: InsightPost) => setSelectedId(post.id)

  // 그리드 컬럼 수 — 축소 시 1열, 확장 시 3열
  const gridCols = isNarrow ? 'repeat(1, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))'

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-[#F77019] animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full min-h-full flex flex-col select-none text-[#1D1C1C]">

      {/* ── Hero Article — 축소 시 세로 적층, 확장 시 좌우 분할 ── */}
      {heroPost ? (
        <div className="pb-8 border-b border-[#1D1C1C]/6 cursor-pointer" onClick={() => goToDetail(heroPost)}>
          <div className={`gap-5 ${isNarrow ? 'flex flex-col' : 'flex items-stretch gap-7'}`}>
            {/* 썸네일 */}
            <div
              className={`flex-shrink-0 rounded-2xl overflow-hidden bg-[#F0F0F2] ${isNarrow ? 'w-full aspect-[16/9]' : 'aspect-[3/2]'}`}
              style={isNarrow ? undefined : { width: '44%' }}
            >
              {heroPost.cover_image_url && (
                <img src={heroPost.cover_image_url} alt={heroPost.title} className="w-full h-full object-cover" />
              )}
            </div>
            {/* 텍스트 */}
            <div className={`flex-1 min-w-0 flex flex-col gap-3 ${isNarrow ? '' : 'justify-center gap-4 py-2'}`}>
              <h1
                className="font-black text-[#1D1C1C] leading-snug"
                style={{ fontSize: isNarrow ? 'clamp(17px,3.5vw,22px)' : 'clamp(20px,2.2vw,30px)' }}
              >
                {heroPost.title}
              </h1>
              <p className={`text-[#666] leading-relaxed ${isNarrow ? 'text-[12px] line-clamp-3' : 'text-[13px]'}`}>
                {heroPost.body}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-[#999] font-medium flex-wrap">
                <BrandByline />
                <span>{fmtDate(heroPost.created_at)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />읽기 {readTime(heroPost.body)}</span>
              </div>
              {heroPost.category && (
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#1D1C1C]/10 text-[#666]">
                    {heroPost.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-8 border-b border-[#1D1C1C]/6">
          <p className="text-[12px] font-bold text-[#999] py-8 text-center">아직 등록된 인사이트가 없습니다</p>
        </div>
      )}

      {/* ── Main Content (+ Sidebar 확장 시만) ── */}
      <div className={`pt-7 pb-10 ${isNarrow ? 'flex flex-col gap-6' : 'flex gap-8'}`}>

        {/* ── Latest Posts ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-black text-[#1D1C1C]">최신 인사이트</h2>
            <button
              onClick={() => router.push(`/${basePath}/feed/scraps`)}
              className="flex items-center gap-1.5 text-[10px] font-black text-[#1565C0] hover:underline"
            >
              <Bookmark className="w-3.5 h-3.5" /> 스크랩한 글
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveFilter(tab)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all"
                style={activeFilter === tab
                  ? { background: '#F77019', color: '#fff', borderColor: '#F77019' }
                  : { background: '#fff', color: '#666', borderColor: 'rgba(29,28,28,0.1)' }
                }>
                {tab}
              </button>
            ))}
          </div>

          {/* Card grid — 축소 시 1열, 확장 시 3열 */}
          {filtered.length === 0 ? (
            <p className="text-[11px] font-bold text-[#999] py-8 text-center">해당 카테고리의 글이 없습니다</p>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: gridCols }}>
              {filtered.map(post => (
                <FeedCard key={post.id} post={post} horizontal={isNarrow} onClick={() => goToDetail(post)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Newsroom sidebar ── */}
        <div
          className={`flex-shrink-0 flex flex-col gap-4 ${isNarrow ? 'w-full pt-6 border-t border-[#1D1C1C]/10' : ''}`}
          style={isNarrow ? undefined : { width: 300 }}
        >
          <div className="flex items-center justify-between border-b border-[#1D1C1C]/10 pb-3">
            <h2 className="text-[17px] font-black text-[#1D1C1C] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F77019]" />
              파인드핏 뉴스룸
            </h2>
            <span className="text-[11px] font-bold text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-full">NEWS</span>
          </div>

          {newsItems.length === 0 ? (
            <p className="text-[11px] font-bold text-[#999] py-6 text-center">아직 등록된 소식이 없습니다</p>
          ) : (
            <div className={isNarrow ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'flex flex-col gap-3.5'}>
              {newsItems.slice(0, isNarrow ? 4 : newsItems.length).map((item) => (
                <div
                  key={item.id}
                  onClick={() => goToDetail(item)}
                  className="p-4 rounded-2xl bg-white border border-[#1D1C1C]/10 hover:border-[#F77019] hover:shadow-md transition-all cursor-pointer flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-md text-white"
                      style={{ background: colorFor(item.tag) }}
                    >
                      {item.tag ?? '소식'}
                    </span>
                    <span className="text-[10px] font-bold text-[#999]">{fmtDate(item.created_at)}</span>
                  </div>
                  <h3 className="text-[13px] font-black text-[#1D1C1C] leading-snug group-hover:text-[#F77019] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-medium text-[#666] line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 예전엔 카드를 누르면 완전히 새 페이지로 이동해서 "다음 글도 계속
          이어서 보기"가 안 됐다 — 배경을 흐리게 두는 오버레이로 열고,
          다음/이전 버튼으로 같은 자리에서 바로 넘어갈 수 있게 한다. */}
      {selectedIndex >= 0 && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedId(null)}
        >
          <InsightModalNav
            onClose={() => setSelectedId(null)}
            onNext={selectedIndex < allPosts.length - 1 ? () => setSelectedId(allPosts[selectedIndex + 1].id) : undefined}
            onPrev={selectedIndex > 0 ? () => setSelectedId(allPosts[selectedIndex - 1].id) : undefined}
          />
          <div
            className="w-full max-w-[1080px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <InsightDetailView
              postId={allPosts[selectedIndex].id}
              basePath={basePath}
              onClose={() => setSelectedId(null)}
              onNext={selectedIndex < allPosts.length - 1 ? () => setSelectedId(allPosts[selectedIndex + 1].id) : undefined}
              onPrev={selectedIndex > 0 ? () => setSelectedId(allPosts[selectedIndex - 1].id) : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FeedCard({ post, horizontal, onClick }: { post: InsightPost; horizontal?: boolean; onClick: () => void }) {
  const categoryColor = colorFor(post.category)

  if (horizontal) {
    // 축소 시 — 좌측 썸네일 + 우측 텍스트 가로 카드
    return (
      <article onClick={onClick} className="flex items-start gap-3 group cursor-pointer p-3 rounded-2xl bg-white border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-all">
        <div className="flex-shrink-0 rounded-xl overflow-hidden bg-[#F0F0F2] w-[100px] aspect-[4/3]">
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-md"
                style={{ color: categoryColor, background: `${categoryColor}12`, border: `1px solid ${categoryColor}20` }}
              >
                {post.category}
              </span>
            )}
            <span className="text-[9px] text-[#BBB] font-medium">{fmtDate(post.created_at)}</span>
          </div>
          <h3 className="text-[12px] font-black text-[#1D1C1C] leading-snug line-clamp-2 group-hover:text-[#F77019] transition-colors">
            {post.title}
          </h3>
          <p className="text-[10px] text-[#888] leading-relaxed line-clamp-2">{post.body}</p>
          <div className="flex items-center justify-between mt-0.5 text-[9px] text-[#999] font-medium">
            <BrandByline compact />
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{readTime(post.body)}</span>
          </div>
        </div>
      </article>
    )
  }

  // 확장 시 — 세로 카드 (기존 3-column 그리드용)
  return (
    <article onClick={onClick} className="flex flex-col gap-3 group cursor-pointer">
      <div className="w-full rounded-2xl overflow-hidden bg-[#F0F0F2]" style={{ aspectRatio: '4 / 3' }}>
        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {post.category && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-md"
              style={{ color: categoryColor, background: `${categoryColor}12`, border: `1px solid ${categoryColor}20` }}>
              {post.category}
            </span>
          )}
          <span className="text-[9px] text-[#BBB] font-medium">{fmtDate(post.created_at)}</span>
        </div>
        <h3 className="text-[12px] font-black text-[#1D1C1C] leading-snug line-clamp-2 group-hover:text-[#F77019] transition-colors">
          {post.title}
        </h3>
        <p className="text-[10px] text-[#888] leading-relaxed line-clamp-2">{post.body}</p>
        <div className="flex items-center justify-between mt-1">
          <BrandByline compact />
          <span className="text-[9px] text-[#BBB] font-medium flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{readTime(post.body)}
          </span>
        </div>
      </div>
    </article>
  )
}
