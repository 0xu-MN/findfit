import { Suspense } from 'react'
import { AgentBubbleProvider } from '@/components/agent/AgentBubbleContext'
import FloatingAgentBubble from '@/components/agent/FloatingAgentBubble'

// 크리에이터 라우트 전체(대시보드/프로젝트/리포트/마법사/지갑/계정)를
// 감싸는 최상위 레이아웃. Next.js는 같은 레이아웃 아래에서 라우트만
// 바뀔 때 이 레이아웃 자체를 리마운트하지 않으므로, 여기서 한 번만
// 마운트된 FloatingAgentBubble(그 안의 AgentPanel)은 페이지를 옮겨다녀도
// 대화 상태를 그대로 유지한다.
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentBubbleProvider>
      {children}
      <Suspense fallback={null}>
        <FloatingAgentBubble />
      </Suspense>
    </AgentBubbleProvider>
  )
}
