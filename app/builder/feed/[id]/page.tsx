'use client'

import { use } from 'react'
import CreatorLayout from '@/components/creator/CreatorLayout'
import InsightDetailView from '@/components/shared/InsightDetailView'

export default function CreatorInsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <CreatorLayout>
      <InsightDetailView postId={id} />
    </CreatorLayout>
  )
}
