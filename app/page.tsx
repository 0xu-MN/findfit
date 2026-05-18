'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import PainPointSection from '@/components/landing/PainPointSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import FAQSection from '@/components/landing/FAQSection'
import RoleSection from '@/components/landing/RoleSection'
import ScrollIndicator from '@/components/landing/ScrollIndicator'
import ReviewerPeek from '@/components/landing/ReviewerPeek'
import ReviewerLanding from '@/components/landing/ReviewerLanding'
import Footer from '@/components/landing/Footer'

type View = 'creator' | 'reviewer'

const creatorFAQ = [
  { q: '검증 의뢰는 어떻게 시작하나요?', a: '캐시를 충전하고 6단계 위자드를 따라 의뢰를 등록하면 돼요. 방법론을 몰라도 안내를 따라가면 5분 안에 완료할 수 있어요.' },
  { q: '리뷰어는 어떤 사람들인가요?', a: '관심 카테고리가 일치하는 실무 경력자들이에요. 일반/전문가/도메인전문가 등급별로 구성되어 있어요.' },
  { q: '결과는 언제 받을 수 있나요?', a: '의뢰 등록 후 72시간 이내에 AI 리포트로 전달돼요. 리뷰어가 모두 완료되면 자동으로 생성돼요.' },
  { q: '환불은 가능한가요?', a: '리뷰어 매칭 전까지는 전액 환불이 가능해요. 매칭 후 진행된 리뷰 건수에 대해서는 차등 환불이 적용돼요.' },
]

export default function LandingPage() {
  const [view, setView] = useState<View>('creator')
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right')

  useEffect(() => {
    document.documentElement.classList.add('snap-active')
    return () => document.documentElement.classList.remove('snap-active')
  }, [])

  const switchTo = (next: View) => {
    if (next === view) return
    setSlideDir(next === 'reviewer' ? 'right' : 'left')
    setView(next)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLElement>) => {
    const target = e.currentTarget
    target.classList.remove('perspective-slide-right', 'perspective-slide-left')
  }

  if (view === 'reviewer') {
    return (
      <main key="reviewer" className="perspective-slide-right" onAnimationEnd={handleAnimationEnd}>
        <ReviewerLanding onSwitchToCreator={() => switchTo('creator')} />
      </main>
    )
  }

  return (
    <div style={{ background: '#F8F8F8' }}>
      <Header />
      <ScrollIndicator side="left" mode="creator" />
      <ReviewerPeek onEnter={() => switchTo('reviewer')} />

      <main key="creator" className={slideDir === 'left' ? 'perspective-slide-left' : ''} onAnimationEnd={handleAnimationEnd}>

        <section id="hero-section" className="snap-section">
          <HeroSection />
        </section>

        <section id="painpoint-section" className="snap-section">
          <PainPointSection />
        </section>

        <section id="features-section" className="snap-section">
          <FeaturesSection />
        </section>

        <HowItWorksSection />

        <FAQSection
          id="faq-section"
          dark={false}
          title="자주 묻는 질문"
          items={creatorFAQ}
        />

        <section id="role-section" className="snap-section">
          <RoleSection onSeeReviewer={() => switchTo('reviewer')} />
        </section>

        <div className="snap-section-auto">
          <Footer />
        </div>
      </main>
    </div>
  )
}
