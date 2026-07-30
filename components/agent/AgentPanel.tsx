'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, FileText, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AgentMessageBubble, TypingIndicator } from './AgentComponents'
import { useAgentBubble } from './AgentBubbleContext'
import { createClient } from '@/lib/supabase/client'
import {
  getGreeting,
  generatePhaseResponse,
  createEmptyContext,
  applyUnderstanding,
  fallbackUnderstanding,
  type AgentMessage,
  type AgentContext,
} from './agentMock'

interface AgentPanelProps {
  isExpanded?: boolean
  // 플로팅 버블(AgentBubbleContext)에서 넘기는 값 — 있으면 URL 쿼리파라미터보다
  // 우선한다. 기존 ?reportProjectId=...  방식도 하위호환으로 계속 동작한다.
  reportProjectIdOverride?: string | null
  // 홈 화면 "아이템 탐색부터 시작" → 모달에서 입력한 첫 문장을 마운트 직후
  // 자동으로 보내기 위한 시드 메시지. 없으면 기존과 동일하게 인사말만 뜬다.
  initialSeedMessage?: string | null
  // 홈 화면 아이템 탐색 퀴즈(연령대/성별)에서 이미 답한 타겟 정보. 있으면
  // Phase 1→2에서 같은 질문("타겟이 누구예요?")을 또 하지 않고 바로 넘어간다.
  initialTargetCustomer?: string | null
  // 있으면 축소 모드 헤더 안에 닫기 버튼을 같이 그린다(플로팅 버블 전용) —
  // 카드 위에 별도로 떠 있던 닫기 버튼을 헤더 한 줄로 합치기 위함.
  onClose?: () => void
}

// 단계별 레이블: 인덱스 = phase (0~4)
const PHASE_LABELS = ['대화 시작', '아이디어 파악', '단계 파악', '타겟 파악', '검증 준비'] as const
// 축소/확장 모드 진행 dots 레이블
const DOT_LABELS = ['아이디어', '단계', '타겟', '완료'] as const

// 리포트 모드가 아닌 일반 대화(등록 전 아이템 탐색~등록 준비)를 새로고침
// 후에도 이어갈 수 있게 하는 저장 키 — 새로고침하면 대화가 통째로 사라지던
// 버그 수정. 새 아이템 탐색을 시작하면(진짜 새 seed) 이 값도 함께 리셋해서
// 이전 대화와 섞이지 않게 한다.
const ACTIVE_CONVO_KEY = 'findfit_agent_active_conversation'

type StoredConversation = { messages: AgentMessage[]; context: AgentContext }

function loadStoredConversation(): StoredConversation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_CONVO_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.messages) && parsed?.context) return parsed as StoredConversation
  } catch {
    // 손상된 값이면 그냥 무시하고 새 대화로 시작
  }
  return null
}

function clearStoredConversation() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_CONVO_KEY)
}

export default function AgentPanel({ isExpanded = false, reportProjectIdOverride, initialSeedMessage, initialTargetCustomer, onClose }: AgentPanelProps) {
  const router = useRouter()
  const agentBubble = useAgentBubble()
  const searchParams = useSearchParams()
  const isExploreMode = searchParams.get('agent') === 'explore'
  const fromNewProject = searchParams.get('from') === 'new_project'
  // 리포트 챗봇 → Agent 흡수(§21.3) — 리포트 페이지의 "Agent에게 물어보기"
  // 버튼으로 진입하면 이 프로젝트에 한해 대화 전체가 리포트 Q&A 모드로 전환된다.
  // 플로팅 버블은 페이지 이동 없이 이 값을 prop으로 바로 넘긴다(override 우선),
  // 기존 URL 쿼리파라미터 방식도 하위호환으로 계속 지원.
  const reportProjectId = reportProjectIdOverride ?? searchParams.get('reportProjectId')

  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [context, setContext] = useState<AgentContext>(() => ({
    ...createEmptyContext(),
    ...(initialTargetCustomer ? { targetCustomer: initialTargetCustomer } : {}),
  }))
  const [initialized, setInitialized] = useState(false)
  const [reportModeStatus, setReportModeStatus] = useState<'checking' | 'denied' | 'ready' | null>(
    reportProjectId ? 'checking' : null
  )

  // 자유 텍스트 이해(Claude) 비용 상한을 비로그인 방문자에게도 걸기 위한
  // 탭 단위 세션 id — 로그인돼 있으면 서버에서 user.id를 우선 쓴다.
  const sessionIdRef = useRef<string>('')
  if (!sessionIdRef.current) {
    sessionIdRef.current = `agent-sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const enterReportMode = useCallback((projectId: string) => {
    setReportModeStatus('checking')
    // 리포트 모드는 agent_conversation_logs(DB) 기준으로 다시 그려지므로
    // 일반 대화 저장분과 섞이면 안 된다.
    clearStoredConversation()
    // 결제 게이트 유지 — 심층 리포트 구매자(captured 또는 테스트 기간
    // waived_test)만 리포트 모드 진입 가능. ENABLE_PAYMENT_GATE=false인
    // 지금은 등록 시 자동으로 waived_test가 기록되므로 사실상 전원 통과.
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setReportModeStatus('denied'); return }
      const { data } = await supabase
        .from('payments')
        .select('status')
        .eq('project_id', projectId)
        .eq('sku_type', 'deep_report')
        .in('status', ['captured', 'waived_test'])
        .limit(1)
      if (data && data.length > 0) {
        setReportModeStatus('ready')
        // 이 프로젝트를 등록할 때 Agent와 나눈 대화가 저장돼 있으면(등록
        // 전 대화 → CTA → 등록 시점에 agent_conversation_logs로 이관됨)
        // 새 인사말로 지우지 않고 그 대화를 이어서 보여준다 — 없으면
        // 기존처럼 리포트 전용 인사말만 단독으로 보여준다.
        const { data: log } = await supabase
          .from('agent_conversation_logs')
          .select('messages')
          .eq('project_id', projectId)
          .maybeSingle()

        const reportGreeting: AgentMessage = {
          id: `report-mode-greeting-${projectId}`,
          role: 'assistant',
          content: log?.messages
            ? '이 프로젝트를 등록할 때 나눈 대화예요. 이어서 리포트에 대해 궁금한 점을 물어보세요. 검증 결과를 바탕으로 다음 프로젝트도 함께 정해볼 수 있어요 📊'
            : '이 프로젝트 리포트에 대해 궁금한 점을 물어보세요. 검증 결과를 바탕으로 다음 프로젝트도 함께 정해볼 수 있어요 📊',
          timestamp: new Date().toISOString(),
        }

        const restoredMessages = Array.isArray(log?.messages) ? (log.messages as AgentMessage[]) : []
        setTimeout(() => setMessages([...restoredMessages, reportGreeting]), 400)
      } else {
        setReportModeStatus('denied')
        setMessages([{
          id: `report-mode-denied-${projectId}`,
          role: 'assistant',
          content: '이 리포트의 심층 분석을 먼저 열람해야 Agent에게 물어볼 수 있어요. 리포트 페이지에서 먼저 열람해주세요.',
          timestamp: new Date().toISOString(),
        }])
      }
    })
  }, [])

  useEffect(() => {
    if (initialized) return
    setInitialized(true)

    if (reportProjectId) {
      enterReportMode(reportProjectId)
      return
    }

    // 새로고침 후 다시 열렸을 때, 저장해둔 일반 대화가 있고 지금 새로
    // 보낼 seed 메시지가 없으면(즉 진짜 새 아이템 탐색이 아니면) 그 대화를
    // 그대로 복원한다 — 여기서 복원 안 하면 새로고침마다 대화가 통째로
    // 사라지던 버그가 그대로 남는다.
    const stored = !initialSeedMessage ? loadStoredConversation() : null
    if (stored) {
      setMessages(stored.messages)
      setContext(stored.context)
      return
    }

    const greeting = getGreeting(isExploreMode && fromNewProject)
    setTimeout(() => setMessages([greeting]), 500)
  }, [initialized, isExploreMode, fromNewProject, reportProjectId, enterReportMode, initialSeedMessage])

  // 일반 대화(리포트 모드 아님) 상태는 바뀔 때마다 저장 — 새로고침해도
  // 이어갈 수 있게 한다. 리포트 모드는 항상 DB(agent_conversation_logs)
  // 기준으로 다시 불러오므로 여기서 저장하지 않는다.
  useEffect(() => {
    if (reportProjectId || !initialized) return
    if (messages.length === 0) return
    try {
      localStorage.setItem(ACTIVE_CONVO_KEY, JSON.stringify({ messages, context }))
    } catch {
      // 저장 실패해도 대화 자체는 계속 진행 — 새로고침 복원만 못 할 뿐
    }
  }, [messages, context, reportProjectId, initialized])

  // 플로팅 버블은 언마운트 없이 계속 살아있으므로, 이미 초기화된 뒤에
  // reportProjectIdOverride가 새로 들어오면(리포트 상세에서 "Agent에게
  // 물어보기" 클릭) 그때도 리포트 모드로 전환해야 한다. URL 쿼리파라미터
  // 방식(페이지당 1회 마운트)은 위 초기화 effect만으로 충분해 영향 없음.
  const prevOverrideRef = useRef<string | null>(null)
  useEffect(() => {
    if (!initialized) return
    if (reportProjectIdOverride && reportProjectIdOverride !== prevOverrideRef.current) {
      prevOverrideRef.current = reportProjectIdOverride
      enterReportMode(reportProjectIdOverride)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportProjectIdOverride, initialized])

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
      // 리포트 모드 — 기존 /api/ai-report/[projectId]/chat(stateless, haiku,
      // 일일 캡)을 그대로 재사용. 다른 phase 로직은 전혀 타지 않는다.
      if (reportProjectId) {
        try {
          const res = await fetch(`/api/ai-report/${reportProjectId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: value }),
          })
          const body = await res.json()
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: body.answer ?? body.error ?? '답변을 가져오지 못했어요.',
            timestamp: new Date().toISOString(),
          }])
        } catch {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: '답변을 가져오지 못했어요.',
            timestamp: new Date().toISOString(),
          }])
        } finally {
          setIsTyping(false)
        }
        return
      }

      // FindFit Agent 자유 텍스트 이해 — 토스트 버튼 클릭이 아니면 모든
      // phase에서 Claude로 라우팅한다(2026-07 확장: 예전엔 phase 0/1만
      // Claude를 탔고 그 이후는 무조건 규칙기반 고정 문구였음). 토스트
      // 버튼 흐름(구조화된 값)은 지금처럼 규칙기반(generatePhaseResponse)
      // 그대로 — 여기서 건드리지 않는다. Claude 실패/캡초과 시엔 기존
      // generatePhaseResponse(원래 엔진)가 안전망으로 동작 — 회귀 없음.
      if (!isToastSelection) {
        // Phase 2, 또는 등록 CTA 직전 추천 질문 칩("트렌드 좀 더 자세히
        // 알려줘" 등)을 눌러 자유 텍스트로 다시 물어보는 경우에도 실제
        // 트렌드 데이터가 필요하다 — phase>=1에서 카테고리가 이미 파악돼
        // 있으면 매번 새로 가져와서 Claude가 실제 데이터로 답하게 한다.
        let realTrendLine: string | undefined
        if (context.phase >= 1 && (context.category || context.targetCustomer)) {
          try {
            const trendRes = await fetch('/api/agent/trend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category: context.category ?? 'default' }),
            })
            if (trendRes.ok) realTrendLine = (await trendRes.json()).line
          } catch {
            // 실패해도 프롬프트에서 trendLine 없이 진행
          }
        }

        try {
          const recentMessages = messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          }))
          const res = await fetch('/api/agent/understand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInput: value,
              context: {
                ideaSummary: context.ideaSummary,
                category: context.category,
                stage: context.stage,
                targetCustomer: context.targetCustomer,
                phase: context.phase,
                trendLine: realTrendLine,
                recentMessages,
                wizardStep: agentBubble.activeWizardStep,
              },
              sessionId: sessionIdRef.current,
            }),
          })
          const body = await res.json()

          if (!res.ok || body.fallback) {
            const { message, updatedContext } = context.phase <= 1
              ? fallbackUnderstanding(context)
              : generatePhaseResponse(value, context, isToastSelection, realTrendLine)
            setMessages(prev => [...prev, message])
            setContext(updatedContext)
          } else if (body.capped) {
            setMessages(prev => [...prev, {
              id: `msg-cap-${Date.now()}`,
              role: 'assistant',
              content: body.reply,
              timestamp: new Date().toISOString(),
              showCTA: true,
            }])
          } else {
            const { message, updatedContext } = applyUnderstanding(context, body, value)
            setMessages(prev => [...prev, message])
            setContext(updatedContext)
          }
        } catch {
          const { message, updatedContext } = context.phase <= 1
            ? fallbackUnderstanding(context)
            : generatePhaseResponse(value, context, isToastSelection, realTrendLine)
          setMessages(prev => [...prev, message])
          setContext(updatedContext)
        } finally {
          setIsTyping(false)
        }
        return
      }

      // ── 토스트 버튼 흐름 — 기존 규칙기반 그대로 ──
      // Phase 2 → 3 전환에서만 실제 트렌드 데이터가 필요하다 (기획서 5.3
      // Phase 2 "실시간 데이터 수집"). 이 요청 하나만 fetch로 보내고 나머지
      // phase는 그대로 동기 로직.
      let realTrendLine: string | undefined
      if (context.phase === 2 || (context.phase === 1 && !!context.targetCustomer)) {
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
    // agentBubble.activeWizardStep이 deps에 없으면, 이 콜백이 다른 이유로
    // 메모이즈된 채 그대로 재사용될 때 등록 마법사가 이미 다른 단계로
    // 넘어가 있어도(또는 wizardStep이 막 채워졌어도) 예전 값(널 포함)을
    // 계속 들고 있는 stale closure가 될 수 있었다 — 실제로 "지금 등록
    // 중인 프로젝트 내용을 왜 모르냐"는 문제의 원인이었다.
  }, [isTyping, context, messages, reportProjectId, agentBubble.activeWizardStep])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    processInput(trimmed, false)
    // textarea가 여러 줄로 늘어나 있었을 수 있으니 전송 후 원래 높이로 복원
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }, [input, processInput])

  // 한 줄 입력창이던 <input>을 여러 줄 <textarea>로 바꾸면서, 입력한 만큼
  // 자연스럽게 높이가 늘어나도록(최대 높이는 className의 max-h로 제한) —
  // 예전엔 텍스트가 길어지면 옆으로만 계속 길어지고 안 보였다.
  const autoResizeInput = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // 홈 화면에서 "아이템 탐색부터 시작"으로 들어올 때, 이미 입력해둔 첫
  // 문장을 인사말 뜬 직후 자동으로 한 번만 보낸다.
  //
  // ⚠️ 버그였던 부분: FloatingAgentBubble의 AgentPanel은 크리에이터 화면
  // 진입 시 곧바로(사용자가 아직 아무것도 안 골랐을 때) 마운트되므로,
  // 그 시점엔 initialTargetCustomer가 항상 null이다. 그런데 context는
  // useState(() => ...) 초기값으로만 한 번 설정돼서, 이후 사용자가 실제로
  // 아이템 탐색 퀴즈를 마치고 openWithSeed(text, targetCustomer)를 호출해도
  // 이미 마운트가 끝난 뒤라 context.targetCustomer가 절대 갱신되지 않았다.
  // 게다가 seedSentRef가 "한 번이라도 보냈으면 true"로 영구 고정되는
  // boolean이라, 세션 중 두 번째 이후의 시드 메시지는 아예 무시됐다(값
  // 자체를 비교하는 게 아니라 존재 여부만 봤기 때문).
  //
  // 수정: seedSentRef에 "마지막으로 보낸 시드 문자열"을 저장해서 진짜 새
  // 시드가 왔을 때만 재전송하고, 그 시점에 targetCustomer도 context에
  // 반영한다.
  const lastSentSeedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!initialSeedMessage || !initialized || reportProjectId) return
    if (lastSentSeedRef.current === initialSeedMessage) return
    lastSentSeedRef.current = initialSeedMessage
    // 진짜 새 아이템 탐색이 시작된 것 — 이전 대화가 그대로 남아있으면
    // 새 seed가 옛 대화 뒤에 이어붙어서 서로 다른 아이템 탐색 대화가
    // 섞여 보이던 버그가 있었다. 새 seed가 올 때는 대화 자체를 새로
    // 시작한다(이전 대화 저장분도 함께 비운다).
    clearStoredConversation()
    setMessages([])
    setContext({
      ...createEmptyContext(),
      ...(initialTargetCustomer ? { targetCustomer: initialTargetCustomer } : {}),
    })
    const t = setTimeout(() => processInput(initialSeedMessage, false), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeedMessage, initialTargetCustomer, initialized, reportProjectId])

  const handleToastSelect = useCallback((value: string | string[]) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value
    processInput(displayValue, true)
  }, [processInput])

  const handleCTA = useCallback(() => {
    const sessionId = `agent-${Date.now()}`
    // 대화에서 파악한 카테고리·단계·타겟을 wizard로 전달
    sessionStorage.setItem(`agent_context_${sessionId}`, JSON.stringify(context))
    // 대화 전문도 함께 넘겨둔다 — 등록이 성공하면 submitProject가 이걸
    // 프로젝트에 연결해 저장해서, 나중에 리포트 모드에서 같은 대화를
    // 이어갈 수 있게 한다.
    sessionStorage.setItem(`agent_messages_${sessionId}`, JSON.stringify(messages))
    // ACTIVE_CONVO_KEY(localStorage)는 여기서 지우지 않는다 — 등록 마법사로
    // 넘어간 뒤 임시저장하고 새로고침해도 같은 대화가 이어지게 하려면
    // (버그 리포트 #4) 최종 제출 전까지는 계속 남아있어야 한다.
    router.push(`/builder/new-request?agentSession=${sessionId}`)
  }, [context, messages, router])

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
        {/* 헤더 — 아바타 + 타이틀/상태 + 닫기 버튼을 한 줄에 */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F77019, #FF8F45)', boxShadow: '0 4px 12px rgba(247,112,25,0.25)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-black text-[#1D1C1C]">FindFit Agent</span>
              {reportProjectId ? (
                <span className="text-[8px] font-black text-[#1565C0] bg-[#1565C0]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">리포트 모드</span>
              ) : (
                <span className="text-[8px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[9px] font-bold text-[#999]">온라인</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#666] hover:text-[#1D1C1C] hover:bg-[#EAEAEA] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 탐색 현황 (축소 모드 인라인) — 리포트 모드에선 phase/카테고리
            추적이 의미 없으므로 대신 "리포트 모드" 안내만 보여준다 */}
        <div className="flex-shrink-0 px-4 pb-2">
          {reportProjectId ? (
            <div className="rounded-2xl border border-[#1565C0]/15 bg-[#1565C0]/5 px-3 py-2.5 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#1565C0] shrink-0" />
              <span className="text-[10px] font-bold text-[#1565C0]">이 프로젝트의 리포트 데이터를 바탕으로 답하고 있어요</span>
            </div>
          ) : (
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
          )}
        </div>

        {/* 메시지 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-3 custom-scrollbar">
          {messages.map((msg) => (
            <AgentMessageBubble
              key={msg.id}
              message={msg}
              onCTAClick={handleCTA}
              onToastSelect={handleToastSelect}
              onSuggestedClick={(q) => processInput(q, false)}
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
            <Sparkles className="w-3.5 h-3.5 text-[#F77019] flex-shrink-0 mt-1" />
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoResizeInput(e.target) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder={reportProjectId ? '이 리포트에 대해 궁금한 점을 물어보세요' : '아이디어를 자유롭게 말씀해주세요'}
              className="flex-1 bg-transparent text-[12px] font-medium text-[#1D1C1C] placeholder-[#BBB] outline-none min-w-0 resize-none leading-relaxed py-1 max-h-24 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || reportModeStatus === 'denied' || reportModeStatus === 'checking'}
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
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[18px] font-black text-[#1D1C1C]">FindFit Agent</h2>
              {reportProjectId ? (
                <span className="text-[9px] font-black text-[#1565C0] bg-[#1565C0]/10 px-2 py-0.5 rounded-full uppercase tracking-wide">리포트 모드</span>
              ) : (
                <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
              )}
            </div>
            <p className="text-[11px] font-bold text-[#999]">
              {reportProjectId ? '리포트 결과를 바탕으로 다음 프로젝트를 함께 정해봐요' : '아이디어 이해 · 시장 맥락 파악 · 검증 등록 안내'}
            </p>
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
                onSuggestedClick={(q) => processInput(q, false)}
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
              <Sparkles className="w-4 h-4 text-[#F77019] flex-shrink-0 mt-1.5" />
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => { setInput(e.target.value); autoResizeInput(e.target) }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder={reportProjectId ? '이 리포트에 대해 궁금한 점을 물어보세요' : '예) 20대 여성을 위한 단백질 쉐이크 구독 서비스를 만들려고 해요'}
                className="flex-1 bg-transparent text-[13px] font-medium text-[#1D1C1C] placeholder-[#C0C0C0] outline-none min-w-0 resize-none leading-relaxed py-1.5 max-h-28 overflow-y-auto"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || reportModeStatus === 'denied' || reportModeStatus === 'checking'}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                style={{ background: input.trim() ? '#F77019' : '#1D1C1C' }}
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 우측: 탐색 현황 패널 — 리포트 모드에선 phase 추적이 의미 없으므로
            안내 카드로 대체 */}
        <div className="w-[240px] flex-shrink-0 overflow-y-auto px-4 pb-4 border-l border-[#1D1C1C]/5 flex flex-col gap-3 custom-scrollbar">
          {reportProjectId ? (
            <div className="pt-2 flex flex-col gap-3">
              <span className="text-[11px] font-black text-[#1D1C1C]">리포트 모드</span>
              <div className="rounded-xl border border-[#1565C0]/20 bg-[#1565C0]/5 p-3 flex flex-col gap-1.5">
                <FileText className="w-4 h-4 text-[#1565C0]" />
                <p className="text-[10px] font-bold text-[#1565C0] leading-relaxed">
                  이 프로젝트의 AI 리포트 데이터를 참고해 답하고 있어요. 검증 결과를 바탕으로 다음 프로젝트도 함께 준비해봐요.
                </p>
              </div>
            </div>
          ) : (
          <>
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
          </>
          )}
        </div>
      </div>
    </div>
  )
}
