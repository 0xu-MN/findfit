'use client'

import { Loader2, MessageSquare, ThumbsUp, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type LoungePostRow = {
  id: string
  author_id: string
  author_nickname: string
  body: string
  created_at: string
  like_count: number
  comment_count: number
}

// 부적절/부정적인 라운지 글을 관리자가 강제로 삭제할 수 있게 하는 패널.
// 목록/삭제만 필요하고 작성·수정은 필요 없어 인사이트 관리보다 단순하다.
export default function AdminLoungePage() {
  const [posts, setPosts] = useState<LoungePostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/lounge')
    const { posts: data } = await res.json()
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 글을 삭제할까요? 댓글/좋아요도 함께 삭제됩니다.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/lounge/${id}`, { method: 'DELETE' })
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="admin-card border-b admin-border px-6 py-4 flex items-center gap-4">
        <span className="text-[14px] font-black admin-text">라운지 관리</span>
        <span className="text-[10px] font-bold admin-text-dim">부적절한 글을 찾아 삭제할 수 있어요</span>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-8 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin admin-text-dim" />
          </div>
        ) : posts.length === 0 ? (
          <div className="admin-card rounded-2xl border admin-border p-8 text-center">
            <p className="text-[11px] font-bold admin-text-dim">작성된 글이 없습니다</p>
          </div>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="admin-card rounded-2xl border admin-border p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black admin-text">{p.author_nickname}</span>
                  <span className="text-[9px] font-bold admin-text-dim">
                    {new Date(p.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="flex items-center gap-1 text-[10px] font-black text-[#CCC] hover:text-red-500 disabled:opacity-40 transition-colors"
                >
                  {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  삭제
                </button>
              </div>
              <p className="text-[12px] font-medium admin-text whitespace-pre-line leading-relaxed">{p.body}</p>
              <div className="flex items-center gap-4 text-[10px] font-bold admin-text-dim">
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {p.like_count}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p.comment_count}</span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
