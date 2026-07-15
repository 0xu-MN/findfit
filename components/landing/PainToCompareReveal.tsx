'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import PainPointSection from './PainPointSection'
import ComparisonSection from './ComparisonSection'

// Pins the empathy section in place, then swaps it out for the comparison
// content via a horizontal slide as the user keeps scrolling — one continuous
// scroll gesture, two screens, no vertical hand-off in between.
export default function PainToCompareReveal() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Track is 200% wide (two panels); moving it by -50% of its own width
  // shifts exactly one panel (100vw) to the left.
  const trackX = useTransform(scrollYProgress, [0, 1], ['0%', '-50%'])

  return (
    <div ref={containerRef} className="relative" style={{ height: '200vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="flex h-full" style={{ width: '200%', x: trackX }}>
          <div className="h-full overflow-y-auto" style={{ width: '50%' }}>
            <PainPointSection />
          </div>
          <div className="h-full overflow-y-auto" style={{ width: '50%' }}>
            <ComparisonSection />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
