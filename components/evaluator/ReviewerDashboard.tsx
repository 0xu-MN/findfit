'use client'

import {
  Sparkles,
  CheckCircle2,
  Wallet,
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
  Coins
} from 'lucide-react'

// Dummy available review items
const availableReviews = [
  {
    id: 1,
    title: 'AI 기반 협업 문서 도구 "SyncDoc" 심사 의뢰',
    reward: '3,000 P',
    category: 'AI / SaaS',
    timeLeft: '4시간 남음',
    grade: '도메인 전문가 추천',
    gradeColor: '#1565C0'
  },
  {
    id: 2,
    title: '1인 가구를 위한 프리미엄 반찬 구독 서비스 유저 테스트',
    reward: '1,500 P',
    category: '커머스 / 식음료',
    timeLeft: '12시간 남음',
    grade: '일반 평가단 추천',
    gradeColor: '#9CA3AF'
  },
  {
    id: 3,
    title: '소상공인을 위한 일일 정산 가속화 대시보드 검토',
    reward: '4,000 P',
    category: '핀테크 / B2B',
    timeLeft: '24시간 남음',
    grade: '전문가 패널 추천',
    gradeColor: '#F77019'
  }
]

// Dummy past history
const pastReviews = [
  { id: 101, title: 'AI 기반 매칭 서비스 "FindFit" MVP 검증', status: '정산 완료', date: '어제', reward: '+2,500 P' },
  { id: 102, title: '헬스케어 수면 패턴 실시간 분석 모바일 앱', status: '정산 완료', date: '3일 전', reward: '+1,500 P' },
  { id: 103, title: '디자이너 포트폴리오 큐레이션 커뮤니티', status: '심사 완료', date: '5일 전', reward: '+1,500 P' }
]

export default function ReviewerDashboard() {
  return (
    <div className="w-full flex flex-col gap-6 select-none text-[#1D1C1C] pr-2">

      {/* ── Welcome Banner Card ── */}
      <div
        className="w-full rounded-[32px] border p-8 flex items-center justify-between relative overflow-hidden group shadow-[0_8px_32px_rgba(21,101,192,0.06)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.85) 100%)',
          borderColor: 'rgba(21,101,192,0.15)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col max-w-[700px] z-10">
          <div className="inline-flex items-center gap-1 text-[10px] font-black text-[#1565C0] mb-3 bg-[#1565C0]/10 px-2.5 py-1 rounded-full uppercase tracking-wider self-start border border-[#1565C0]/15">
            <Sparkles className="w-3 h-3 animate-pulse" /> Reviewer Dashboard
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Welcome, 리뷰어 님! 🌟
          </h2>
          <p className="text-xs text-[#666] leading-relaxed">
            세상에 없던 신제품과 혁신적인 스타트업 아이디어를 누구보다 먼저 체험하세요. 날카롭고 구조적인 리뷰를 남기면, 창업자의 인생 의사결정이 변하고 확실한 포인트 보상이 찾아옵니다.
          </p>
        </div>

        {/* Primary CTA Button */}
        <button
          className="flex items-center gap-2 font-black rounded-full text-white text-xs px-6 py-4 hover:scale-[1.03] active:scale-[0.98] transition-all z-10 cursor-pointer shadow-md"
          style={{
            background: 'linear-gradient(135deg, #1565C0 0%, #1e5bb0 100%)',
            boxShadow: '0 8px 24px rgba(21,101,192,0.25)',
          }}
        >
          <BookOpen className="w-4 h-4" />
          오늘의 신제품 리뷰하기
        </button>
      </div>

      {/* ── Main Dashboard Grids ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Widget 1: Earnings Wallet (4 columns) */}
        <div
          className="col-span-4 rounded-[28px] border p-6 flex flex-col justify-between"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(21,101,192,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-[#666] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#1565C0]" />
              내 포인트 현황
            </h3>
            <span className="text-[10px] font-bold text-[#1565C0] bg-[#1565C0]/10 px-2.5 py-0.5 rounded-md border border-[#1565C0]/15">
              보유 중
            </span>
          </div>

          <div className="flex flex-col mb-4">
            <span className="text-3xl font-black text-[#1565C0] tracking-tight">34,500 P</span>
            <span className="text-[9px] text-[#999] font-bold mt-1">누적 정산 출금액: 120,000 P</span>
          </div>

          <div className="h-px bg-[#1D1C1C]/5 w-full my-2" />

          {/* Point Cashout Actions */}
          <div className="flex items-center gap-3 mt-1">
            <button className="flex-1 py-3.5 rounded-2xl text-[10px] font-black border border-[#1565C0] text-[#1565C0] bg-[#1565C0]/5 hover:bg-[#1565C0] hover:text-white transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
              출금 신청하기 (5만 이상)
            </button>
            <button className="flex-1 py-3.5 rounded-2xl text-[10px] font-black border border-[#1D1C1C]/10 text-[#666] hover:bg-[#1D1C1C]/5 hover:text-[#1D1C1C] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
              기프티콘 교환
            </button>
          </div>
        </div>

        {/* Widget 2: Level & Domain Expert Gauge (8 columns) */}
        <div
          className="col-span-8 rounded-[28px] border p-6 flex flex-col justify-between shadow-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(21,101,192,0.12)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#1D1C1C] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#1565C0]" />
              평가 등급 및 전문 분야
            </h3>
            <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-md border border-[#F77019]/15 flex items-center gap-0.5">
              도메인 전문가 (★★★)
            </span>
          </div>

          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex flex-col">
              <span className="text-base font-black text-[#1D1C1C]">
                다음 등급 도약까지 250 P 남음
              </span>
              <span className="text-[10px] text-[#666] font-semibold mt-1">
                현재 등급: 전문 분야 B2B SaaS, IT/개발, 블록체인 7년 경력 인증 완료
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-[#1565C0] bg-[#1565C0]/10 px-3 py-1 rounded-md">
                신뢰성 스코어 99.4%
              </span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="w-full flex flex-col gap-2">
            <div className="w-full h-3 rounded-full bg-[#1D1C1C]/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: '85%',
                  background: 'linear-gradient(90deg, #1565C0 0%, #42A5F5 100%)',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#999] font-bold">
              <span>전문가 (★★)</span>
              <span>레벨업 게이지 (85%)</span>
              <span>최상위 도메인 마스터 (★★★)</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Secondary Grids (Tasks & History) ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Widget 3: Available Review Tasks (7 columns) */}
        <div
          className="col-span-7 rounded-[28px] border p-6 flex flex-col justify-between"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(21,101,192,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#1D1C1C] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#1565C0]" />
              참여 가능한 오늘의 신제품 검증 의뢰
            </h3>
            <span className="w-2 h-2 rounded-full bg-[#1565C0] animate-pulse" />
          </div>

          {/* Review tasks list */}
          <div className="flex flex-col gap-3">
            {availableReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1D1C1C]/3 border border-[#1D1C1C]/5 hover:border-[#1565C0]/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex flex-col max-w-[340px]">
                  <span className="text-xs font-black text-[#1D1C1C] group-hover:text-[#1565C0] transition-colors leading-snug">
                    {review.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded border"
                      style={{
                        color: review.gradeColor,
                        borderColor: `${review.gradeColor}25`,
                        background: `${review.gradeColor}08`
                      }}
                    >
                      {review.grade}
                    </span>
                    <span className="text-[9px] text-[#999] font-bold">{review.category}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs font-black text-[#1565C0] bg-[#1565C0]/10 px-2.5 py-1 rounded-lg">
                    {review.reward}
                  </span>
                  <span className="text-[9px] text-[#666] mt-1.5 flex items-center gap-0.5 font-bold">
                    <Clock className="w-3 h-3 text-[#999]" />
                    {review.timeLeft}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: Recent History & notices (5 columns) */}
        <div
          className="col-span-5 rounded-[28px] border p-6 flex flex-col justify-between"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(21,101,192,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#1D1C1C] uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#1565C0]" />
              최근 리뷰 제출 및 정산 내역
            </h3>
            <span className="text-[10px] text-[#666] font-bold">총 38건 완료</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {pastReviews.map((past) => (
              <div
                key={past.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1D1C1C]/3 border border-[#1D1C1C]/5 text-[10px]"
              >
                <div className="flex flex-col max-w-[200px]">
                  <span className="font-extrabold text-[#1D1C1C] truncate">{past.title}</span>
                  <span className="text-[#999] mt-0.5 text-[9px] font-bold">{past.date} 제출</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#2E7D32] bg-[#2E7D32]/10 px-1.5 py-0.5 rounded font-black text-[9px]">
                    {past.status}
                  </span>
                  <span className="font-black text-[#1565C0]">{past.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Notices & Quick Actions ── */}
      <div
        className="w-full rounded-[24px] border p-5 flex items-center justify-between text-xs"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          borderColor: 'rgba(21,101,192,0.05)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#1565C0] flex-shrink-0 animate-bounce" />
          <span className="font-extrabold text-[#1D1C1C]">리뷰어 주의사항:</span>
          <span className="text-[#666] truncate max-w-[500px]">
            AI 모니터링 시스템 패치로 인해 무성의하거나 부자연스러운 GPT 단순 복사 피드백은 정산 보류 및 등급 강등 사유가 됩니다.
          </span>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex items-center gap-4">
          <button className="font-bold text-[#666] hover:text-[#1565C0] transition-colors flex items-center gap-0.5">
            리뷰 작성 가이드 <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button className="font-bold text-[#666] hover:text-[#1565C0] transition-colors flex items-center gap-0.5">
            1:1 Q&A 문의 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  )
}
