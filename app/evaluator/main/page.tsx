'use client'

import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import SharedMainPanel from '@/components/shared/SharedMainPanel'
import { RightPanelProvider } from '@/components/shared/RightPanelContext'

// 예전 듀얼 패널 시절 "메인" 탭(AgentPanel) — 단일화면으로 합치면서
// 별도 라우트로 승격. isExpanded:true로 고정해 항상 펼쳐진 모드로 렌더.
export default function EvaluatorMainPage() {
  return (
    <ReviewerLayout>
      <RightPanelProvider value={{ tab: 'main', setTab: () => {}, isExpanded: true }}>
        <SharedMainPanel />
      </RightPanelProvider>
    </ReviewerLayout>
  )
}
