'use client'

import { useEffect } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import Footer from './Footer'
import CreatorPeek from './CreatorPeek'
import ScrollIndicator from './ScrollIndicator'
import RoleSection from './RoleSection'
import FAQSection from './FAQSection'

function ReviewerHeader({ onSwitchToCreator }: { onSwitchToCreator: () => void }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="max-w-[1440px] mx-auto px-12 pt-0 pb-5 flex items-center justify-between">
        <img src="/logo.png" alt="FindFit" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={onSwitchToCreator}
            className="flex items-center gap-2 text-white/55 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            크리에이터 알아보기
          </button>
          <a
            href="/evaluator/dashboard"
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            style={{ background: '#42A5F5', boxShadow: '0 4px 16px rgba(66,165,245,0.3)' }}
          >
            리뷰어 등록하기
          </a>
        </div>
      </div>
    </header>
  )
}

// ── 결정론적 PRNG (SSR/CSR 동일 결과 → 하이드레이션 불일치 방지) ──
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 역할 소개 우측 비주얼: 유기적 파티클 가닥 (이중나선 + 분진) ──
type Particle = { x: number; y: number; r: number; o: number; c: string }
const STRAND: Particle[] = (() => {
  const rand = mulberry32(20260521)
  const pts: Particle[] = []
  const N = 130, turns = 3, H = 540, cx = 250, A = 92, top = 50
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const ang = t * Math.PI * 2 * turns
    const y = top + t * H
    const d1 = (Math.sin(ang) + 1) / 2
    const d2 = (Math.sin(ang + Math.PI) + 1) / 2
    pts.push({ x: cx + A * Math.sin(ang), y, r: 1.4 + d1 * 3.2, o: 0.18 + d1 * 0.6, c: d1 > 0.55 ? '#8FCBFF' : '#42A5F5' })
    pts.push({ x: cx + A * Math.sin(ang + Math.PI), y, r: 1.4 + d2 * 3.2, o: 0.18 + d2 * 0.6, c: d2 > 0.55 ? '#8FCBFF' : '#1E6FD6' })
  }
  // 흩어진 분진
  for (let i = 0; i < 95; i++) {
    pts.push({ x: cx + (rand() * 2 - 1) * 175, y: top + rand() * H, r: 0.6 + rand() * 1.7, o: 0.05 + rand() * 0.16, c: '#42A5F5' })
  }
  return pts
})()

function ParticleStrand() {
  return (
    <div className="relative" style={{ width: '500px', height: '640px' }}>
      {/* 글로우 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 55% 55% at 50% 45%, rgba(66,165,245,0.22) 0%, transparent 70%)',
      }} />
      <svg viewBox="0 0 500 640" className="relative w-full h-full" aria-hidden>
        <defs>
          <filter id="strandGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* 나선 연결 막대 (가닥감) */}
        {Array.from({ length: 13 }).map((_, i) => {
          const t = (i + 0.5) / 13
          const ang = t * Math.PI * 2 * 3
          const y = 50 + t * 540
          const x1 = 250 + 92 * Math.sin(ang)
          const x2 = 250 + 92 * Math.sin(ang + Math.PI)
          return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#42A5F5" strokeWidth="1" opacity={0.12} />
        })}
        <g filter="url(#strandGlow)">
          {STRAND.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity={p.o} />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── Benefits 중앙 포컬: 수익 사다리 (전문성↑ = 수익↑) ──
function EarningsLadder() {
  const MAX = 290
  return (
    <div className="relative select-none" style={{ width: '380px' }}>
      {/* 글로우 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 55% 60%, rgba(66,165,245,0.18) 0%, transparent 70%)',
      }} />

      {/* 세로축 라벨 */}
      <div className="absolute left-0 top-2 flex items-center gap-1.5 text-white/35 text-[11px] font-bold tracking-wider">
        <ArrowRight className="w-3.5 h-3.5 -rotate-90" /> 수익
      </div>

      {/* 막대 */}
      <div className="relative flex items-end justify-center gap-6 pl-6" style={{ height: MAX + 56 }}>
        {grades.map((g) => (
          <div key={g.badge} className="flex flex-col items-center" style={{ width: '92px' }}>
            <span className="font-black text-white tabular-nums mb-2.5 whitespace-nowrap"
              style={{ fontSize: g.top ? '15px' : '13px' }}>
              {g.range}
            </span>
            <div
              className="w-full rounded-t-2xl relative flex items-start justify-center pt-3"
              style={{
                height: `${g.h * MAX}px`,
                background: g.top
                  ? 'linear-gradient(180deg, #42A5F5 0%, #1E6FD6 100%)'
                  : `linear-gradient(180deg, ${g.color}33 0%, ${g.color}14 100%)`,
                border: `1px solid ${g.top ? 'rgba(66,165,245,0.6)' : g.color + '40'}`,
                boxShadow: g.top ? '0 0 40px rgba(66,165,245,0.45)' : 'none',
              }}
            >
              {g.stars && (
                <span className="text-[11px]" style={{ color: g.top ? '#fff' : g.color }}>{g.stars}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 베이스라인 */}
      <div className="h-px ml-6" style={{ background: 'rgba(255,255,255,0.12)' }} />

      {/* 등급명 + 가로축 라벨 */}
      <div className="flex justify-center gap-6 pl-6 mt-3">
        {grades.map((g) => (
          <span key={g.badge} className="text-center font-semibold leading-tight"
            style={{ width: '92px', fontSize: '12px', color: g.top ? '#42A5F5' : 'rgba(255,255,255,0.5)' }}>
            {g.badge}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-4 text-white/35 text-[11px] font-bold tracking-wider">
        전문성 <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  )
}

// ── Data ────────────────────────────────────────────────────
// Benefits 우측 리스트 (이미지3 구도 — 수익화 항목을 함께 녹임)
const benefitItems: { title: string; lines: [string, string] }[] = [
  {
    title: '전문성이 곧 수익',
    lines: ['등급이 오를수록 리뷰당 단가가 올라가요.', '도메인 전문가는 리뷰 한 건에 최대 3,000원.'],
  },
  {
    title: '내 분야 제품만',
    lines: ['관심 카테고리와 일치하는 의뢰만', '골라서 참여할 수 있어요.'],
  },
  {
    title: '신제품 선행 접근',
    lines: ['아직 세상에 없는 제품을', '누구보다 먼저 경험해요.'],
  },
]

const grades = [
  { badge: '일반', color: '#9CA3AF', range: '500~800', h: 0.4 },
  { badge: '전문가', stars: '★★', color: '#F77019', range: '1,200~1,800', h: 0.68 },
  { badge: '도메인 전문가', stars: '★★★', color: '#42A5F5', range: '2,000~3,000', h: 1, top: true },
]

const howSteps = [
  { n: '1', title: '프로필 등록', sub: '관심 도메인과 경력을 입력해요.' },
  { n: '2', title: '의뢰 알림 수신', sub: '매칭된 신제품 의뢰가 도착해요.' },
  { n: '3', title: '리뷰 후 즉시 적립', sub: '20분 리뷰 완료 후 포인트가 쌓여요.' },
]

const reviewerFAQ = [
  { q: '리뷰어 자격 조건이 있나요?', a: '별도 자격 조건은 없어요. 관심 분야를 등록하고 프로필을 완성하면 바로 시작할 수 있어요. 경력 인증 시 더 높은 단가가 적용돼요.' },
  { q: '포인트는 어떻게 사용하나요?', a: '적립된 포인트는 카카오톡 기프티콘으로 교환하거나, 5만 포인트 이상 시 현금으로 출금할 수 있어요.' },
  { q: '리뷰는 얼마나 걸리나요?', a: '의뢰당 평균 15~25분 정도 걸려요. 정량 질문 10개와 정성 질문 3개로 구성되어 있어요.' },
]

// ── Main ────────────────────────────────────────────────────
interface Props { onSwitchToCreator: () => void }

export default function ReviewerLanding({ onSwitchToCreator }: Props) {
  useEffect(() => {
    document.documentElement.classList.add('snap-active')
    return () => document.documentElement.classList.remove('snap-active')
  }, [])

  return (
    <div style={{ background: '#0D0D10', color: '#fff' }}>
      <ReviewerHeader onSwitchToCreator={onSwitchToCreator} />
      <CreatorPeek onEnter={onSwitchToCreator} />
      <ScrollIndicator side="right" mode="reviewer" />

      {/* Hero */}
      <section id="reviewer-hero" className="snap-section relative">
        {/* dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 60% 40%, rgba(66,165,245,0.1) 0%, transparent 70%)',
        }} />

        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center relative z-10">
          <div className="max-w-[680px]">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(66,165,245,0.12)', border: '1px solid rgba(66,165,245,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#42A5F5] animate-pulse" />
              <span className="text-[#42A5F5] text-xs font-semibold uppercase tracking-widest">Reviewer</span>
            </div>
            <h1 className="font-black leading-[1.0] tracking-tight mb-8"
              style={{ fontSize: 'clamp(52px, 6vw, 96px)' }}>
              신제품을<br />
              <span style={{ color: '#42A5F5' }}>먼저</span><br />
              경험하세요
            </h1>
            <p className="text-white/50 leading-relaxed mb-12 max-w-[440px]"
              style={{ fontSize: 'clamp(16px, 1.2vw, 20px)' }}>
              관심 분야의 출시 전 제품을 리뷰하고<br />
              전문성을 수익으로 연결하세요.
            </p>
            <a
              href="/evaluator/dashboard"
              className="flex items-center gap-2 font-bold rounded-full text-white hover:scale-[1.03] transition-transform"
              style={{ background: '#42A5F5', padding: '16px 36px', fontSize: '16px', boxShadow: '0 4px 32px rgba(66,165,245,0.35)' }}
            >
              리뷰어 등록하기 <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Role intro — 리뷰어란 (이미지4 스타일: 좌 헤딩+아웃라인 버튼 / 우 파티클 비주얼) */}
      <section id="reviewer-role-intro" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* 우측 글로우 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 70% at 78% 50%, rgba(66,165,245,0.08) 0%, transparent 70%)',
        }} />

        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center justify-between gap-10 relative z-10">

          {/* 좌측: 라벨 + 헤딩 + 문단 + 아웃라인 버튼 */}
          <div className="flex flex-col items-start flex-shrink-0" style={{ maxWidth: '520px' }}>
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.25em] mb-7">What reviewers do</p>
            <h2 className="font-bold leading-[1.08] tracking-tight mb-8" style={{ fontSize: 'clamp(40px, 4vw, 68px)' }}>
              당신의 경험으로<br />제품을 진단하세요
            </h2>
            <p className="text-white/45 leading-relaxed mb-11" style={{ fontSize: '17px', maxWidth: '420px' }}>
              출시 전 신제품을 직접 써보고 솔직한 피드백을 남기면,
              그 데이터가 제품의 방향을 결정해요. 전문성을 살려 부수입까지 얻으세요.
            </p>
            <a
              href="/evaluator/dashboard"
              className="group flex items-center gap-3 rounded-full font-semibold text-white transition-colors"
              style={{ padding: '15px 32px', fontSize: '14px', letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              리뷰어 시작하기
              <span className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                style={{ background: 'rgba(66,165,245,0.15)' }}>
                <ArrowRight className="w-3.5 h-3.5 text-[#42A5F5]" />
              </span>
            </a>
          </div>

          {/* 우측: 유기적 파티클 비주얼 */}
          <div className="hidden lg:flex justify-end flex-shrink-0">
            <ParticleStrand />
          </div>

        </div>
      </section>

      {/* Benefits (+ Earnings 통합) — 이미지3 구도: 좌 헤딩+버튼 / 중앙 포컬 / 우 리스트 */}
      <section id="reviewer-benefits" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center justify-between gap-10">

          {/* 좌측: 헤딩 + 문단 + 버튼 */}
          <div className="flex flex-col items-start flex-shrink-0" style={{ maxWidth: '340px' }}>
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.25em] mb-5">Benefits</p>
            <h2 className="font-bold leading-[1.08] mb-7" style={{ fontSize: 'clamp(36px, 3.4vw, 60px)' }}>
              리뷰어가<br />얻는 것
            </h2>
            <p className="text-white/45 leading-relaxed mb-9" style={{ fontSize: '15px' }}>
              관심 분야 신제품을 먼저 경험하고,
              전문성이 쌓일수록 더 큰 보상을 받아요.
            </p>
            <a
              href="/evaluator/dashboard"
              className="flex items-center gap-3 rounded-full font-bold text-white hover:scale-[1.03] transition-transform"
              style={{ background: '#42A5F5', padding: '14px 28px', fontSize: '15px', boxShadow: '0 4px 24px rgba(66,165,245,0.3)' }}
            >
              리뷰어 등록하기
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>

          {/* 중앙: 수익 사다리 (전문성↑ = 수익↑ — Earnings 녹임) */}
          <div className="hidden lg:flex justify-center flex-shrink-0">
            <EarningsLadder />
          </div>

          {/* 우측: 혜택 리스트 (구분선) */}
          <div className="flex flex-col items-end flex-shrink-0" style={{ maxWidth: '340px' }}>
            {benefitItems.map((item, i) => (
              <div key={item.title} className="w-full">
                {i > 0 && <div className="h-px bg-white/10 my-6" />}
                <h3 className="text-white font-semibold mb-2 text-right" style={{ fontSize: '21px' }}>{item.title}</h3>
                {item.lines.map((line, j) => (
                  <p key={j} className="text-white/45 text-sm text-right leading-snug">{line}</p>
                ))}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How it works */}
      <section id="reviewer-how" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center">
          <div className="w-full">
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="font-bold mb-14" style={{ fontSize: 'clamp(32px, 3vw, 52px)' }}>딱 3단계로 시작해요</h2>
            <div className="grid grid-cols-3 gap-10">
              {howSteps.map((s, i) => (
                <div key={s.n} className="flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                      style={{ background: '#42A5F5' }}>
                      {s.n}
                    </div>
                    {i < 2 && <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection
        id="reviewer-faq"
        dark={true}
        title="자주 묻는 질문"
        items={reviewerFAQ}
      />

      {/* RoleSection (역할) */}
      <div id="reviewer-role" className="snap-section">
        <RoleSection onSeeCreator={onSwitchToCreator} dark={true} />
      </div>

      {/* Footer */}
      <div className="snap-section-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Footer />
      </div>
    </div>
  )
}
