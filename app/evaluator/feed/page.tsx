'use client'

import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import SharedFeedPanel from '@/components/shared/SharedFeedPanel'
import { RightPanelProvider } from '@/components/shared/RightPanelContext'

// 예전 듀얼 패널 시절 "피드"(매거진/아티클) 탭 — 단일화면으로 합치면서
// 별도 라우트로 승격. 리뷰어의 프로젝트 카드 피드(/evaluator/dashboard)와는
// 다른 콘텐츠(아티클)라 경로를 분리했다.
export default function EvaluatorArticleFeedPage() {
  return (
    <ReviewerLayout>
      <RightPanelProvider value={{ tab: 'feed', setTab: () => {}, isExpanded: true }}>
        <SharedFeedPanel />
      </RightPanelProvider>
    </ReviewerLayout>
  )
}
