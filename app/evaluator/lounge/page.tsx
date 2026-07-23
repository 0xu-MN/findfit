'use client'

import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import { RightPanelProvider } from '@/components/shared/RightPanelContext'

// 예전 듀얼 패널 시절 "라운지" 탭 — 단일화면으로 합치면서 별도 라우트로 승격.
export default function EvaluatorLoungePage() {
  return (
    <ReviewerLayout>
      <RightPanelProvider value={{ tab: 'lounge', setTab: () => {}, isExpanded: true }}>
        <SharedLoungeFeed />
      </RightPanelProvider>
    </ReviewerLayout>
  )
}
