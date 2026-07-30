'use client'

import { ImagePlus, Loader2, Plus, Trash2, Pencil, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setUploadError('')
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

  const uploadCover = async (file: File) => {
    setUploading(true)
    setUploadError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/insights/upload', { method: 'POST', body })
      const data = await res.json()
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, cover_image_url: data.url }))
      } else {
        setUploadError(data.error ?? '업로드에 실패했어요')
      }
    } catch {
      setUploadError('업로드에 실패했어요')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="bg-[#15171C] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <span className="text-[14px] font-black text-white">인사이트 관리</span>
        <button
          onClick={resetForm}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-black text-[#F77019] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> 새 글
        </button>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 py-8 grid grid-cols-[240px_1fr_1fr] gap-5 items-start">
        {/* 글 목록 */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-wider px-1">전체 글</span>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-white/40" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-[#15171C] rounded-2xl border border-white/5 p-6 text-center">
              <p className="text-[11px] font-bold text-white/40">작성된 글이 없습니다</p>
            </div>
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                onClick={() => startEdit(p)}
                className={`bg-[#15171C] rounded-xl border p-3 flex flex-col gap-1 cursor-pointer transition-colors ${
                  editingId === p.id ? 'border-[#F77019] bg-[#F77019]/5' : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/60">
                    {p.type === 'feed' ? '피드' : '뉴스룸'}
                  </span>
                  {!p.published && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-500">비공개</span>
                  )}
                </div>
                <span className="text-[11px] font-black text-white line-clamp-1">{p.title}</span>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white/40">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                    className="p-1 rounded text-[#CCC] hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 에디터 — 노션 스타일: 큰 제목/본문 블록 위주 */}
        <div className="bg-[#15171C] rounded-3xl border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> {editingId ? '글 수정' : '새 글 작성'}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'feed' | 'newsroom' }))}
                className="text-[10px] font-bold border border-white/8 rounded-lg px-2 py-1.5"
              >
                <option value="feed">피드</option>
                <option value="newsroom">뉴스룸</option>
              </select>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                공개
              </label>
            </div>
          </div>

          {/* 제목 — 큰 노션 스타일 헤딩 인풋 */}
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목 없음"
            className="w-full text-[22px] font-black text-white outline-none placeholder-[#DDD] border-b border-white/5 pb-3"
          />

          <div className="flex items-center gap-2">
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="카테고리 (예: 트렌드)"
              className="flex-1 text-[11px] font-bold border border-white/8 rounded-lg px-3 py-2"
            />
            <input
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder="태그 (예: NEW)"
              className="flex-1 text-[11px] font-bold border border-white/8 rounded-lg px-3 py-2"
            />
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              placeholder="작성자"
              className="flex-1 text-[11px] font-bold border border-white/8 rounded-lg px-3 py-2"
            />
          </div>

          {/* 커버 이미지 — 파일 업로드(드래그앤드롭) + URL 직접입력 둘 다 지원 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">커버 이미지</span>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) uploadCover(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className="relative flex items-center gap-3 h-14 rounded-xl border border-dashed border-white/12 bg-transparent px-4 cursor-pointer hover:border-[#F77019] hover:bg-[#F77019]/5 transition-colors overflow-hidden"
            >
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              )}
              {uploading ? (
                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4 text-white/40 flex-shrink-0" />
              )}
              <span className="text-[11px] font-bold text-white/60 flex-1 truncate">
                {form.cover_image_url ? form.cover_image_url : '클릭하거나 파일을 끌어다 놓으세요 (JPG·PNG·WEBP·GIF, 5MB 이하)'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f) }}
              />
            </div>
            <input
              value={form.cover_image_url}
              onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
              placeholder="또는 이미지 URL을 직접 입력"
              className="text-[10px] font-bold border border-white/8 rounded-lg px-3 py-1.5"
            />
            {uploadError && <span className="text-[9px] font-bold text-red-500">{uploadError}</span>}
          </div>

          {/* 본문 — 큰 블록 텍스트 영역 */}
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="본문을 입력하세요..."
            rows={14}
            className="w-full text-[13px] leading-relaxed text-white outline-none resize-none placeholder-[#CCC]"
          />

          <div className="flex gap-2 pt-1 border-t border-white/5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5 mt-3"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? '수정 저장' : '작성'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-[11px] font-black hover:bg-white/10 transition-colors mt-3"
              >
                취소
              </button>
            )}
          </div>
        </div>

        {/* 실시간 미리보기 — 실제 인사이트 상세 페이지와 동일한 모양으로 즉시 반영 */}
        <div className="sticky top-6 flex flex-col gap-2">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-wider px-1">실시간 미리보기</span>
          <div className="rounded-3xl border border-white/5 bg-[#15171C] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 bg-[#F77019]">
                  {form.author ? form.author[0] : <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-white truncate">{form.author || '작성자 없음'}</span>
                  <span className="text-[9px] font-bold text-white/40">
                    {form.category || (form.type === 'newsroom' ? '뉴스룸' : '인사이트')}
                  </span>
                </div>
                {form.tag && (
                  <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-[#F77019]/10 text-[#F77019] flex-shrink-0">
                    {form.tag}
                  </span>
                )}
              </div>

              <h1 className="text-[18px] font-black text-white leading-snug break-words">
                {form.title || '제목 없음'}
              </h1>

              <p className="text-[12px] text-[#333] leading-relaxed whitespace-pre-line break-words">
                {form.body || '본문을 입력하면 여기에 실시간으로 표시됩니다.'}
              </p>

              {form.cover_image_url && (
                <div className="w-full rounded-2xl overflow-hidden bg-[#F0F0F2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.cover_image_url} alt={form.title} className="w-full h-auto object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
