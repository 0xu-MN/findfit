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

  useEffect(() => {
    document.documentElement.classList.add('snap-active')
    return () => document.documentElement.classList.remove('snap-active')
  }, [])

  const switchTo = (next: View) => {
    if (next === view) return

    const applyState = () => {
      setView(next)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }

    // View Transitions API — 별도 슬라이드/스케일 연출 없이, 브라우저가
    // 이전 화면 스냅샷을 아주 짧게 크로스페이드하며 다음 화면으로 넘긴다.
    // (지속시간은 globals.css의 ::view-transition-old/new(root)에서 제어)
    // 미지원 브라우저(Safari 등)는 그냥 즉시 전환됨.
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

  if (view === 'reviewer') {
    return (
      <main key="reviewer">
        <ReviewerLanding onSwitchToCreator={() => switchTo('creator')} />
      </main>
    )
  }

  return (
    <div style={{ background: '#F8F8F8' }}>
      <Header />
      <ScrollIndicator side="left" mode="creator" />
      <ReviewerPeek onEnter={() => switchTo('reviewer')} />

      <main key="creator">

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
