'use client'

import CreatorLayout from '@/components/creator/CreatorLayout'
import SharedFeedPanel from '@/components/shared/SharedFeedPanel'
import { RightPanelProvider } from '@/components/shared/RightPanelContext'

// 예전 듀얼 패널 시절 "피드"(매거진/아티클) 탭 — 단일화면으로 합치면서
// 별도 라우트로 승격. app/evaluator/feed/page.tsx와 동일한 패턴.
export default function CreatorArticleFeedPage() {
  return (
    <CreatorLayout>
      <RightPanelProvider value={{ tab: 'feed', setTab: () => {}, isExpanded: true }}>
        <SharedFeedPanel basePath="builder" />
      </RightPanelProvider>
    </CreatorLayout>
  )
}
