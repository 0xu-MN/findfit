import { Suspense } from 'react'
import CreatorLayout from '@/components/creator/CreatorLayout'
import NewRequestPage from '@/components/builder/NewRequestPage'

export default function BuilderNewRequestPage() {
  return (
    <CreatorLayout>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <NewRequestPage />
      </Suspense>
    </CreatorLayout>
  )
}
