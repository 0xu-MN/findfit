'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ChatMsg = { role: 'user' | 'ai'; text: string }

export default function ReportGrowthTools({ projectId }: { projectId: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <EmailListCard projectId={projectId} />
      <AiChatCard projectId={projectId} />

      {/* 재의뢰 CTA */}
      <div className="rounded-3xl bg-gradient-to-br from-[#F77019] to-[#ff9240] text-white p-6 flex flex-col gap-3">
        <span className="text-[10px] font-black opacity-80 uppercase tracking-wider">데이터 기반 제안</span>
        <p className="text-base font-black leading-snug">더 나은 표본으로<br />재검증해보세요</p>
        <p className="text-[11px] font-bold opacity-85 leading-relaxed">
          외부 관심 데이터가 쌓이고 있어요. 관심이 있다면 더 큰 표본으로 확장 검증할 때예요.
        </p>
        <button
          onClick={() => router.push('/builder/new-request')}
          className="self-start mt-1 px-4 py-2 rounded-xl bg-white text-[#F77019] text-[11px] font-black hover:opacity-90 transition-colors"
        >
          새 프로젝트로 재의뢰하기
        </button>
      </div>
    </div>
  )
}

function EmailListCard({ projectId }: { projectId: string }) {
  const [emails, setEmails] = useState<{ email: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: share } = await supabase
        .from('report_shares')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle()
      if (!share) { setLoading(false); return }
      const { data: events } = await supabase
        .from('report_share_events')
        .select('email, created_at')
        .eq('share_id', share.id)
        .eq('event_type', 'email_capture')
        .order('created_at', { ascending: false })
      setEmails((events ?? []).filter((e): e is { email: string; created_at: string } => !!e.email))
      setLoading(false)
    }
    load()
  }, [projectId])

  const exportCsv = () => {
    const rows = ['email,수집일시', ...emails.map((e) => `${e.email},${new Date(e.created_at).toLocaleString('ko-KR')}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'findfit-interested-emails.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black">관심 이메일 리스트</h3>
        {emails.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2.5 py-1 rounded-lg hover:bg-[#F77019]/20 transition-colors"
          >
            <Download className="w-3 h-3" /> CSV 내보내기
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[#999]" /></div>
      ) : emails.length === 0 ? (
        <p className="text-[11px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3">아직 이메일을 남긴 방문자가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {emails.map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-[#F5F5F5] px-4 py-2.5">
              <span className="text-[11px] font-bold text-[#1D1C1C]">{maskEmail(e.email)}</span>
              <span className="text-[10px] font-bold text-[#999]">{new Date(e.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, Math.min(3, local.length))
  return `${visible}***@${domain}`
}

function AiChatCard({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'ai', text: '이 리포트에 대해 궁금한 점을 물어보세요. 데이터에 근거해서 답해드릴게요.' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!input.trim() || sending) return
    const question = input.trim()
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/ai-report/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const body = await res.json()
      setMessages((prev) => [...prev, { role: 'ai', text: body.answer ?? body.error ?? '답변을 가져오지 못했어요.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: '답변을 가져오지 못했어요.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h3 className="text-sm font-black mb-4">AI 분석 대화</h3>
      <div className="rounded-2xl bg-[#F5F5F5] p-4 flex flex-col gap-2 max-h-72 overflow-y-auto mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-[12px] leading-relaxed rounded-2xl px-4 py-2.5 max-w-[85%] ${
              m.role === 'user'
                ? 'bg-[#F77019] text-white self-end rounded-br-sm ml-auto'
                : 'bg-white text-[#1D1C1C] font-bold rounded-bl-sm shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && <Loader2 className="w-4 h-4 animate-spin text-[#999]" />}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="데이터에 대해 무엇이든 물어보세요..."
          className="flex-1 px-4 py-2.5 rounded-full border border-[#1D1C1C]/12 text-[12px] font-bold text-[#1D1C1C] outline-none focus:border-[#F77019] transition-colors"
        />
        <button
          onClick={send}
          disabled={sending}
          className="w-9 h-9 rounded-full bg-[#F77019] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-60 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
