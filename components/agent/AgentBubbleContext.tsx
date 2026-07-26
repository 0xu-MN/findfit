'use client'

import { createContext, useCallback, useContext, useState } from 'react'

// Agent 버블의 "열림/닫힘 + 어떤 모드인지"만 기억하는 얇은 UI 상태.
// AgentPanel 내부의 대화 로직(messages/context/phase/API 호출)은 전혀
// 건드리지 않는다 — 그건 지금 있는 그대로 재사용한다.
type AgentBubbleState = {
  isOpen: boolean
  reportProjectId: string | null
  seedMessage: string | null
  open: () => void
  close: () => void
  openForReport: (projectId: string) => void
  openWithSeed: (text: string) => void
}

const AgentBubbleContext = createContext<AgentBubbleState | null>(null)

export function AgentBubbleProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportProjectId, setReportProjectId] = useState<string | null>(null)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const openForReport = useCallback((projectId: string) => {
    setReportProjectId(projectId)
    setSeedMessage(null)
    setIsOpen(true)
  }, [])
  const openWithSeed = useCallback((text: string) => {
    setReportProjectId(null)
    setSeedMessage(text)
    setIsOpen(true)
  }, [])

  return (
    <AgentBubbleContext.Provider value={{ isOpen, reportProjectId, seedMessage, open, close, openForReport, openWithSeed }}>
      {children}
    </AgentBubbleContext.Provider>
  )
}

export function useAgentBubble(): AgentBubbleState {
  const ctx = useContext(AgentBubbleContext)
  if (!ctx) throw new Error('useAgentBubble must be used within AgentBubbleProvider')
  return ctx
}
