'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

type Props = {
  label: string
  hint: string
  max: number
  rows: number
  value: string
  placeholder?: string
  onChange: (v: string) => void
}

// 등록 마법사의 장문 서술형 필드(문제/솔루션/검증 가설 등) 공용 텍스트에어리어.
// "AI로 다듬기" 버튼을 눌러 /api/writing/polish(Claude haiku)로 대충 쓴 초안을
// 완성된 문장으로 다듬어준다 — Step2Problem/Step4Standard/Step4Deep이 각자
// 텍스트에어리어를 따로 들고 있던 걸 여기 하나로 합쳤다.
export default function PolishableTextarea({ label, hint, max, rows, value, placeholder, onChange }: Props) {
  const [polishing, setPolishing] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const polish = async () => {
    if (!value.trim()) { showToast('먼저 대략적인 내용을 입력해주세요'); return }
    setPolishing(true)
    try {
      const res = await fetch('/api/writing/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldLabel: label, draftText: value, maxLength: max }),
      })
      const body = await res.json()
      if (res.ok && body.polished) {
        onChange(body.polished)
      } else if (res.status === 401) {
        showToast('로그인이 필요해요')
      } else if (res.status === 429) {
        showToast('오늘 AI 다듬기 횟수를 모두 사용했어요')
      } else {
        showToast('문장을 다듬지 못했어요. 잠시 후 다시 시도해주세요')
      }
    } catch {
      showToast('문장을 다듬지 못했어요. 잠시 후 다시 시도해주세요')
    } finally {
      setPolishing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold">{label}</label>
        <div className="flex items-center gap-2">
          {toast && <span className="text-[9px] font-bold text-[#F77019]">{toast}</span>}
          <button
            type="button"
            onClick={polish}
            disabled={polishing}
            className="flex items-center gap-1.5 text-[11px] font-black text-white bg-[#F77019] hover:bg-[#e0621a] px-3 py-1.5 rounded-full shadow-sm transition-colors disabled:opacity-40"
          >
            {polishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI로 다듬기
          </button>
          <span className="text-[9px] text-[#999] font-bold">{hint}</span>
        </div>
      </div>
      <textarea
        rows={rows}
        maxLength={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[#F5F5F5] border-none outline-none px-4 py-3 text-[11px] resize-none leading-relaxed"
      />
    </div>
  )
}
