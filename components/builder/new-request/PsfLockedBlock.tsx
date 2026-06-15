'use client'

import { Lock } from 'lucide-react'
import { PSF_CORE_QUESTIONS_DESC } from '@/lib/constants/plainLanguage'
import { PSF_STANDARD_QUESTIONS } from './types'

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: '객관식',
  short_answer: '주관식',
  likert: '리커트 5점',
}

export default function PsfLockedBlock() {
  return (
    <div className="rounded-xl border border-[#F77019]/30 bg-[#F77019]/5 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-[#F77019]" />
        <span className="text-[10px] font-black text-[#F77019]">
          아이디어 검증 핵심 질문 · 자동 포함 (삭제·수정 불가)
        </span>
      </div>
      <p className="text-[10px] font-bold text-[#F77019]/70 leading-relaxed">{PSF_CORE_QUESTIONS_DESC}</p>
      <div className="flex flex-col gap-2">
        {PSF_STANDARD_QUESTIONS.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-[#F77019]/70 bg-[#F77019]/10 px-1.5 py-0.5 rounded">
                Q{i + 1} · {TYPE_LABELS[q.type] ?? q.type}
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#1D1C1C] pl-1">{q.text}</p>
            {q.options && (
              <ul className="text-[10px] text-[#666] font-bold pl-3 flex flex-col gap-0.5">
                {q.options.map((o, idx) => (
                  <li key={idx}>· {o}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
