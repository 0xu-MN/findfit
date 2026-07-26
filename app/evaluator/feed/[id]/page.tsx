'use client'

import { use } from 'react'
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import InsightDetailView from '@/components/shared/InsightDetailView'

export default function EvaluatorInsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ReviewerLayout>
      <InsightDetailView postId={id} />
    </ReviewerLayout>
  )
}
