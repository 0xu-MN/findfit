'use client'

import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import SharedScrapGrid from '@/components/shared/SharedScrapGrid'

export default function EvaluatorScrapsPage() {
  return (
    <ReviewerLayout>
      <div className="w-full max-w-[1200px] mx-auto py-8 px-4">
        <SharedScrapGrid basePath="evaluator" />
      </div>
    </ReviewerLayout>
  )
}
