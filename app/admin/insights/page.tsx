'use client'

import { Loader2, Plus, Trash2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'

type InsightPost = {
  id: string
  type: 'feed' | 'newsroom'
  title: string
  category: string | null
  tag: string | null
  cover_image_url: string | null
  body: string
  author: string
  published: boolean
  created_at: string
}

const EMPTY_FORM = {
  type: 'feed' as 'feed' | 'newsroom',
  title: '',
  category: '',
  tag: '',
  cover_image_url: '',
  body: '',
  author: 'FindFit',
  published: true,
}

export default function AdminInsightsPage() {
  const [posts, setPosts] = useState<InsightPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/insights')
    const { posts: data } = await res.json()
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (p: InsightPost) => {
    setEditingId(p.id)
    setForm({
      type: p.type,
      title: p.title,
      category: p.category ?? '',
      tag: p.tag ?? '',
      cover_image_url: p.cover_image_url ?? '',
      body: p.body,
      author: p.author,
      published: p.published,
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/insights/${editingId}` : '/api/admin/insights'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        resetForm()
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/insights/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    load()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors">
          ← 대시보드
        </a>
        <span className="text-[14px] font-black text-[#1D1C1C]">인사이트 관리</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-[1fr_380px] gap-6 items-start">
        {/* 목록 */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-12 text-center">
              <p className="text-[12px] font-bold text-[#999]">작성된 글이 없습니다</p>
            </div>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#1D1C1C]/8 p-4 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#1D1C1C]/5 text-[#666]">
                      {p.type === 'feed' ? '피드' : '뉴스룸'}
                    </span>
                    {!p.published && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-500">비공개</span>
                    )}
                    <span className="text-[12px] font-black text-[#1D1C1C] truncate">{p.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#999]">{p.author} · {new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-[#666] hover:bg-[#F5F5F5] transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 작성/수정 폼 */}
        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 flex flex-col gap-3 sticky top-6">
          <span className="text-[12px] font-black text-[#1D1C1C]">{editingId ? '글 수정' : '새 글 작성'}</span>

          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'feed' | 'newsroom' }))}
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
          >
            <option value="feed">피드</option>
            <option value="newsroom">파인드핏 뉴스룸</option>
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
          />
          <input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="카테고리 (예: 트렌드)"
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
          />
          <input
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            placeholder="태그 (뉴스룸용, 예: NEW)"
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
          />
          <input
            value={form.cover_image_url}
            onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
            placeholder="커버 이미지 URL"
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="본문"
            rows={8}
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2 resize-none"
          />
          <input
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            placeholder="작성자"
            className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
          />
          <label className="flex items-center gap-2 text-[11px] font-bold text-[#666]">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            공개
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? '수정 저장' : '작성'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-[#F5F5F5] text-[#666] text-[11px] font-black hover:bg-[#EBEBEB] transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
