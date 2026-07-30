'use client'

import { useEffect, useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import InsightDetailView from './InsightDetailView'
import InsightModalNav from './InsightModalNav'
import type { InsightPost } from './SharedFeedPanel'

interface Props {
  basePath: 'builder' | 'evaluator'
}

// 스크랩한 인사이트 글 목록 — 그리드 형식. 예전엔 스크랩 버튼을 눌러도
// 어디서 확인하는지 방법이 없었다(/api/insights/scraps는 있었지만 보여줄
// 화면이 없었음).
export default function SharedScrapGrid({ basePath }: Props) {
  const [posts, setPosts] = useState<InsightPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIndex = selectedId ? posts.findIndex((p) => p.id === selectedId) : -1

  useEffect(() => {
    fetch('/api/insights/scraps')
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-[#F77019] animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-black text-[#1D1C1C] flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[#1565C0]" />
          스크랩한 글
        </h1>
        <p className="text-[11px] font-bold text-[#999] mt-1">저장해둔 인사이트를 모아봤어요</p>
      </div>

      {posts.length === 0 ? (
        <div className="w-full py-24 flex flex-col items-center gap-2 text-center">
          <Bookmark className="w-8 h-8 text-[#DDD]" />
          <p className="text-[12px] font-bold text-[#999]">아직 스크랩한 글이 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedId(post.id)}
              className="flex flex-col gap-2 group cursor-pointer"
            >
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#EEE] border border-[#1D1C1C]/5 shadow-sm">
                {post.cover_image_url && (
                  <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
              </div>
              {post.category && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md self-start bg-[#1565C0]/10 text-[#1565C0]">
                  {post.category}
                </span>
              )}
              <p className="text-[12px] font-bold text-[#1D1C1C] leading-snug line-clamp-2 group-hover:text-[#F77019] transition-colors">
                {post.title}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedIndex >= 0 && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedId(null)}
        >
          <InsightModalNav
            onClose={() => setSelectedId(null)}
            onNext={selectedIndex < posts.length - 1 ? () => setSelectedId(posts[selectedIndex + 1].id) : undefined}
            onPrev={selectedIndex > 0 ? () => setSelectedId(posts[selectedIndex - 1].id) : undefined}
          />
          <div className="w-full max-w-[1080px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <InsightDetailView
              postId={posts[selectedIndex].id}
              basePath={basePath}
              onClose={() => setSelectedId(null)}
              onNext={selectedIndex < posts.length - 1 ? () => setSelectedId(posts[selectedIndex + 1].id) : undefined}
              onPrev={selectedIndex > 0 ? () => setSelectedId(posts[selectedIndex - 1].id) : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}
