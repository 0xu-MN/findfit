'use client'

import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

// type별로 클릭 시 이동할 곳 — 지금은 매칭 수락/거절 알림뿐이라 리뷰어
// 대시보드(통합 피드)로 보내면 충분하다. 종류가 늘어나면 여기만 확장.
function targetForType(type: string): string {
  if (type === 'match_accepted' || type === 'match_rejected') return '/evaluator/dashboard'
  return '/evaluator/dashboard'
}

function relTime(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function NotificationBell() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, type, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)
    setItems((data as Notification[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const unreadCount = items.filter((n) => !n.is_read).length

  const handleOpen = () => {
    setOpen((prev) => !prev)
  }

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    }
    setOpen(false)
    router.push(targetForType(n.type))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#1D1C1C]/5 transition-colors text-[#666] relative"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[13px] h-[13px] px-[3px] rounded-full bg-[#F77019] text-white text-[8px] font-black flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-[#1D1C1C]/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50">
          <div className="px-4 py-3 border-b border-[#1D1C1C]/5">
            <span className="text-[11px] font-black text-[#1D1C1C]">알림</span>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[10px] font-bold text-[#999]">아직 알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1D1C1C]/5">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-2 hover:bg-[#FAFAFA] transition-colors"
                >
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#F77019] mt-1 flex-shrink-0" />}
                  <div className={`flex-1 min-w-0 ${n.is_read ? 'pl-3.5' : ''}`}>
                    <p className="text-[11px] font-bold text-[#1D1C1C] leading-snug">{n.message}</p>
                    <p className="text-[9px] font-bold text-[#999] mt-1">{relTime(n.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
