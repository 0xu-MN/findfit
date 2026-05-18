'use client'

import { useState } from 'react'
import { ArrowRight, MousePointer2 } from 'lucide-react'

// 각 lines: [첫 번째 문장, 두 번째 문장] — 명확한 2줄
const creatorItems: { title: string; lines: [string, string] }[] = [
  {
    title: '아이디어 검증',
    lines: [
      '이 아이디어, 진짜 사람들이 돈 낼까요?',
      '출시 전에 30명에게 먼저 물어보세요.',
    ],
  },
  {
    title: '프로토타입 피드백',
    lines: [
      '만든 거 보여주고 솔직한 반응 받아보세요.',
      '72시간 안에 결과 리포트로 드립니다.',
    ],
  },
  {
    title: '베타 서비스 검증',
    lines: [
      '소수 사용자의 반응을 데이터로 확인하세요.',
      'PMF 달성 여부를 수치로 증명할 수 있어요.',
    ],
  },
  {
    title: 'PMF 측정',
    lines: [
      'Sean Ellis Test로 시장 적합성을 검증하세요.',
      '투자자에게 보여줄 정량 데이터를 확보하세요.',
    ],
  },
  {
    title: '출시 후 방향 설정',
    lines: [
      '다음 방향을 데이터로 결정하세요.',
      '어떤 세그먼트가 가장 열광하는지 찾아드립니다.',
    ],
  },
]

const reviewerItems = [
  { title: '내 분야 제품만', desc: '관심 카테고리와 일치하는 의뢰만 골라서 참여할 수 있어요.' },
  { title: '500~3,000원 포인트', desc: '리뷰 하나당 즉시 적립, 기프티콘이나 현금으로 전환돼요.' },
  { title: '신제품 선행 접근', desc: '아직 출시 안 된 제품을 누구보다 먼저 경험하세요.' },
]

function CreatorExpanded({ onSeeCreator }: { onSeeCreator?: () => void }) {
  return (
    <div className="absolute inset-0">

      <div className="absolute top-14 left-16 flex flex-col items-start">
        <p className="text-white/35 text-xs font-bold uppercase tracking-[0.22em] mb-5">Creator</p>
        <h3 className="text-white font-bold leading-[1.1] mb-8" style={{ fontSize: 'clamp(48px, 4vw, 72px)' }}>
          지금 어느<br />단계인가요?
        </h3>
        <p className="text-white/50 text-base leading-relaxed mb-8 max-w-[340px]">
          아이디어부터 출시 후까지 — 모든 단계에서<br />
          실제 사람들의 검증으로 방향을 잡으세요.
        </p>
        <button className="flex items-center gap-2 bg-[#F77019] hover:bg-[#d95e0e] text-white text-base font-semibold px-7 py-3.5 rounded-full transition-colors mb-4">
          의뢰 등록하기 <ArrowRight className="w-5 h-5" />
        </button>
        {/* 오버레이 안에서만 표시 — 닫기 버튼 */}
        {onSeeCreator && (
          <button
            onClick={onSeeCreator}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
          >
            ← 크리에이터 페이지로 돌아가기
          </button>
        )}
      </div>

      <div className="absolute bottom-14 right-16 flex flex-col items-end" style={{ maxWidth: '360px' }}>
        {creatorItems.map((item, i) => (
          <div key={item.title} className="w-full">
            {i > 0 && <div className="h-px bg-white/10 my-4" />}
            <h4 className="text-white font-semibold text-lg mb-1.5 text-right">{item.title}</h4>
            {item.lines.map((line, j) => (
              <p key={j} className="text-white/45 text-sm text-right leading-snug">{line}</p>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}

function ReviewerExpanded({ onSeeReviewer }: { onSeeReviewer?: () => void }) {
  return (
    <div className="absolute inset-0">

      <div className="absolute top-14 left-16 flex flex-col items-start">
        <p className="text-white/35 text-xs font-bold uppercase tracking-[0.22em] mb-5">Reviewer</p>
        <h3 className="text-white font-bold leading-[1.1] mb-8" style={{ fontSize: 'clamp(48px, 4vw, 72px)' }}>
          신제품을<br />먼저 보고<br />싶다면?
        </h3>
        <p className="text-white/50 text-base leading-relaxed mb-8 max-w-[340px]">
          당신의 경험이 누군가의 출시 결정을 바꿉니다.
        </p>
        <button className="flex items-center gap-2 bg-[#1565C0] hover:bg-[#0d47a1] text-white text-base font-semibold px-7 py-3.5 rounded-full transition-colors mb-4">
          평가단 신청하기 <ArrowRight className="w-5 h-5" />
        </button>
        {/* 크리에이터 페이지에서만 표시 — 리뷰어 상세 보기 버튼 */}
        {onSeeReviewer && (
          <button
            onClick={onSeeReviewer}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
          >
            리뷰어 입장 자세히 보기 →
          </button>
        )}
      </div>

      <div className="absolute bottom-14 right-16 flex flex-col items-end" style={{ maxWidth: '360px' }}>
        {reviewerItems.map((item, i) => (
          <div key={item.title} className="w-full">
            {i > 0 && <div className="h-px bg-white/10 my-6" />}
            <h4 className="text-white font-semibold text-xl mb-2 text-right">{item.title}</h4>
            <p className="text-white/45 text-sm leading-relaxed text-right">{item.desc}</p>
          </div>
        ))}
      </div>

    </div>
  )
}

interface RoleSectionProps {
  onSeeReviewer?: () => void  // 크리에이터 페이지: 리뷰어 오버레이 열기
  onSeeCreator?: () => void   // 리뷰어 오버레이: 닫고 크리에이터로 복귀
}

export default function RoleSection({ onSeeReviewer, onSeeCreator }: RoleSectionProps) {
  const [hovered, setHovered] = useState<'creator' | 'reviewer' | null>(null)

  const creatorW = hovered === 'creator' ? '65%' : hovered === 'reviewer' ? '35%' : '50%'
  const reviewerW = hovered === 'reviewer' ? '65%' : hovered === 'creator' ? '35%' : '50%'

  return (
    <section className="w-full" style={{ height: '100vh', minHeight: '800px' }}>

      {/* ── Title area — #F8F8F8 배경 ── */}
      <div
        className="flex items-end px-16 pb-8"
        style={{ height: '150px', background: '#F8F8F8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-end justify-between w-full max-w-[1440px] mx-auto">
          <h2 className="text-5xl font-bold tracking-tight text-[#1D1C1C]">
            어떤 역할로 시작하시나요?
          </h2>
          <p className="text-[#999] text-sm max-w-[320px] text-right leading-relaxed mb-1">
            크리에이터 또는 리뷰어로 참여하세요.
          </p>
        </div>
      </div>

      {/* ── Panels — #1D1C1C 배경, 나머지 높이 채움 ── */}
      <div
        className="flex overflow-hidden"
        style={{ height: 'calc(100vh - 150px)', minHeight: '650px', background: '#1D1C1C' }}
        onMouseLeave={() => setHovered(null)}
      >

        {/* Creator panel */}
        <div
          className="relative overflow-hidden cursor-pointer flex-shrink-0"
          style={{
            width: creatorW,
            transition: 'width 0.65s cubic-bezier(0.4,0,0.2,1)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}
          onMouseEnter={() => setHovered('creator')}
        >
          {/* bg glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 25% 40%, rgba(247,112,25,0.13) 0%, transparent 60%)' }} />

          {/* watermark */}
          <div
            className="absolute top-10 right-10 select-none pointer-events-none font-black text-white"
            style={{ fontSize: '130px', lineHeight: 1, opacity: hovered === 'creator' ? 0 : 0.03, transition: 'opacity 0.3s' }}
          >
            01
          </div>

          {/* Compressed label */}
          <div
            className="absolute bottom-12 left-12 pointer-events-none"
            style={{
              opacity: hovered === 'creator' ? 0 : 1,
              transform: hovered === 'creator' ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <p className="text-white/30 text-[11px] font-bold uppercase tracking-[0.18em]">Creator</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 animate-pulse">
                <MousePointer2 className="w-3 h-3 text-white/50" />
                <span className="text-[10px] text-white/50 font-medium tracking-wide">Hover</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-3xl font-bold">크리에이터</span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F77019]/10">
                <ArrowRight className="w-5 h-5 text-[#F77019]" />
              </div>
            </div>
          </div>

          {/* Expanded — absolute inset-0 so it fills the panel */}
          <div
            className="absolute inset-0"
            style={{
              opacity: hovered === 'creator' ? 1 : 0,
              transform: hovered === 'creator' ? 'translateX(0)' : 'translateX(-24px)',
              transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
              pointerEvents: hovered === 'creator' ? 'auto' : 'none',
            }}
          >
            <CreatorExpanded onSeeCreator={onSeeCreator} />
          </div>
        </div>

        {/* Reviewer panel */}
        <div
          className="relative overflow-hidden cursor-pointer flex-shrink-0"
          style={{
            width: reviewerW,
            transition: 'width 0.65s cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseEnter={() => setHovered('reviewer')}
        >
          {/* bg glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 75% 40%, rgba(21,101,192,0.15) 0%, transparent 60%)' }} />

          {/* watermark */}
          <div
            className="absolute top-10 right-10 select-none pointer-events-none font-black text-white"
            style={{ fontSize: '130px', lineHeight: 1, opacity: hovered === 'reviewer' ? 0 : 0.03, transition: 'opacity 0.3s' }}
          >
            02
          </div>

          {/* Compressed label */}
          <div
            className="absolute bottom-12 left-12 pointer-events-none"
            style={{
              opacity: hovered === 'reviewer' ? 0 : 1,
              transform: hovered === 'reviewer' ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <p className="text-white/30 text-[11px] font-bold uppercase tracking-[0.18em]">Reviewer</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 animate-pulse">
                <MousePointer2 className="w-3 h-3 text-white/50" />
                <span className="text-[10px] text-white/50 font-medium tracking-wide">Hover</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-3xl font-bold">리뷰어</span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#42A5F5]/10">
                <ArrowRight className="w-5 h-5 text-[#42A5F5]" />
              </div>
            </div>
          </div>

          {/* Expanded */}
          <div
            className="absolute inset-0"
            style={{
              opacity: hovered === 'reviewer' ? 1 : 0,
              transform: hovered === 'reviewer' ? 'translateX(0)' : 'translateX(24px)',
              transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
              pointerEvents: hovered === 'reviewer' ? 'auto' : 'none',
            }}
          >
            <ReviewerExpanded onSeeReviewer={onSeeReviewer} />
          </div>
        </div>

      </div>
    </section>
  )
}
