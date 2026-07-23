'use client'

import { useEffect, useState } from 'react'
import { Link2, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ExternalInterestCard({ projectId }: { projectId: string }) {
  const [slug, setSlug] = useState<string | null>(null)
  const [views, setViews] = useState(0)
  const [emails, setEmails] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadStats = async (shareSlug: string) => {
    const supabase = createClient()
    const { data: share } = await supabase
      .from('report_shares')
      .select('id')
      .eq('slug', shareSlug)
      .single()
    if (!share) return
    const { data: events } = await supabase
      .from('report_share_events')
      .select('event_type')
      .eq('share_id', share.id)
    setViews((events ?? []).filter((e) => e.event_type === 'view').length)
    setEmails((events ?? []).filter((e) => e.event_type === 'email_capture').length)
  }

  const ensureShare = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (res.ok) {
        const { slug: newSlug } = await res.json()
        setSlug(newSlug)
        await loadStats(newSlug)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ensureShare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const shareUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${slug}` : ''
  const conversionPct = views > 0 ? Math.round((emails / views) * 100) : 0

  const copyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h3 className="text-sm font-black">외부 관심 현황 · 실시간</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[#999]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox value={views} label="링크 조회수" />
            <StatBox value={emails} label="관심 표현" accent />
            <StatBox value={`${conversionPct}%`} label="전환율" />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#F5F5F5] px-3 py-2.5">
            <Link2 className="w-3.5 h-3.5 text-[#999] shrink-0" />
            <span className="flex-1 text-[11px] font-bold text-[#666] truncate">{shareUrl}</span>
            <button
              onClick={copyLink}
              className="text-[10px] font-black text-[#F77019] hover:underline shrink-0 flex items-center gap-1"
            >
              {copied ? <><Check className="w-3 h-3" />복사됨</> : '복사'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function StatBox({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4 text-center">
      <div className={`text-xl font-black ${accent ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{value}</div>
      <div className="text-[10px] font-bold text-[#999] mt-1">{label}</div>
    </div>
  )
}
