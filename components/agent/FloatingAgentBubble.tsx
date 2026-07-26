'use client'

import { Bot, X } from 'lucide-react'
import AgentPanel from './AgentPanel'
import { useAgentBubble } from './AgentBubbleContext'

// 크리에이터 전 화면(app/builder/layout.tsx)에서 상시 떠 있는 플로팅 Agent.
// 여기서 AgentPanel을 딱 한 번만 마운트해서 페이지를 옮겨다녀도(대시보드↔
// 프로젝트↔마법사↔리포트) 대화가 그대로 유지된다 — AgentPanel 내부 로직은
// 전혀 안 건드리고, "열림/닫힘"만 CSS로 토글한다.
export default function FloatingAgentBubble() {
  const { isOpen, reportProjectId, seedMessage, open, close } = useAgentBubble()

  return (
    <>
      {/* 토글 버튼 — 열려있을 때는 숨김(카드 안에 닫기 버튼이 따로 있음) */}
      {!isOpen && (
        <button
          onClick={open}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(247,112,25,0.35)] hover:scale-105 active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }}
          title="FindFit Agent"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* 열림 상태 — 우하단 고정 카드. isOpen이 false일 때도 AgentPanel을
          언마운트하지 않고 display만 숨겨서 대화 상태를 보존한다. */}
      <div
        className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-96px)] rounded-3xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] border border-[#1D1C1C]/8 overflow-hidden flex flex-col"
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 border border-[#1D1C1C]/10 flex items-center justify-center text-[#666] hover:text-[#1D1C1C] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <AgentPanel isExpanded={false} reportProjectIdOverride={reportProjectId} initialSeedMessage={seedMessage} />
      </div>
    </>
  )
}
