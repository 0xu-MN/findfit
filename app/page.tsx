'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import PainToCompareReveal from '@/components/landing/PainToCompareReveal'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import TrustSection from '@/components/landing/TrustSection'
import RoleSection from '@/components/landing/RoleSection'
import ScrollIndicator from '@/components/landing/ScrollIndicator'
import ReviewerPeek from '@/components/landing/ReviewerPeek'
import ReviewerLanding from '@/components/landing/ReviewerLanding'
import Footer from '@/components/landing/Footer'

type View = 'creator' | 'reviewer'

export default function LandingPage() {
  const [view, setView] = useState<View>('creator')
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right')

  useEffect(() => {
    document.documentElement.classList.add('snap-active')
    return () => document.documentElement.classList.remove('snap-active')
  }, [])

  const switchTo = (next: View) => {
    if (next === view) return

    const applyState = () => {
      setSlideDir(next === 'reviewer' ? 'right' : 'left')
      setView(next)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }

    // View Transitions API — 이전 화면과 새 화면을 실제로 크로스디졸브한다.
    // 크리에이터/리뷰어 히어로가 같은 배경 이미지의 반쪽씩을 같은 위치에
    // 그리고 있어서, 이 크로스페이드 덕분에 "하나의 배경이 이어지는" 것처럼
    // 보인다. 미지원 브라우저(Safari 등)는 기존 slide-in 애니메이션으로 대체.
    type DocumentWithViewTransition = Document & {
      startViewTransition?: (callback: () => void) => void
    }
    const doc = document as DocumentWithViewTransition
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(applyState)
    } else {
      applyState()
    }
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

        <div id="painpoint-section" className="snap-section-auto">
          <PainToCompareReveal />
        </div>

        <section id="features-section" className="snap-section">
          <FeaturesSection />
        </section>

        <HowItWorksSection />

        <TrustSection id="trust-section" />

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
