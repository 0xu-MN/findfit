import { Suspense } from 'react'
import DashboardLayout from '@/components/shared/DashboardLayout'
import CompletePage from '@/components/builder/CompletePage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function BuilderNewRequestCompletePage() {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <CompletePage />
      </Suspense>
    </DashboardLayout>
  )
}
