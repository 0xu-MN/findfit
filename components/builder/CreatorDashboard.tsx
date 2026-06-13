'use client'

import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Info,
  Leaf,
  PlusCircle,
  RefreshCw,
  Star,
  Wallet,
} from 'lucide-react'

/* ───── Dummy Data ───── */
const topProjects = [
  { id: 1, title: '친환경 폼 패키지 디자인', progress: 85, total: 100, rating: 4.6 },
  { id: 2, title: '친환경 폼 패키지 디자인', progress: 60, total: 100, rating: 4.6 },
  { id: 3, title: '친환경 폼 패키지 디자인', progress: 35, total: 100, rating: 4.6 },
]

const recentFeedbacks = [
  { id: 1, title: '친환경 세제 패키지 디자인', body: '패키지 디자인이 깔끔하고 친환경 느낌이 잘 ...' },
  { id: 2, title: '친환경 세제 패키지 디자인', body: '패키지 디자인이 깔끔하고 친환경 느낌이 잘 ...' },
  { id: 3, title: '친환경 세제 패키지 디자인', body: '패키지 디자인이 깔끔하고 친환경 느낌이 잘 ...' },
  { id: 4, title: '친환경 세제 패키지 디자인', body: '패키지 디자인이 깔끔하고 친환경 느낌이 잘 ...' },
]

const draftProjects = [
  { id: 1, title: '친환경 폼 패키지 디자인', progress: 38 },
]

const completedReports = [
  { id: 1, title: '클린뷰티 폼 패키지 디자인 리뷰', date: '완료 2024.05.20' },
  { id: 2, title: '클린뷰티 폼 패키지 디자인 리뷰', date: '완료 2024.05.20' },
  { id: 3, title: '클린뷰티 폼 패키지 디자인 리뷰', date: '완료 2024.05.20' },
]

const recentActivity = [
  { id: 1, text: '친환경 패키지 리뷰 5건 완료', time: '30분 전' },
  { id: 2, text: '친환경 패키지 리뷰 5건 완료', time: '30분 전' },
  { id: 3, text: '친환경 패키지 리뷰 5건 완료', time: '30분 전' },
]

const recruitAlerts = [
  { id: 1, title: '클린뷰티 폼 패키지 디자인 리뷰', current: 8, total: 30, daysLeft: 2 },
  { id: 2, title: '클린뷰티 폼 패키지 디자인 리뷰', current: 8, total: 30, daysLeft: 2 },
  { id: 3, title: '클린뷰티 폼 패키지 디자인 리뷰', current: 8, total: 30, daysLeft: 2 },
]

const donutSegments = [
  { label: '진행 중', count: 5, percent: 42, color: '#F77019' },
  { label: '작성 중', count: 4, percent: 33, color: '#189DF7' },
  { label: '완료', count: 3, percent: 25, color: '#1CAE66' },
]

const PROGRESS_GRADIENT = 'linear-gradient(90deg, rgba(247,112,25,0.5) 0%, rgba(247,112,25,1) 100%)'

/* ────────────────────────────────────────────── */
export default function CreatorDashboard() {
  const router = useRouter()

  return (
    <div className="w-full flex flex-col gap-5 text-[#1D1C1C]">
      {/* ═══ WELCOME HEADER ═══ */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Welcome, 포뇨 👋</h2>
          <p className="text-[11px] text-[#999] mt-1">오늘도 멋진 프로젝트를 만들어보세요!</p>
        </div>
      </div>

      {/* ═══ MAIN GRID: main area + right sidebar ═══ */}
      <div className="grid gap-4 items-stretch" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* ─────────── MAIN AREA ─────────── */}
        <div className="flex flex-col gap-4">
          {/* Top row: 한눈에 보기 + 진행 중 프로젝트 TOP 3 */}
          <div className="grid grid-cols-2 gap-4">
            <OverviewCard />
            <TopProjectsCard onAll={() => router.push('/builder/projects')} />
          </div>

          {/* Bottom row: 최근 피드백 + 작성 중 + 완료된 리포트 */}
          <div className="grid grid-cols-3 gap-4">
            <RecentFeedbackCard />
            <DraftsCard onAll={() => router.push('/builder/projects')} />
            <CompletedReportsCard onAll={() => router.push('/builder/reports')} />
          </div>
        </div>

        {/* ─────────── RIGHT SIDEBAR ─────────── */}
        <div className="flex flex-col gap-3 h-full">
          {/* 새 프로젝트 등록하기 — standalone button */}
          <button
            onClick={() => router.push('/builder/new-request')}
            className="w-full flex items-center justify-center gap-1.5 font-black rounded-2xl text-white text-sm py-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: 'linear-gradient(135deg,#F77019,#FF8F45)',
              boxShadow: '0 6px 16px rgba(247,112,25,0.28)',
            }}
          >
            <PlusCircle className="w-4 h-4" />새 프로젝트 등록하기
          </button>

          {/* Fit Credit — orange-bordered standalone card */}
          <FitCreditCard />

          {/* 최근 활동 — standalone card */}
          <RecentActivityCard />

          {/* 모집 속도 관리 — flex-1 to stretch and align with left column bottom */}
          <RecruitAlertsCard className="flex-1" />
        </div>
      </div>

      {/* ═══ SYSTEM NOTICE ═══ */}
      <div className="w-full rounded-xl border border-[#1D1C1C]/5 bg-white p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertCircle className="w-4 h-4 text-[#F77019] flex-shrink-0" />
          <span className="font-extrabold text-[#1D1C1C] flex-shrink-0">시스템 공지:</span>
          <span className="text-[#666] truncate">
            전문 평가단 등급 세분화 패치가 완료되었습니다. 전문가 패널 검증 단가가 인상되었습니다.
          </span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button className="font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5 text-[10px]">
            1:1 Q&A <ChevronRight className="w-3 h-3" />
          </button>
          <button className="font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5 text-[10px]">
            가이드 북 <ChevronRight className="w-3 h-3" />
          </button>
          <button className="font-bold text-[#666] hover:text-[#F77019] transition-colors flex items-center gap-0.5 text-[10px]">
            FAQ 확인 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  한눈에 보기                                              */
/* ─────────────────────────────────────────────────────── */

function OverviewCard() {
  // SVG donut: cumulative segments
  const radius = 38
  const circumference = 2 * Math.PI * radius
  let acc = 0
  const segments = donutSegments.map((s) => {
    const dash = (s.percent / 100) * circumference
    const seg = {
      dash,
      gap: circumference - dash,
      offset: -acc,
      color: s.color,
    }
    acc += dash
    return seg
  })

  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-black text-[#1D1C1C]">한눈에 보기</span>
        <Info className="w-3 h-3 text-[#F77019]" />
      </div>

      {/* Donut + Legend */}
      <div className="flex items-center justify-between gap-4">
        {/* Donut (larger) */}
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#F5F5F5" strokeWidth="13" />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="13"
                strokeLinecap="butt"
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={s.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-[#999] font-bold">총 프로젝트</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-[#1D1C1C] leading-none">12</span>
              <span className="text-sm font-bold text-[#666]">개</span>
            </div>
          </div>
        </div>

        {/* Legend — smaller text, colored per segment */}
        <div className="flex-1 flex flex-col gap-2.5">
          {donutSegments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span style={{ color: s.color }}>
                {s.label} {s.count} ({s.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4 metric tiles */}
      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-[#1D1C1C]/5">
        {/* 평균 만족도 */}
        <MetricTile
          label="평균 만족도"
          value="4.5"
          unit="/ 5.0"
          extra={<StarRow rating={4.5} />}
        />
        {/* 총 참여 리뷰어 */}
        <MetricTile label="총 참여 리뷰어" value="1,245" unit="명" trendPercent={32} />
        {/* 프로젝트 완료율 */}
        <MetricTile label="프로젝트 완료율" value="78" unit="%" trendPercent={32} />
        {/* 긍정 리뷰 비율 */}
        <MetricTile label="긍정 리뷰 비율" value="78" unit="%" trendPercent={32} />
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  unit,
  trendPercent,
  extra,
}: {
  label: string
  value: string
  unit?: string
  trendPercent?: number
  extra?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[9px] text-[#999] font-bold truncate">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-base font-black text-[#1D1C1C] leading-none">{value}</span>
        {unit && <span className="text-[9px] text-[#999] font-bold">{unit}</span>}
      </div>
      {extra}
      {trendPercent !== undefined && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[8px] text-[#999] font-medium">지난 달 대비</span>
          <span className="text-[9px] text-[#1CAE66] font-black flex items-center gap-0.5">
            <svg viewBox="0 0 8 8" className="w-2 h-2" aria-hidden="true">
              <polygon points="4,1 7,6 1,6" fill="none" stroke="#1CAE66" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            {trendPercent}%
          </span>
        </div>
      )}
    </div>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const fullFilled = rating >= n
        const halfFilled = !fullFilled && rating + 0.5 >= n
        return (
          <Star
            key={n}
            className="w-2.5 h-2.5"
            strokeWidth={0}
            fill={fullFilled ? '#F77019' : halfFilled ? '#F77019' : '#E5E5E5'}
            style={halfFilled ? { opacity: 0.55 } : undefined}
          />
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  진행 중 프로젝트 TOP 3                                    */
/* ─────────────────────────────────────────────────────── */

function TopProjectsCard({ onAll }: { onAll: () => void }) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center">
        <span className="text-xs font-black text-[#1D1C1C]">진행 중 프로젝트 TOP 3</span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {topProjects.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex-shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate group-hover:text-[#F77019] transition-colors">
                {p.title}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.progress / p.total) * 100}%`,
                      background: PROGRESS_GRADIENT,
                    }}
                  />
                </div>
                <span className="text-[9px] text-[#999] font-bold flex-shrink-0">
                  평가 {p.progress} / {p.total}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-[#F77019] flex-shrink-0 bg-[#F77019]/10 px-2 py-1 rounded-lg">
              {p.rating.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <ViewAllBtn label="진행 중 프로젝트 전체 보기" onClick={onAll} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  최근 리뷰어 피드백 — 4 items, leaf icon + title + body + star
/* ─────────────────────────────────────────────────────── */

function RecentFeedbackCard() {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center">
        <span className="text-[11px] font-black text-[#1D1C1C]">최근 리뷰어 피드백</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {recentFeedbacks.map((f) => (
          <div
            key={f.id}
            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F77019]/10 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 text-[#F77019]" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-[#999] truncate">{f.title}</span>
              <span className="text-[10px] font-extrabold text-[#1D1C1C] leading-snug line-clamp-2 group-hover:text-[#F77019] transition-colors">
                {f.body}
              </span>
            </div>
            <button className="text-[#CCC] hover:text-[#F77019] transition-colors flex-shrink-0 mt-0.5">
              <Star className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <ViewAllBtn label="피드백 전체 보기" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  작성 중 프로젝트                                          */
/* ─────────────────────────────────────────────────────── */

function DraftsCard({ onAll }: { onAll: () => void }) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#999]" />
        <span className="text-[11px] font-black text-[#666]">작성 중 프로젝트</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {draftProjects.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex-shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate group-hover:text-[#F77019] transition-colors">
                {d.title}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.progress}%`, background: PROGRESS_GRADIENT }}
                  />
                </div>
                <span className="text-[9px] text-[#F77019] font-black flex-shrink-0">{d.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ViewAllBtn label="작성 중 프로젝트 전체 보기" onClick={onAll} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  완료된 리포트                                            */
/* ─────────────────────────────────────────────────────── */

function CompletedReportsCard({ onAll }: { onAll: () => void }) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#1565C0]" />
        <span className="text-[11px] font-black text-[#666]">완료된 리포트</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {completedReports.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/30 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#1D1C1C] truncate block group-hover:text-[#F77019] transition-colors">
                {r.title}
              </span>
              <span className="text-[9px] text-[#999] font-medium mt-0.5 block">{r.date}</span>
            </div>
          </div>
        ))}
      </div>

      <ViewAllBtn label="완료된 리포트 전체 보기" onClick={onAll} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  Fit Credit — orange-bordered standalone card             */
/* ─────────────────────────────────────────────────────── */

function FitCreditCard() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(247,112,25,0.06)',
        border: '1.5px solid #F77019',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-black text-[#1D1C1C]">Fit Credit</span>
        <button className="text-[10px] font-bold text-[#F77019] hover:underline flex items-center gap-0.5">
          Fit Credit 내역 보기 <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#666] font-bold">사용 가능 잔액</span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-2xl font-black text-[#1D1C1C]">12,500</span>
          <Wallet className="w-4 h-4 text-[#F77019]" />
        </div>
      </div>

      <button
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F77019] text-white text-xs font-black hover:opacity-90 transition-all shadow-sm"
        style={{ boxShadow: '0 4px 12px rgba(247,112,25,0.25)' }}
      >
        <PlusCircle className="w-3.5 h-3.5" /> 충전하기
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  최근 활동 — standalone card                              */
/* ─────────────────────────────────────────────────────── */

function RecentActivityCard() {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-4 flex flex-col gap-3">
      <span className="text-[12px] font-black text-[#1D1C1C]">최근 활동</span>
      <div className="flex flex-col gap-2.5">
        {recentActivity.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-[10px]">
            <span className="text-[#1D1C1C] font-bold truncate pr-2">{a.text}</span>
            <span className="text-[#999] text-[9px] font-medium flex-shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  모집 속도 관리                                            */
/* ─────────────────────────────────────────────────────── */

function RecruitAlertsCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#1D1C1C]/5 bg-white p-4 flex flex-col gap-3 ${className}`}>
      <span className="text-[12px] font-black text-[#1D1C1C]">모집 속도 관리</span>

      <div className="flex flex-col gap-2 flex-1">
        {recruitAlerts.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-[#F77019]/15 bg-[#FFF8F2]"
          >
            <AlertTriangle className="w-4 h-4 text-[#F77019] flex-shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold text-[#1D1C1C] truncate">{a.title}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#999] font-medium">
                  현재 {a.current}/{a.total}명 참여
                </span>
                <span className="text-[8px] font-black text-white bg-[#E53935] px-1.5 py-0.5 rounded">
                  D-{a.daysLeft}
                </span>
              </div>
            </div>
            <button className="text-[9px] font-black text-white bg-[#F77019] px-2 py-1.5 rounded-md hover:opacity-90 transition-all flex-shrink-0 flex items-center gap-1">
              사례금 조정 <RefreshCw className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  ViewAllBtn — 공용 "전체 보기" 버튼 (#999 + 우측 정렬)      */
/* ─────────────────────────────────────────────────────── */

function ViewAllBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="self-end text-[10px] font-bold text-[#999999] hover:text-[#666] transition-colors flex items-center gap-0.5"
    >
      {label} <ArrowRight className="w-2.5 h-2.5" />
    </button>
  )
}
