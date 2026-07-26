import { Suspense } from 'react'
import CreatorLayout from '@/components/creator/CreatorLayout'
import CreatorHome from '@/components/creator/CreatorHome'

export default function BuilderDashboardPage() {
  return (
    <CreatorLayout>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <CreatorHome />
      </Suspense>
    </CreatorLayout>
  )
}
