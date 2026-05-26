import { Suspense } from 'react'
import DashboardLayout from '@/components/shared/DashboardLayout'
import PreviewPage from '@/components/builder/PreviewPage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function BuilderNewRequestPreviewPage() {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <PreviewPage />
      </Suspense>
    </DashboardLayout>
  )
}
