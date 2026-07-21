'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import PainPointSection from './PainPointSection'
import ComparisonSection from './ComparisonSection'

// Sequence:
// 1. PainPointSection ("혹시 이런 경험 있으신가요?")
// 2. Horizontal slide -> ComparisonSection ("Why FindFit?")
// 3. Scroll blur transition -> Quote reveal ("FindFit 이전과 이후...")
// 4. Scroll down to next section
export default function PainToCompareReveal() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Phase 1 (0 -> 0.45): Horizontal slide from PainPointSection to ComparisonSection
  const trackX = useTransform(scrollYProgress, [0, 0.45], ['0%', '-50%'])

  return (
    <div ref={containerRef} className="relative" style={{ height: '260vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="flex h-full" style={{ width: '200%', x: trackX }}>
          {/* Panel 1: PainPointSection */}
          <div className="h-full overflow-y-auto" style={{ width: '50%' }}>
            <PainPointSection />
          </div>

          {/* Panel 2: ComparisonSection (Why FindFit) with interactive blur & quote phase */}
          <div className="h-full overflow-hidden" style={{ width: '50%' }}>
            <ComparisonSection progress={scrollYProgress} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
