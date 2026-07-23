'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function EmailCaptureForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!email.includes('@')) { setError('올바른 이메일을 입력해주세요'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/share/${slug}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '저장에 실패했어요')
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> 남겨주셔서 감사해요!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="you@example.com"
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#1D1C1C]/12 text-[12px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90 disabled:opacity-60 transition-colors flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '남기기'}
        </button>
      </div>
      {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}
    </div>
  )
}
