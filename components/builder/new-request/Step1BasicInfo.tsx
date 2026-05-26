'use client'

import { CATEGORIES, STAGE_OPTIONS, type RequestFormData, type RequestType, type Stage } from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step1BasicInfo({ data, onChange }: Props) {
  const toggleCategory = (cat: string) => {
    const has = data.categories.includes(cat)
    if (has) onChange({ categories: data.categories.filter((c) => c !== cat) })
    else if (data.categories.length < 3) onChange({ categories: [...data.categories, cat] })
  }

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h2 className="text-lg font-black">기본 정보</h2>

      {/* 제품명 */}
      <Field label="서비스/제품명" hint={`${data.productName.length}/30`}>
        <input
          type="text"
          maxLength={30}
          value={data.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          placeholder="핵심만 압축한 제품/서비스 이름"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </Field>

      {/* 한 줄 설명 */}
      <Field label="한 줄 소개" hint={`${data.oneLineDesc.length}/60`}>
        <input
          type="text"
          maxLength={60}
          value={data.oneLineDesc}
          onChange={(e) => onChange({ oneLineDesc: e.target.value })}
          placeholder="누구를 위한 어떤 솔루션인지 한 줄로"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </Field>

      {/* 카테고리 */}
      <Field label="카테고리" hint={`${data.categories.length}/3`}>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const active = data.categories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-4 h-8 rounded-full text-[11px] font-bold transition-colors ${
                  active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </Field>

      {/* 현재 단계 */}
      <Field label="현재 단계">
        <div className="grid grid-cols-4 gap-3">
          {STAGE_OPTIONS.map((s) => {
            const active = data.stage === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange({ stage: s.value as Stage })}
                className={`flex flex-col p-4 rounded-xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <span className={`text-[11px] font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{s.title}</span>
                <span className={`text-[9px] mt-1 ${active ? 'text-[#F77019]/80' : 'text-[#999]'}`}>{s.sub}</span>
              </button>
            )
          })}
        </div>
      </Field>

      {/* 랜딩 URL */}
      <Field label="랜딩·소개 URL (선택)">
        <input
          type="url"
          value={data.landingUrl}
          onChange={(e) => onChange({ landingUrl: e.target.value })}
          placeholder="https://"
          className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
        />
      </Field>

      {/* 의뢰 타입 (Step 4 분기 결정) */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold">의뢰 타입</span>
          <span className="text-[9px] text-[#F77019] font-black bg-[#F77019]/10 px-2 py-0.5 rounded">필수 · Step 4 분기 결정</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'survey', title: '설문형', desc: '질문에 답변받기 — 제품 설명을 읽고 바로 답변', detail: '아이디어 · 콘셉트 · 목업 검증' },
              { value: 'experience', title: '체험형', desc: '써보고 평가받기 — 직접 사용 후 평가', detail: '앱 · 게임 · 웹 프로토타입/베타' },
            ] as { value: RequestType; title: string; desc: string; detail: string }[]
          ).map((opt) => {
            const active = data.requestType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ requestType: opt.value })}
                className={`flex flex-col p-5 rounded-2xl text-left transition-colors ${
                  active ? 'bg-[#F77019]/10 border border-[#F77019]' : 'bg-[#F5F5F5] border border-transparent hover:border-[#1D1C1C]/10'
                }`}
              >
                <span className={`text-sm font-black ${active ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{opt.title}</span>
                <span className={`text-[11px] mt-2 font-bold ${active ? 'text-[#F77019]/80' : 'text-[#666]'}`}>{opt.desc}</span>
                <span className={`text-[10px] mt-1 ${active ? 'text-[#F77019]/60' : 'text-[#999]'}`}>{opt.detail}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold">{label}</label>
        {hint && <span className="text-[9px] text-[#999] font-bold">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
