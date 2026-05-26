'use client'

import { FileText, Image as ImageIcon, Trash2, Upload, Video } from 'lucide-react'
import type { RequestFormData } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step5Attachments({ data, onChange }: Props) {
  const addImages = (files: FileList | null) => {
    if (!files) return
    const incoming = Array.from(files).map((f) => f.name)
    const next = [...data.imageNames, ...incoming].slice(0, 10)
    onChange({ imageNames: next })
  }

  const removeImage = (idx: number) => onChange({ imageNames: data.imageNames.filter((_, i) => i !== idx) })

  const addDocs = (files: FileList | null) => {
    if (!files) return
    const incoming = Array.from(files).map((f) => f.name)
    const next = [...data.documentNames, ...incoming].slice(0, 2)
    onChange({ documentNames: next })
  }

  const removeDoc = (idx: number) => onChange({ documentNames: data.documentNames.filter((_, i) => i !== idx) })

  const setVis = (k: keyof RequestFormData['visibility']) =>
    onChange({ visibility: { ...data.visibility, [k]: !data.visibility[k] } })

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black">자료 첨부</h2>
        <p className="text-[10px] text-[#999] font-bold">평가단이 참고할 자료를 첨부하세요. 의뢰인 실명·회사명은 항상 블라인드 처리됩니다.</p>
      </div>

      {/* 이미지 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-[#666]" />
            <label className="text-[11px] font-bold">이미지·목업·스크린샷</label>
            <span className="text-[9px] text-[#999] font-bold">{data.imageNames.length}/10</span>
          </div>
          <VisibilityToggle label={data.visibility.images ? '공개' : '비공개'} on={data.visibility.images} onClick={() => setVis('images')} />
        </div>

        <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] cursor-pointer hover:border-[#F77019] hover:bg-[#F77019]/5 transition-colors">
          <Upload className="w-4 h-4 text-[#999]" />
          <span className="text-[11px] font-bold text-[#666]">JPG · PNG · GIF — 클릭해서 업로드</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => addImages(e.target.files)} />
        </label>

        {data.imageNames.length > 0 && (
          <div className="flex flex-col gap-2">
            {data.imageNames.map((name, i) => (
              <FileRow key={`${name}-${i}`} name={name} onRemove={() => removeImage(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="h-[1px] bg-[#EEEEEE]" />

      {/* 소개 영상 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-[#666]" />
            <label className="text-[11px] font-bold">소개 영상 URL (선택)</label>
          </div>
          <VisibilityToggle label={data.visibility.video ? '공개' : '비공개'} on={data.visibility.video} onClick={() => setVis('video')} />
        </div>
        <input
          type="url"
          value={data.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="YouTube / Vimeo URL"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </div>

      <div className="h-[1px] bg-[#EEEEEE]" />

      {/* 문서 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#666]" />
            <label className="text-[11px] font-bold">추가 문서</label>
            <span className="text-[9px] text-[#999] font-bold">{data.documentNames.length}/2</span>
          </div>
          <VisibilityToggle label={data.visibility.documents ? '공개' : '비공개'} on={data.visibility.documents} onClick={() => setVis('documents')} />
        </div>

        <label className="flex items-center gap-3 h-12 rounded-xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] px-4 cursor-pointer hover:border-[#F77019] hover:bg-[#F77019]/5 transition-colors">
          <Upload className="w-4 h-4 text-[#999]" />
          <span className="text-[11px] font-bold text-[#666] flex-1">PDF 최대 2개 — 클릭해서 업로드</span>
          <input type="file" multiple accept="application/pdf" className="hidden" onChange={(e) => addDocs(e.target.files)} />
        </label>

        {data.documentNames.length > 0 && (
          <div className="flex flex-col gap-2">
            {data.documentNames.map((name, i) => (
              <FileRow key={`${name}-${i}`} name={name} onRemove={() => removeDoc(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-[#F77019]/5 border border-[#F77019]/15 p-4">
        <p className="text-[10px] font-bold text-[#F77019] leading-relaxed">
          🔒 의뢰인 실명·회사명은 노출 설정과 관계없이 항상 블라인드 처리되어 평가단에게 노출되지 않습니다.
        </p>
      </div>
    </div>
  )
}

function VisibilityToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] font-black px-2 py-0.5 rounded transition-colors ${
        on ? 'bg-[#1D1C1C] text-white' : 'bg-[#EEEEEE] text-[#999]'
      }`}
    >
      {label}
    </button>
  )
}

function FileRow({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 h-9 rounded-lg bg-[#F5F5F5] px-3">
      <FileText className="w-3.5 h-3.5 text-[#999]" />
      <span className="text-[11px] font-bold text-[#666] flex-1 truncate">{name}</span>
      <button type="button" onClick={onRemove} className="text-[#999] hover:text-red-500">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
