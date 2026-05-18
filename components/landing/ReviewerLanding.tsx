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
    <header className="fixed top-0 left-0 w-full z-50"
      style={{ background: 'rgba(13,13,16,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto px-12 py-5 flex items-center justify-between">
        <span className="text-xl font-bold text-white tracking-tight">FindFit</span>
        <div className="flex items-center gap-4">
          <button
            onClick={onSwitchToCreator}
            className="flex items-center gap-2 text-white/55 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            크리에이터 알아보기
          </button>
          <button
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            style={{ background: '#42A5F5', boxShadow: '0 4px 16px rgba(66,165,245,0.3)' }}
          >
            리뷰어 등록하기
          </button>
        </div>
      </div>
    </header>
  )
}

// ── Data ────────────────────────────────────────────────────
const benefits = [
  { n: '01', title: '내 분야 제품만', desc: '관심 카테고리와 일치하는 의뢰만 알림으로 받아요.' },
  { n: '02', title: '리뷰당 최대 3,000원', desc: '전문성이 높을수록 단가가 올라가요. 기프티콘 또는 현금 전환.' },
  { n: '03', title: '출시 전 신제품 선행 접근', desc: '아직 세상에 나오지 않은 제품을 남들보다 먼저 경험해요.' },
  { n: '04', title: '내 피드백이 제품을 바꾼다', desc: '리뷰로 인해 제품이 피봇했을 때 알림이 와요.' },
]

const grades = [
  { badge: '일반', color: '#9CA3AF', range: '500~800원', cond: '가입 후 프로필 완성' },
  { badge: '전문가 ★★', color: '#F77019', range: '1,200~1,800원', cond: '도메인 태그 3개 이상, 리뷰 10건 이상' },
  { badge: '도메인전문가 ★★★', color: '#42A5F5', range: '2,000~3,000원', cond: '실무 경력 인증 + 품질 점수 상위 20%' },
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
      <section id="reviewer-hero" className="snap-section relative" style={{ paddingTop: '88px' }}>
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
            <button
              className="flex items-center gap-2 font-bold rounded-full text-white hover:scale-[1.03] transition-transform"
              style={{ background: '#42A5F5', padding: '16px 36px', fontSize: '16px', boxShadow: '0 4px 32px rgba(66,165,245,0.35)' }}
            >
              리뷰어 등록하기 <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="reviewer-benefits" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center">
          <div className="w-full">
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.2em] mb-4">Benefits</p>
            <h2 className="font-bold mb-10" style={{ fontSize: 'clamp(32px, 3vw, 52px)' }}>리뷰어가 얻는 것</h2>
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div key={b.n} className="rounded-2xl p-7"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-5xl font-black text-white/[0.05] block mb-3">{b.n}</span>
                  <h3 className="text-base font-bold text-white mb-1.5">{b.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
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

      {/* Earnings */}
      <section id="reviewer-earnings" className="snap-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1440px] mx-auto px-16 h-full flex items-center">
          <div className="w-full">
            <p className="text-[#42A5F5] text-xs font-bold uppercase tracking-[0.2em] mb-4">Earnings</p>
            <h2 className="font-bold mb-12" style={{ fontSize: 'clamp(32px, 3vw, 52px)' }}>
              전문성이 높을수록<br />더 많이 받아요
            </h2>
            <div className="flex flex-col gap-3">
              {grades.map((g) => (
                <div key={g.badge} className="flex items-center justify-between rounded-2xl px-8 py-6"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="font-semibold" style={{ color: g.color, minWidth: '200px' }}>{g.badge}</span>
                  <span className="text-2xl font-black text-white">{g.range} / 리뷰</span>
                  <span className="text-white/30 text-sm text-right max-w-[260px]">{g.cond}</span>
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
        <RoleSection onSeeCreator={onSwitchToCreator} />
      </div>

      {/* CTA + Footer */}
      <div className="snap-section-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1440px] mx-auto px-16 py-24 text-center">
          <h2 className="font-black mb-6" style={{ fontSize: 'clamp(36px, 4vw, 64px)', color: '#fff' }}>
            지금 리뷰어로<br />참여하세요
          </h2>
          <p className="text-white/40 mb-10 text-lg">가입은 무료, 내 관심 분야 의뢰가 오면 알려드려요.</p>
          <button
            className="inline-flex items-center gap-2 font-bold rounded-full text-white hover:scale-[1.03] transition-transform"
            style={{ background: '#42A5F5', padding: '18px 48px', fontSize: '18px', boxShadow: '0 4px 32px rgba(66,165,245,0.3)' }}
          >
            리뷰어 등록하기 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <Footer />
      </div>
    </div>
  )
}
