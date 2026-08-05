'use client'

import { Sparkles, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import AgentPanel from './AgentPanel'
import { useAgentBubble } from './AgentBubbleContext'

// 라운지/인사이트 페이지에서는 Agent 위젯 자체를 안 보이게 한다 — 그 화면들은
// 콘텐츠 소비/작성이 목적이라 위젯이 방해가 된다는 피드백 반영.
const HIDDEN_PREFIXES = ['/builder/lounge', '/builder/feed']

// 크리에이터 전 화면(app/builder/layout.tsx)에서 상시 떠 있는 플로팅 Agent.
// 여기서 AgentPanel을 딱 한 번만 마운트해서 페이지를 옮겨다녀도(대시보드↔
// 프로젝트↔마법사↔리포트) 대화가 그대로 유지된다 — AgentPanel 내부 로직은
// 전혀 안 건드리고, "열림/닫힘"만 CSS로 토글한다.
export default function FloatingAgentBubble() {
  const pathname = usePathname()
  const { isOpen, reportProjectId, seedMessage, seedTargetCustomer, activeReportProjectId, open, openForReport, close } = useAgentBubble()

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null

  return (
    <>
      {/* 토글 버튼 — 항상 같은 자리(우하단)에 떠 있고, 열림/닫힘에 따라
          아이콘만 Sparkles↔X로 바뀐다(인터콤류 챗 위젯 패턴). 지금 리포트
          화면에 떠 있는 상태에서 처음 열면 바로 그 리포트에 대한 대화로
          시작한다(자동 연계). 일반 문의 챗봇과 헷갈리지 않도록 로봇 아이콘
          대신 Sparkles + 은은한 글로우 링으로 "AI 에이전트"라는 인상을 준다. */}
      <button
        data-coach="agent-bubble"
        onClick={() => (isOpen ? close() : (activeReportProjectId ? openForReport(activeReportProjectId) : open()))}
        className="print:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(247,112,25,0.35)] hover:scale-105 active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }}
        title="FindFit Agent"
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }} />
        )}
        {isOpen ? <X className="relative w-6 h-6" /> : <Sparkles className="relative w-6 h-6" />}
      </button>

      {/* 열림 상태 — 우하단 고정 카드(토글 버튼 바로 위). isOpen이 false일
          때도 AgentPanel을 언마운트하지 않고 display만 숨겨서 대화 상태를
          보존한다. */}
      <div
        className="print:hidden fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-160px)] rounded-3xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] border border-[#1D1C1C]/8 overflow-hidden flex flex-col"
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        <AgentPanel isExpanded={false} reportProjectIdOverride={reportProjectId} initialSeedMessage={seedMessage} initialTargetCustomer={seedTargetCustomer} onClose={close} />
      </div>
    </>
  )
}
