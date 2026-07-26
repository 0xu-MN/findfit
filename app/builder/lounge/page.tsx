'use client'

import CreatorLayout from '@/components/creator/CreatorLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import { RightPanelProvider } from '@/components/shared/RightPanelContext'

// 예전 듀얼 패널 시절 "라운지" 탭 — 단일화면으로 합치면서 별도 라우트로 승격.
// app/evaluator/lounge/page.tsx와 동일한 패턴.
export default function CreatorLoungePage() {
  return (
    <CreatorLayout>
      <RightPanelProvider value={{ tab: 'lounge', setTab: () => {}, isExpanded: true }}>
        <SharedLoungeFeed />
      </RightPanelProvider>
    </CreatorLayout>
  )
}
