'use client'

import { createContext, useContext } from 'react'

export type RightTab = 'main' | 'lounge' | 'feed'

type RightPanelCtx = {
  tab: RightTab
  setTab: (t: RightTab) => void
  isExpanded: boolean // 패널이 확장되어 있는지 (대시보드가 접혀있는지)
}

const RightPanelContext = createContext<RightPanelCtx | null>(null)

export const RightPanelProvider = RightPanelContext.Provider

export function useRightPanel(): RightPanelCtx {
  const ctx = useContext(RightPanelContext)
  if (!ctx) {
    // 컨텍스트가 없는 경우 (단독 페이지) 기본값
    return { tab: 'main', setTab: () => {}, isExpanded: false }
  }
  return ctx
}
