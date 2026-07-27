'use client'

import { GripVertical, ImagePlus, Loader2, Plus, Trash2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Banner = {
  id: string
  placement: 'creator_home' | 'reviewer_dashboard'
  title: string
  subtitle: string | null
  badge: string | null
  bg_gradient: string
  image_url: string | null
  button_text: string | null
  button_link: string | null
  display_order: number
  active: boolean
}

// 그라디언트를 CSS 문자열로 직접 치는 대신 클릭 한 번으로 고르는 프리셋 —
// FindFit 브랜드 톤(오렌지/블루) 위주 + 무난한 보조 색상 몇 개.
const GRADIENT_PRESETS = [
  { label: '오렌지', value: 'linear-gradient(135deg, #F77019 0%, #E65100 50%, #BF360C 100%)' },
  { label: '블루', value: 'linear-gradient(135deg, #189DF7 0%, #0D47A1 50%, #1A237E 100%)' },
  { label: '퍼플', value: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #4C1D95 100%)' },
  { label: '그린', value: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #003300 100%)' },
  { label: '핑크', value: 'linear-gradient(135deg, #E91E63 0%, #AD1457 50%, #6A0F3A 100%)' },
  { label: '앰버', value: 'linear-gradient(135deg, #FF8F00 0%, #E65100 50%, #BF360C 100%)' },
  { label: '다크', value: 'linear-gradient(135deg, #37474F 0%, #263238 50%, #10161A 100%)' },
]

const EMPTY_FORM = {
  placement: 'creator_home' as 'creator_home' | 'reviewer_dashboard',
  title: '',
  subtitle: '',
  badge: '',
  bg_gradient: GRADIENT_PRESETS[0].value,
  image_url: '',
  button_text: '',
  button_link: '',
  display_order: 0,
  active: true,
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [customGradient, setCustomGradient] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/banners')
    const { banners: data } = await res.json()
    setBanners(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (b: Banner) => {
    setEditingId(b.id)
    setCustomGradient(!GRADIENT_PRESETS.some((p) => p.value === b.bg_gradient))
    setForm({
      placement: b.placement,
      title: b.title,
      subtitle: b.subtitle ?? '',
      badge: b.badge ?? '',
      bg_gradient: b.bg_gradient,
      image_url: b.image_url ?? '',
      button_text: b.button_text ?? '',
      button_link: b.button_link ?? '',
      display_order: b.display_order,
      active: b.active,
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setCustomGradient(false)
    setUploadError('')
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners'
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
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    load()
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    setUploadError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/banners/upload', { method: 'POST', body })
      const data = await res.json()
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, image_url: data.url }))
      } else {
        setUploadError(data.error ?? '업로드에 실패했어요')
      }
    } catch {
      setUploadError('업로드에 실패했어요')
    } finally {
      setUploading(false)
    }
  }

  // 드래그로 순서를 바꾸면, 그 그룹(배치 위치) 안에서 순서대로 0,1,2...로
  // display_order를 다시 매겨서 전부 PATCH — 기존 숫자 직접입력 필드는
  // 그대로 남겨서 두 방식 다 쓸 수 있게 한다.
  const reorder = async (placement: Banner['placement'], draggedId: string, targetId: string) => {
    const group = banners.filter((b) => b.placement === placement)
    const fromIdx = group.findIndex((b) => b.id === draggedId)
    const toIdx = group.findIndex((b) => b.id === targetId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return

    const reordered = [...group]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    setBanners((prev) => {
      const others = prev.filter((b) => b.placement !== placement)
      return [...others, ...reordered.map((b, i) => ({ ...b, display_order: i }))]
    })

    await Promise.all(
      reordered.map((b, i) =>
        fetch(`/api/admin/banners/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: i }),
        })
      )
    )
  }

  const creatorBanners = banners.filter((b) => b.placement === 'creator_home')
  const reviewerBanners = banners.filter((b) => b.placement === 'reviewer_dashboard')

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors">
          ← 대시보드
        </a>
        <span className="text-[14px] font-black text-[#1D1C1C]">배너 광고 관리</span>
        <button
          onClick={resetForm}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-black text-[#F77019] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> 새 배너
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-[1fr_460px] gap-6 items-start">
        {/* 목록 — 배치 위치별, 드래그로 순서 변경 가능 */}
        <div className="flex flex-col gap-6">
          {([['creator_home', '크리에이터 홈', creatorBanners], ['reviewer_dashboard', '리뷰어 대시보드', reviewerBanners]] as const).map(
            ([placement, label, list]) => (
              <div key={label} className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-[#999] uppercase tracking-wider px-1">{label} — 드래그로 순서 변경</span>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
                  </div>
                ) : list.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#1D1C1C]/8 p-6 text-center">
                    <p className="text-[11px] font-bold text-[#999]">등록된 배너가 없습니다</p>
                  </div>
                ) : (
                  list.map((b) => (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={() => setDragId(b.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); if (dragId && dragId !== b.id) reorder(placement, dragId, b.id); setDragId(null) }}
                      onClick={() => startEdit(b)}
                      className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition-colors overflow-hidden relative ${
                        editingId === b.id ? 'border-[#F77019]' : 'border-[#1D1C1C]/8 hover:border-[#1D1C1C]/20'
                      }`}
                      style={{ background: b.image_url ? undefined : b.bg_gradient }}
                    >
                      {b.image_url && (
                        <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                      )}
                      <span className="relative z-10 text-white/60 cursor-grab active:cursor-grabbing flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <div className="relative z-10 flex flex-col gap-1 min-w-0 flex-1 text-white">
                        <div className="flex items-center gap-2">
                          {b.badge && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-white/20">{b.badge}</span>
                          )}
                          {!b.active && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500/80">비활성</span>
                          )}
                        </div>
                        <span className="text-[12px] font-black line-clamp-1">{b.title}</span>
                      </div>
                      <div className="relative z-10 flex items-center gap-1 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(b) }} className="p-2 rounded-lg text-white/80 hover:bg-white/15">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }} className="p-2 rounded-lg text-white/80 hover:bg-red-500/80">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          )}
        </div>

        {/* 작성/수정 폼 + 실시간 미리보기 */}
        <div className="flex flex-col gap-4 sticky top-6">
          {/* 실제 배너처럼 보이는 실시간 미리보기 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-[#999] uppercase tracking-wider px-1">미리보기</span>
            <div
              className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] min-h-[180px] p-6 flex flex-col justify-center text-white"
              style={{ background: form.image_url ? undefined : form.bg_gradient }}
            >
              {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative z-10 flex flex-col items-start gap-2">
                {form.badge && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                    {form.badge}
                  </span>
                )}
                <h2 className="text-xl font-black leading-tight break-keep">{form.title || '배너 제목'}</h2>
                {form.subtitle && <p className="text-xs font-medium text-white/80 break-keep">{form.subtitle}</p>}
                {form.button_text && (
                  <button className="mt-1 px-4 py-2 rounded-full bg-white text-[#1565C0] text-[11px] font-black shadow-md">
                    {form.button_text}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 flex flex-col gap-3">
            <span className="text-[12px] font-black text-[#1D1C1C]">{editingId ? '배너 수정' : '새 배너 작성'}</span>

            <select
              value={form.placement}
              onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value as 'creator_home' | 'reviewer_dashboard' }))}
              className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
            >
              <option value="creator_home">크리에이터 홈</option>
              <option value="reviewer_dashboard">리뷰어 대시보드</option>
            </select>
            <input
              value={form.badge}
              onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
              placeholder="상단 배지 문구 (예: NEW 서비스)"
              className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
            />
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="제목"
              className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
            />
            <textarea
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="부제목"
              rows={2}
              className="text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2 resize-none"
            />
            <div className="flex gap-2">
              <input
                value={form.button_text}
                onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
                placeholder="버튼 문구"
                className="flex-1 text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
              />
              <input
                value={form.button_link}
                onChange={(e) => setForm((f) => ({ ...f, button_link: e.target.value }))}
                placeholder="버튼 클릭 시 이동 경로 (예: /builder/new-request)"
                className="flex-1 text-[11px] font-bold border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-[#999] uppercase tracking-wider">배경 이미지 (선택 — 없으면 그라디언트 사용)</span>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) uploadImage(f) }}
                onClick={() => fileInputRef.current?.click()}
                className="relative flex items-center gap-3 h-12 rounded-xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] px-4 cursor-pointer hover:border-[#F77019] hover:bg-[#F77019]/5 transition-colors overflow-hidden"
              >
                {form.image_url && <img src={form.image_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                {uploading ? <Loader2 className="w-4 h-4 text-[#999] animate-spin" /> : <ImagePlus className="w-4 h-4 text-[#999] flex-shrink-0" />}
                <span className="text-[10px] font-bold text-[#666] flex-1 truncate">
                  {form.image_url || '클릭하거나 파일을 끌어다 놓으세요'}
                </span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
              </div>
              {uploadError && <span className="text-[9px] font-bold text-red-500">{uploadError}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-[#999] uppercase tracking-wider">배경 색상</span>
                <button
                  type="button"
                  onClick={() => setCustomGradient((v) => !v)}
                  className="text-[9px] font-black text-[#F77019] hover:underline"
                >
                  {customGradient ? '프리셋으로 선택' : '직접 입력'}
                </button>
              </div>
              {customGradient ? (
                <input
                  value={form.bg_gradient}
                  onChange={(e) => setForm((f) => ({ ...f, bg_gradient: e.target.value }))}
                  placeholder="linear-gradient(...) 형식의 CSS 값"
                  className="text-[10px] font-mono border border-[#1D1C1C]/10 rounded-lg px-3 py-2"
                />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, bg_gradient: preset.value }))}
                      className={`h-10 rounded-xl border-2 transition-all flex items-end justify-center pb-1 ${
                        form.bg_gradient === preset.value ? 'border-[#1D1C1C] scale-105' : 'border-transparent'
                      }`}
                      style={{ background: preset.value }}
                      title={preset.label}
                    >
                      <span className="text-[7px] font-black text-white/90">{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#666]">
                <input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))} className="w-16 border border-[#1D1C1C]/10 rounded-lg px-2 py-1.5 text-[11px]" />
                순서(숫자로 직접 지정도 가능)
              </label>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#666]">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                활성화
              </label>
            </div>

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
                <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-[#F5F5F5] text-[#666] text-[11px] font-black hover:bg-[#EBEBEB] transition-colors">
                  취소
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
