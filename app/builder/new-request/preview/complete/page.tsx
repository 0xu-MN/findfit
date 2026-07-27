import { Suspense } from 'react'
import CreatorLayout from '@/components/creator/CreatorLayout'
import CompletePage from '@/components/builder/CompletePage'

export default function BuilderNewRequestCompletePage() {
  return (
    <CreatorLayout>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <CompletePage />
      </Suspense>
    </CreatorLayout>
  )
}
