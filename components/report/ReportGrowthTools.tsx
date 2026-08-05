'use client'

import { useRouter } from 'next/navigation'
import { Bot } from 'lucide-react'
import { useAgentBubble } from '@/components/agent/AgentBubbleContext'

export default function ReportGrowthTools({ projectId }: { projectId: string }) {
  const router = useRouter()
  const agentBubble = useAgentBubble()

  return (
    <div className="flex flex-col gap-4">
      {/* 리포트 챗봇 → Agent 흡수(§21.3) — 독립 채팅 UI 대신 FindFit Agent의
          "리포트 모드"로 진입. 백엔드(stateless, haiku, 일일 캡)는 그대로
          /api/ai-report/[projectId]/chat을 재사용한다. */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col items-center gap-3 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)' }}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-black text-[#1D1C1C]">이 리포트에 대해 더 물어보고 싶으신가요?</p>
        <p className="text-[11px] font-bold text-[#999]">FindFit Agent가 데이터를 바탕으로 답하고, 다음 프로젝트도 함께 준비해드려요.</p>
        <button
          onClick={() => agentBubble.openForReport(projectId)}
          className="mt-1 px-5 py-2.5 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] transition-colors"
        >
          Agent에게 물어보기
        </button>
      </div>

      {/* 재의뢰 CTA */}
      <div className="rounded-3xl bg-gradient-to-br from-[#F77019] to-[#ff9240] text-white p-6 flex flex-col gap-3">
        <span className="text-[10px] font-black opacity-80 uppercase tracking-wider">데이터 기반 제안</span>
        <p className="text-base font-black leading-snug">더 나은 표본으로<br />재검증해보세요</p>
        <p className="text-[11px] font-bold opacity-85 leading-relaxed">
          외부 관심 데이터가 쌓이고 있어요. 관심이 있다면 더 큰 표본으로 확장 검증할 때예요.
        </p>
        <button
          onClick={() => router.push('/builder/new-request')}
          className="self-start mt-1 px-4 py-2 rounded-xl bg-white text-[#F77019] text-[11px] font-black hover:opacity-90 transition-colors"
        >
          새 프로젝트로 재의뢰하기
        </button>
      </div>
    </div>
  )
}


