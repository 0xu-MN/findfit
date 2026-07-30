'use client'

import CreatorLayout from '@/components/creator/CreatorLayout'
import SharedScrapGrid from '@/components/shared/SharedScrapGrid'

export default function CreatorScrapsPage() {
  return (
    <CreatorLayout>
      <div className="w-full max-w-[1200px] mx-auto py-8 px-4">
        <SharedScrapGrid basePath="builder" />
      </div>
    </CreatorLayout>
  )
}
