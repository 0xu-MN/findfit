'use client'

import { Suspense } from 'react'
import AgentPanel from '../agent/AgentPanel'
import { useRightPanel } from './RightPanelContext'

export default function SharedMainPanel() {
  const { isExpanded } = useRightPanel()

  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#F77019] border-t-transparent animate-spin" />
      </div>
    }>
      <AgentPanel isExpanded={isExpanded} />
    </Suspense>
  )
}
