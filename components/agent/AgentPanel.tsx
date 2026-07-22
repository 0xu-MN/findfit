'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, Bot } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AgentMessageBubble, TypingIndicator } from './AgentComponents'
import {
  getGreeting,
  generatePhaseResponse,
  createEmptyContext,
  type AgentMessage,
  type AgentContext,
} from './agentMock'

interface AgentPanelProps {
  isExpanded?: boolean
}

// 단계별 레이블: 인덱스 = phase (0~4)
const PHASE_LABELS = ['대화 시작', '아이디어 파악', '단계 파악', '타겟 파악', '검증 준비'] as const
// 축소/확장 모드 진행 dots 레이블
const DOT_LABELS = ['아이디어', '단계', '타겟', '완료'] as const

export default function AgentPanel({ isExpanded = false }: AgentPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isExploreMode = searchParams.get('agent') === 'explore'
  const fromNewProject = searchParams.get('from') === 'new_project'

  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [context, setContext] = useState<AgentContext>(createEmptyContext())
  const [initialized, setInitialized] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialized) return
    setInitialized(true)
    const greeting = getGreeting(isExploreMode && fromNewProject)
    setTimeout(() => setMessages([greeting]), 500)
  }, [initialized, isExploreMode, fromNewProject])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const processInput = useCallback((value: string, isToastSelection: boolean) => {
    if (isTyping) return

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: value,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const delay = 700 + Math.random() * 600
    setTimeout(async () => {
      // Phase 2 → 3 전환에서만 실제 트렌드 데이터가 필요하다 (기획서 5.3
      // Phase 2 "실시간 데이터 수집"). 이 요청 하나만 fetch로 보내고 나머지
      // phase는 그대로 동기 로직.
      let realTrendLine: string | undefined
      if (context.phase === 2) {
        try {
          const res = await fetch('/api/agent/trend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: context.category ?? 'default' }),
          })
          if (res.ok) realTrendLine = (await res.json()).line
        } catch {
          // 실패해도 generatePhaseResponse가 정적 문구로 대체
        }
      }

      const { message, updatedContext } = generatePhaseResponse(value, context, isToastSelection, realTrendLine)
      setMessages(prev => [...prev, message])
      setContext(updatedContext)
      setIsTyping(false)
    }, delay)
  }, [isTyping, context])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    processInput(trimmed, false)
  }, [input, processInput])

  const handleToastSelect = useCallback((value: string | string[]) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value
    processInput(displayValue, true)
  }, [processInput])

  const handleCTA = useCallback(() => {
    const sessionId = `agent-${Date.now()}`
    // 대화에서 파악한 카테고리·단계·타겟을 wizard로 전달
    sessionStorage.setItem(`agent_context_${sessionId}`, JSON.stringify(context))
    router.push(`/builder/new-request?agentSession=${sessionId}`)
  }, [context, router])

  const lastAssistantIndex = [...messages].reverse().findIndex(m => m.role === 'assistant')
  const latestAssistantId = lastAssistantIndex >= 0
    ? messages[messages.length - 1 - lastAssistantIndex]?.id
    : null

  const phaseLabel = PHASE_LABELS[context.phase] ?? '탐색 중'
  const phasePct = Math.round((context.phase / 4) * 100)

  // ─── 축소 모드 ───
  if (!isExpanded) {
    const hasContext = context.phase > 0 || !!context.ideaSummary

    return (
      <div className="w-full h-full flex flex-col select-none overflow-hidden">
        {/* 헤더 */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)', boxShadow: '0 4px 12px rgba(247,112,25,0.25)' }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-black text-[#1D1C1C]">FindFit Agent</span>
              <span className="text-[8px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[9px] font-bold text-[#999]">온라인</span>
            </div>
          </div>
        </div>

        {/* 탐색 현황 (축소 모드 인라인) */}
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="rounded-2xl border border-[#F77019]/15 bg-[#F77019]/5 px-3 py-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-[#F77019] uppercase tracking-wide">탐색 현황</span>
              <span className="text-[9px] font-bold text-[#999]">{phaseLabel}</span>
            </div>

            <div className="w-full h-1 bg-[#F77019]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F77019] rounded-full transition-all duration-500"
                style={{ width: `${phasePct}%` }}
              />
            </div>

            {/* 단계 dots */}
            <div className="flex items-center gap-0.5">
              {DOT_LABELS.map((label, i) => {
                const done = context.phase > i + 1
                const active = context.phase === i + 1
                return (
                  <div key={label} className="flex items-center gap-0.5 flex-1">
                    <span className={`text-[8px] font-bold transition-colors ${
                      done || active ? 'text-[#F77019]' : 'text-[#CCC]'
                    }`}>
                      {label}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-0.5 ${
                      done ? 'bg-[#F77019]' : active ? 'bg-[#F77019] scale-110' : 'bg-[#E0E0E0]'
                    }`} />
                    {i < 3 && <span className="flex-1 h-px bg-[#E0E0E0] mx-0.5" />}
                  </div>
                )
              })}
            </div>

            {/* 아이디어 요약 + 카테고리 */}
            {hasContext && (
              <div className="flex items-start gap-2 pt-1 border-t border-[#F77019]/10">
                {context.category && (
                  <span className="text-[9px] font-black bg-[#F77019]/15 text-[#F77019] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {context.category}
                  </span>
                )}
                {context.ideaSummary && (
                  <span className="text-[9px] font-bold text-[#666] leading-relaxed line-clamp-2 flex-1">
                    {context.ideaSummary}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-3 custom-scrollbar">
          {messages.map((msg) => (
            <AgentMessageBubble
              key={msg.id}
              message={msg}
              onCTAClick={handleCTA}
              onToastSelect={handleToastSelect}
              isLatest={msg.id === latestAssistantId}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* 입력 영역 */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition-all focus-within:shadow-[0_0_0_2px_rgba(247,112,25,0.18)]"
            style={{ background: '#FFFFFF', border: '1.5px solid rgba(29,28,28,0.1)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F77019] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="아이디어를 자유롭게 말씀해주세요"
              className="flex-1 bg-transparent text-[12px] font-medium text-[#1D1C1C] placeholder-[#BBB] outline-none min-w-0"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: input.trim() ? '#F77019' : '#DDD' }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 확장 모드 ───
  return (
    <div className="w-full h-full flex flex-col select-none overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)', boxShadow: '0 6px 16px rgba(247,112,25,0.25)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[18px] font-black text-[#1D1C1C]">FindFit Agent</h2>
              <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
            </div>
            <p className="text-[11px] font-bold text-[#999]">아이디어 이해 · 시장 맥락 파악 · 검증 등록 안내</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[10px] font-bold text-[#999]">AI 응답 가능</span>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* 대화 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-3 custom-scrollbar">
            {messages.map((msg) => (
              <AgentMessageBubble
                key={msg.id}
                message={msg}
                onCTAClick={handleCTA}
                onToastSelect={handleToastSelect}
                isLatest={msg.id === latestAssistantId}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </div>

          {/* 입력 영역 */}
          <div className="flex-shrink-0 px-6 pb-5">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all focus-within:shadow-[0_0_0_2px_rgba(247,112,25,0.15)]"
              style={{ background: '#FFFFFF', border: '2px solid #1D1C1C' }}
            >
              <Sparkles className="w-4 h-4 text-[#F77019] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="예) 20대 여성을 위한 단백질 쉐이크 구독 서비스를 만들려고 해요"
                className="flex-1 bg-transparent text-[13px] font-medium text-[#1D1C1C] placeholder-[#C0C0C0] outline-none min-w-0"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                style={{ background: input.trim() ? '#F77019' : '#1D1C1C' }}
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 우측: 탐색 현황 패널 */}
        <div className="w-[240px] flex-shrink-0 overflow-y-auto px-4 pb-4 border-l border-[#1D1C1C]/5 flex flex-col gap-3 custom-scrollbar">
          <div className="pt-2">
            <span className="text-[11px] font-black text-[#1D1C1C]">탐색 현황</span>
          </div>

          {/* 단계 진행 */}
          <div className="rounded-xl border border-[#F77019]/20 bg-[#F77019]/5 p-3 flex flex-col gap-2">
            <span className="text-[9px] font-bold text-[#F77019]">진행 단계</span>
            <div className="flex items-center gap-1.5">
              {DOT_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full transition-all ${
                    context.phase > i + 1
                      ? 'bg-[#F77019]'
                      : context.phase === i + 1
                      ? 'bg-[#F77019] scale-125'
                      : 'bg-[#DDD]'
                  }`} />
                  {i < 3 && <span className="w-3 h-px bg-[#DDD]" />}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black text-[#F77019]">{phaseLabel}</span>
          </div>

          {/* 아이디어 */}
          <div className="rounded-xl border border-[#1D1C1C]/8 bg-white p-3 flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-[#999]">아이디어</span>
            <span className="text-[11px] font-bold text-[#1D1C1C] leading-relaxed">
              {context.ideaSummary ?? '대화로 파악 중...'}
            </span>
          </div>

          {/* 감지된 분야 */}
          {context.category && (
            <div className="rounded-xl border border-[#1D1C1C]/8 bg-white p-3 flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-[#999]">분야</span>
              <span className="text-[13px] font-black text-[#1D1C1C]">{context.category}</span>
            </div>
          )}

          {/* 단계 */}
          {context.stage && (
            <div className="rounded-xl border border-[#1D1C1C]/8 bg-white p-3 flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-[#999]">현재 단계</span>
              <span className="text-[11px] font-bold text-[#1D1C1C]">{context.stage}</span>
              {context.psf !== undefined && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full self-start"
                  style={{ background: context.psf ? '#1565C010' : '#F7701910', color: context.psf ? '#1565C0' : '#F77019' }}>
                  {context.psf ? 'PSF 검증' : 'PMF 검증'}
                </span>
              )}
            </div>
          )}

          {/* 타겟 고객 */}
          {context.targetCustomer && (
            <div className="rounded-xl border border-[#1D1C1C]/8 bg-white p-3 flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-[#999]">타겟 고객</span>
              <span className="text-[11px] font-bold text-[#1D1C1C] leading-relaxed">{context.targetCustomer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
