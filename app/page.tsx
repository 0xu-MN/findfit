'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import PainPointSection from '@/components/landing/PainPointSection'
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
