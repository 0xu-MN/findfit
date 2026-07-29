'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'

type TickerItem = {
  id: string
  tag: string
  tagColor: string
  title: string
  subtitle?: string
  time: string
  img: string
  // 실제 DB 프로젝트에서 온 항목만 클릭 시 상세 페이지로 이동한다 —
  // 아래 DEFAULT_TICKER_ITEMS(하드코딩 예시)는 실제 프로젝트가 아니라
  // 눌러도 갈 곳이 없으므로 projectId를 아예 안 준다.
  projectId?: string
}

const DEFAULT_TICKER_ITEMS: TickerItem[] = [
  {
    id: 't1',
    tag: '신규 프로젝트',
    tagColor: 'bg-orange-100 text-orange-700',
    title: '스마트스토어 AI 상세페이지 자동화 툴',
    subtitle: '모집 인원 50명 · 50,000 FC',
    time: '방금 전',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 't2',
    tag: '리뷰어 모집 중',
    tagColor: 'bg-blue-100 text-blue-700',
    title: '1인 가구 프리미엄 비건 밀키트 검증',
    subtitle: '모집 인원 30명 · 35,000 FC',
    time: '5분 전',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 't3',
    tag: '검증 진행 중',
    tagColor: 'bg-green-100 text-green-700',
    title: '저소음 홈트레이닝 워킹패드 리서치',
    subtitle: '달성률 85% · 20명 수락',
    time: '12분 전',
    img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 't4',
    tag: '인사이트 리포트',
    tagColor: 'bg-purple-100 text-purple-700',
    title: '반려동물 자동 급식기 PSF 리포트 완료',
    subtitle: '평가점수 8.4/10',
    time: '25분 전',
    img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 't5',
    tag: '신규 프로젝트',
    tagColor: 'bg-orange-100 text-orange-700',
    title: '소상공인 정산 가속화 핀테크 앱',
    subtitle: '모집 인원 20명 · 40,000 FC',
    time: '40분 전',
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80',
  },
]

export default function LiveActivityTicker() {
  const router = useRouter()
  const [items, setItems] = useState<TickerItem[]>(DEFAULT_TICKER_ITEMS)

  useEffect(() => {
    // 실제 등록된 크리에이터 프로젝트 가져오기
    fetch('/api/projects/feed')
      .then((res) => res.json())
      .then((data) => {
        if (data?.all && data.all.length > 0) {
          const dbItems: TickerItem[] = data.all.map((p: any, idx: number) => ({
            id: p.id,
            projectId: p.id,
            tag: p.status === 'completed' ? '검증 완료' : '리뷰 모집 중',
            tagColor: p.status === 'completed' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
            title: p.title,
            subtitle: `목표 ${p.target_count}명 · ${p.incentive_budget ? (p.incentive_budget / p.target_count).toLocaleString() + ' FC' : '자유 참여'}`,
            time: `${(idx + 1) * 7}분 전`,
            img: DEFAULT_TICKER_ITEMS[idx % DEFAULT_TICKER_ITEMS.length].img,
          }))
          setItems([...dbItems, ...DEFAULT_TICKER_ITEMS])
        }
      })
      .catch(() => {})
  }, [])

  // 무한 티커를 위해 2개 배치
  const tickerContent = [...items, ...items]

  return (
    <div className="rounded-3xl bg-white border border-[#1D1C1C]/10 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex items-center gap-4 overflow-hidden relative select-none">
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0 bg-[#F5F7FA] px-3.5 py-2 rounded-2xl border border-[#1D1C1C]/5 z-10">
        <Activity className="w-4 h-4 text-[#189DF7] animate-pulse" />
        <span className="text-xs font-black text-[#1D1C1C] whitespace-nowrap">실시간 활동</span>
      </div>

      {/* Marquee Continuous Flowing Track */}
      <div className="flex-1 overflow-hidden relative py-1">
        <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap w-max">
          {tickerContent.map((act, index) => (
            <div
              key={`${act.id}-${index}`}
              onClick={() => act.projectId && router.push(`/evaluator/projects/${act.projectId}`)}
              className={`flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-[#F8F9FA] border border-[#1D1C1C]/5 hover:border-[#189DF7]/40 hover:bg-white transition-all shrink-0 shadow-sm ${
                act.projectId ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <img src={act.img} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded w-fit ${act.tagColor}`}>
                    {act.tag}
                  </span>
                  <span className="text-[10px] text-[#999] font-medium">{act.time}</span>
                </div>
                <p className="text-[12px] font-bold text-[#1D1C1C] max-w-[220px] truncate">{act.title}</p>
                {act.subtitle && (
                  <p className="text-[10px] text-[#666] font-medium">{act.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Count Badge */}
      <div className="flex items-center gap-2.5 shrink-0 bg-[#F5F7FA] px-3 py-2 rounded-2xl border border-[#1D1C1C]/5 z-10 hidden sm:flex">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-[#777]">현재 검증 진행 중</span>
          <span className="text-xs font-black text-[#189DF7]">1,248건</span>
        </div>
      </div>
    </div>
  )
}
