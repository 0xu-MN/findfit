'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Agent 버블의 "열림/닫힘 + 어떤 모드인지"만 기억하는 얇은 UI 상태.
// AgentPanel 내부의 대화 로직(messages/context/phase/API 호출)은 전혀
// 건드리지 않는다 — 그건 지금 있는 그대로 재사용한다.
type AgentBubbleState = {
  isOpen: boolean
  reportProjectId: string | null
  seedMessage: string | null
  // 홈 화면 아이템 탐색 퀴즈(연령대/성별)에서 이미 답한 타겟 정보 — 있으면
  // Agent가 Phase 2에서 같은 질문을 또 하지 않고 바로 넘어간다.
  seedTargetCustomer: string | null
  // 사용자가 명시적으로 "이 리포트에 대해 대화하기"를 요청한 게 아니라,
  // 그냥 지금 화면에 그 리포트가 떠 있다는 사실만 기록하는 값. 리포트
  // 상세 페이지가 마운트/언마운트될 때만 갱신되고, 그 자체로는 버블을
  // 열거나 대화 모드를 바꾸지 않는다 — 실제 전환은 아래 두 지점에서만:
  // ① 버블이 이미 열려 있는 상태에서 이 값이 바뀌면 자동으로 리포트 모드
  //    전환, ② 버블이 닫혀 있을 때 토글 버튼을 누르면 이 값을 기본값으로
  //    사용해서 리포트 모드로 연다(FloatingAgentBubble.tsx에서 처리).
  activeReportProjectId: string | null
  open: () => void
  close: () => void
  openForReport: (projectId: string) => void
  openWithSeed: (text: string, targetCustomer?: string) => void
  setActiveReportProjectId: (projectId: string | null) => void
}

const AgentBubbleContext = createContext<AgentBubbleState | null>(null)

export function AgentBubbleProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportProjectId, setReportProjectId] = useState<string | null>(null)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const [seedTargetCustomer, setSeedTargetCustomer] = useState<string | null>(null)
  const [activeReportProjectId, setActiveReportProjectId] = useState<string | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const openForReport = useCallback((projectId: string) => {
    setReportProjectId(projectId)
    setSeedMessage(null)
    setIsOpen(true)
  }, [])
  const openWithSeed = useCallback((text: string, targetCustomer?: string) => {
    setReportProjectId(null)
    setSeedMessage(text)
    setSeedTargetCustomer(targetCustomer ?? null)
    setIsOpen(true)
  }, [])

  // 버블이 이미 열려 있는 상태에서 "보고 있는 리포트"가 바뀌면(다른
  // 리포트를 클릭) 대화도 그 리포트로 따라간다.
  useEffect(() => {
    if (isOpen && activeReportProjectId) {
      setReportProjectId(activeReportProjectId)
      setSeedMessage(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReportProjectId])

  return (
    <AgentBubbleContext.Provider
      value={{
        isOpen,
        reportProjectId,
        seedMessage,
        seedTargetCustomer,
        activeReportProjectId,
        open,
        close,
        openForReport,
        openWithSeed,
        setActiveReportProjectId,
      }}
    >
      {children}
    </AgentBubbleContext.Provider>
  )
}

export function useAgentBubble(): AgentBubbleState {
  const ctx = useContext(AgentBubbleContext)
  if (!ctx) throw new Error('useAgentBubble must be used within AgentBubbleProvider')
  return ctx
}
