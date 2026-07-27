import { Suspense } from 'react'
import CreatorLayout from '@/components/creator/CreatorLayout'
import PreviewPage from '@/components/builder/PreviewPage'

export default function BuilderNewRequestPreviewPage() {
  return (
    <CreatorLayout>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <PreviewPage />
      </Suspense>
    </CreatorLayout>
  )
}
