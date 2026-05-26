'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle,
  ArrowRight,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Star,
  AlertCircle,
  ChevronRight,
  FileText,
  Download,
  HelpCircle,
  Sparkles,
  Coins,
  Calendar
} from 'lucide-react'

/* ───── Dummy Data ───── */
const topProjects = [
  { id: 1, title: '친환경 폼 패키지 디자인', status: '진행 중', progress: 85, total: 100, rating: 4.6, thumb: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=60&q=80' },
  { id: 2, title: '가계부 앱 서비스 후보 조사', status: '진행 중', progress: 42, total: 80, rating: 4.1, thumb: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=60&q=80' },
  { id: 3, title: '리뉴얼 신제품 콘셉트 평가', status: '진행 중', progress: 18, total: 50, rating: 3.0, thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=80' },
]

const draftProjects = [
  { id: 1, title: '두피 케어 성분 브랜드 네이밍', lastEdit: '마지막 수정 1시간 전', progress: 60 },
  { id: 2, title: '카페 브랜드 로고 디자인 평가', lastEdit: '마지막 수정 3일 전', progress: 25 },
]

const completedReports = [
  { id: 1, title: '클린뷰티 폼 패키지 디자인 리뷰', date: '완료 2024.05.20', color: '#F77019' },
  { id: 2, title: '웹사이트 메인페이지 맵핑 리뷰', date: '완료 2024.05.18', color: '#1565C0' },
  { id: 3, title: '비건 소녀 브랜드 사용 검증', date: '완료 2024.05.15', color: '#2E7D32' },
]

const keywords = [
  { word: '깔끔해요', size: 'text-lg', weight: 'font-black' },
  { word: '신뢰감', size: 'text-sm', weight: 'font-bold' },
  { word: '가성비', size: 'text-sm', weight: 'font-bold' },
  { word: '친환경적', size: 'text-base', weight: 'font-black' },
  { word: '세련된 디자인', size: 'text-xs', weight: 'font-semibold' },
]

const popularReviewers = [
  { name: '리뷰요정', rating: 4.9 },
  { name: '마켓닌자', rating: 4.8 },
  { name: '디자인바바', rating: 4.7 },
]

const recentActivity = [
  { text: '친환경 패키지 리뷰 5건 완료', time: '30분 전' },
  { text: '가계부 앱 프로젝트 매칭 시작', time: '2시간 전' },
  { text: '클린뷰티 리포트 다운로드', time: '어제' },
]

const demoWeeklyData = [30, 55, 42, 70, 85, 60, 45]
const weekDays = ['월', '화', '수', '목', '금', '토', '일']

type DemoFilter = 'all' | 'gender' | 'age' | 'job'

/* ────────────────────────────────────────────── */
export default function CreatorDashboard() {
  const router = useRouter()
  const [statsFilter, setStatsFilter] = useState<DemoFilter>('all')
  const [leftActiveCard, setLeftActiveCard] = useState<'donut' | 'realtime'>('donut')

  return (
    <div className="w-full flex flex-col gap-5 text-[#1D1C1C]">

      {/* ═══ WELCOME HEADER ═══ */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Welcome, 포뇨 👋</h2>
          <p className="text-[11px] text-[#999] mt-1">오늘도 멋진 프로젝트를 만들어보세요!</p>
        </div>
      </div>

      {/* ═══ MAIN 3‑COLUMN GRID ═══ */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '330px 1fr 330px' }}>

        {/* ─── LEFT COLUMN ─── */}
        <div className="flex flex-col gap-4">

          {/* 전체 프로젝트 */}
          <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F77019]" />
                  <span className="text-[11px] font-black text-[#666]">전체 프로젝트</span>
                </div>
                <button onClick={() => router.push('/builder/projects')} className="text-[10px] font-bold text-[#F77019] flex items-center gap-0.5 hover:underline">
                  전체 프로젝트 보기 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <span className="text-3xl font-black mt-1">12 <span className="text-sm font-bold text-[#999]">개</span></span>
              <div className="flex items-center gap-3 text-[10px] text-[#999] font-semibold mt-1 mb-1">
                <span>진행 중 <b className="text-[#1D1C1C]">5</b></span>
                <span>완료 <b className="text-[#1D1C1C]">7</b></span>
              </div>

              {/* Donut chart SVG */}
              <div className="flex items-center justify-between px-2 mb-1 mt-2">
                <div className="flex flex-col gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#F77019]" />
                    <span className="text-[#666] font-semibold">진행 중 <b className="text-[#1D1C1C] text-sm">42%</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#EEEEEE]" />
                    <span className="text-[#666] font-semibold">완료 <b className="text-[#1D1C1C] text-sm">58%</b></span>
                  </div>
                </div>
                <div className="relative w-20 h-20 flex flex-shrink-0 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute w-24 h-24">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#EEEEEE" strokeWidth="10" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F77019" strokeWidth="10"
                      strokeDasharray="100.2 138.6" strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                </div>
              </div>


            </div>
          </div>

          {/* 요일별 리뷰어 모집 */}
          <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-[#1D1C1C]">요일별 리뷰어 모집</span>
              <div className="flex items-center gap-1 bg-[#FAFAFA] rounded-md p-0.5 border border-[#1D1C1C]/5">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'gender', label: '성별' },
                  { id: 'age', label: '나이' },
                  { id: 'job', label: '직업군' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatsFilter(f.id as DemoFilter)}
                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${statsFilter === f.id
                        ? 'bg-white text-[#F77019] shadow-sm'
                        : 'text-[#999] hover:text-[#666]'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-black text-[#1D1C1C]">307명</span>
              <div className="flex items-center gap-1 text-[9px] text-[#2E7D32] font-bold mb-1.5">
                <TrendingUp className="w-3 h-3 text-[#2E7D32]" />
                지난주 대비 +12%
              </div>
            </div>

            {/* Spline Area Chart SVG */}
            <div className="relative w-full h-28 mb-1">
              <svg viewBox="0 0 240 100" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F77019" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#F77019" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="10" x2="240" y2="10" stroke="#EEEEEE" strokeWidth="0.5" />
                <line x1="0" y1="30" x2="240" y2="30" stroke="#EEEEEE" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="240" y2="50" stroke="#EEEEEE" strokeWidth="0.5" />
                <line x1="0" y1="70" x2="240" y2="70" stroke="#EEEEEE" strokeWidth="0.5" />
                <line x1="0" y1="90" x2="240" y2="90" stroke="#EEEEEE" strokeWidth="0.5" />

                {/* Shaded Area under spline (7 points: 0, 40, 80, 120, 160, 200, 240) */}
                <path
                  d="M 0 100 C 15 80, 25 70, 40 70 C 55 70, 65 50, 80 50 C 95 50, 105 30, 120 30 C 135 30, 145 10, 160 10 C 175 10, 185 40, 200 40 C 215 40, 225 30, 240 30 L 240 100 Z"
                  fill="url(#chartGradient)"
                />

                {/* Smooth Curve Line */}
                <path
                  d="M 0 100 C 15 80, 25 70, 40 70 C 55 70, 65 50, 80 50 C 95 50, 105 30, 120 30 C 135 30, 145 10, 160 10 C 175 10, 185 40, 200 40 C 215 40, 225 30, 240 30"
                  fill="none"
                  stroke="#F77019"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Highlighted Tooltip Marker (at X=160, Y=10) */}
                <line x1="160" y1="10" x2="160" y2="100" stroke="#F77019" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="160" cy="10" r="4.5" fill="#F77019" stroke="white" strokeWidth="1.5" />
                <circle cx="160" cy="10" r="1.5" fill="white" />
              </svg>
            </div>

            {/* X-axis Labels */}
            <div className="flex justify-between px-1 text-[8px] text-[#999] font-bold">
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
              <span>일</span>
            </div>
          </div>

          {/* Ad 배너 */}
          <div className="rounded-2xl border border-dashed border-[#1D1C1C]/10 bg-[#FAFAFA] flex flex-col items-center justify-center h-[90px] mt-auto">
            <span className="text-xs font-black text-[#CCC] uppercase tracking-wider">AD</span>
            <span className="text-[9px] text-[#CCC] mt-1">광고 배너 영역</span>
          </div>
        </div>

        {/* ─── MIDDLE COLUMN ─── */}
        <div className="flex flex-col gap-4">

          {/* 진행 중 프로젝트 TOP 3 + 새로 등록하기 버튼 (윗선 정렬) */}
          <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-[#1D1C1C]">진행 중 프로젝트 TOP 3</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {topProjects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/20 transition-colors group cursor-pointer">
                  <img src={p.thumb} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#1D1C1C]/5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate group-hover:text-[#F77019] transition-colors">{p.title}</span>
                      <span className="text-[8px] font-bold text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded flex-shrink-0">{p.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
                        <div className="h-full rounded-full bg-[#F77019]" style={{ width: `${(p.progress / p.total) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-[#999] font-semibold flex-shrink-0">평가 {p.progress} / {p.total}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#F77019] flex-shrink-0 bg-[#F77019]/5 px-2 py-1 rounded-lg">{p.rating}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/builder/projects')} className="text-[11px] font-bold text-[#F77019] flex items-center gap-0.5 hover:underline mt-3">
              진행 중 프로젝트 전체 보기 <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bottom row: 작성 중 프로젝트 + 인사이트 요약 */}
          <div className="grid grid-cols-2 gap-4">

            {/* 작성 중 프로젝트 */}
            <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col h-full min-h-[240px]">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#999]" />
                <span className="text-[11px] font-black text-[#666]">작성 중 프로젝트</span>
              </div>
              <div className="flex flex-col gap-3">
                {draftProjects.map((d) => (
                  <div key={d.id} className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-[#1D1C1C]/5">
                    <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate">{d.title}</span>
                    <span className="text-[9px] text-[#999]">{d.lastEdit}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#EEEEEE] overflow-hidden">
                        <div className="h-full rounded-full bg-[#F77019]/60" style={{ width: `${d.progress}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-[#F77019]">{d.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/builder/projects')} className="text-[11px] font-bold text-[#F77019] flex items-center gap-0.5 hover:underline mt-3">
                작성 중 프로젝트 전체 보기 <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 완료된 리포트 */}
            <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col h-full min-h-[240px]">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#1565C0]" />
                <span className="text-[11px] font-black text-[#666]">완료된 리포트</span>
              </div>
              <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
                {completedReports.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1D1C1C]/5 hover:border-[#F77019]/20 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: `${r.color}15` }}>
                      <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-extrabold text-[#1D1C1C] truncate block group-hover:text-[#F77019] transition-colors">{r.title}</span>
                      <span className="text-[9px] text-[#999] mt-0.5 block">{r.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/builder/reports')} className="text-[11px] font-bold text-[#F77019] flex items-center gap-0.5 hover:underline mt-auto">
                완료된 리포트 전체 보기 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="flex flex-col gap-4">

          {/* 새로 등록하기 버튼 */}
          <button onClick={() => router.push('/builder/new-request')} className="w-full flex items-center justify-center gap-1.5 font-black rounded-2xl text-white text-xs py-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg,#F77019,#F77019)', boxShadow: '0 4px 12px rgba(247,112,25,0.2)' }}>
            <PlusCircle className="w-4 h-4" />
            새 프로젝트 등록하기
          </button>

          {/* Fit Credit */}
          <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col">
            <span className="text-[11px] font-black text-[#666] mb-1">Fit Credit</span>
            <span className="text-[9px] text-[#999]">사용 가능 크레딧</span>

            <div className="flex items-end justify-between mt-3 mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#F77019]">12,500</span>
                <Coins className="w-4 h-4 text-[#F77019]" />
              </div>
              <button className="text-[10px] font-black text-white bg-[#F77019] px-3 py-1.5 rounded-lg hover:opacity-90 transition-all">
                충전하기
              </button>
            </div>

            <button className="text-[11px] font-bold text-[#F77019] flex items-center gap-0.5 hover:underline mt-3">
              Fit Credit 내역 보기 <ArrowRight className="w-3 h-3" />
            </button>
          </div>



          {/* 최근 활동 */}
          <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col">
            <span className="text-[11px] font-black text-[#666] mb-3">최근 활동</span>
            <div className="flex flex-col gap-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-[#1D1C1C] font-semibold truncate pr-2">{a.text}</span>
                  <span className="text-[#999] text-[9px] flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 실시간 변동 현황 */}
          <div className="rounded-2xl border border-[#1D1C1C]/5 bg-white p-5 flex flex-col min-h-[120px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F77019] animate-pulse" />
                <span className="text-[11px] font-black text-[#666]">실시간 변동 현황</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: '참여 중 리뷰어', value: '128명', sub: '↑ 16명' },
                { label: '오늘 방문 리뷰', value: '43건', sub: '↑ 8건' },
                { label: '평균 평점', value: '4.2 / 5.0', sub: '' },
                { label: '평균 응답 시간', value: '2.3시간', sub: '↓ 0.5h' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col p-1.5 rounded-lg bg-[#FAFAFA] border border-[#1D1C1C]/3">
                  <span className="text-[8px] text-[#999] font-bold">{s.label}</span>
                  <span className="text-xs font-black text-[#1D1C1C] mt-0.5">{s.value}</span>
                  {s.sub && <span className="text-[8px] text-[#F77019] font-extrabold">{s.sub}</span>}
                </div>
              ))}
            </div>
            <span className="text-[8px] text-[#999] font-medium mt-auto pt-2 text-right">갱신주기: 2시간</span>
          </div>

        </div>
      </div>



      {/* ═══ SYSTEM NOTICE (기존 유지) ═══ */}
      <div className="w-full rounded-xl border border-[#1D1C1C]/5 bg-white p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#F77019] flex-shrink-0" />
          <span className="font-extrabold text-[#1D1C1C]">시스템 공지:</span>
          <span className="text-[#666] truncate max-w-[500px]">
            전문 평가단 등급 세분화 패치가 완료되었습니다. 전문가 패널 검증 단가가 인상되었습니다.
          </span>
        </div>
        <div className="flex items-center gap-4">
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
