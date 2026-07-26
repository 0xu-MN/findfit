import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'
import { buildAgentUnderstandingPrompt, type AgentConversationContext } from '@/lib/ai/prompt'
import { checkAndIncrementSuggestionCap } from '@/lib/ai/suggestionCap'

const DAILY_CAP = 20

// FindFit Agent Phase 1(자유 텍스트 이해) 전용 — 토스트 버튼 흐름/Phase 2~4는
// 건드리지 않고, 사용자가 자유 텍스트를 입력했을 때만 AgentPanel이 이 라우트를
// 호출한다. 이 화면은 첫 진입 화면이라 여기서 절대 에러 화면이 뜨면 안 되므로,
// 캡 초과·Claude 실패(크레딧 부족 등) 모두 조용한 폴백으로 200을 반환한다.
export async function POST(req: Request) {
  try {
    const { userInput, context, sessionId } = (await req.json()) as {
      userInput?: string
      context?: AgentConversationContext
      sessionId?: string
    }
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ fallback: true })
    }

    // 로그인 여부와 무관하게 캡을 걸어야 한다(비로그인 방문자도 이 화면으로
    // 유입되므로) — 로그인돼 있으면 user.id, 아니면 클라이언트가 만든
    // 세션 단위 id로 카운트.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const subject = user?.id ?? sessionId ?? 'anonymous'
    const date = new Date().toISOString().slice(0, 10)

    const allowed = await checkAndIncrementSuggestionCap(`agent_understand:${subject}:${date}`, DAILY_CAP)
    if (!allowed) {
      return NextResponse.json({
        capped: true,
        reply: '오늘 대화를 많이 나눴어요, 내일 다시 이어가요 🙌',
      })
    }

    try {
      // 지난 프로젝트 종료 요약(최근 2건) — 로그인된 크리에이터에게만 해당,
      // 원본 대화 로그는 저장하지 않으므로 이 요약이 유일한 참고자료다.
      let pastSummaries: string[] | undefined
      if (user) {
        const { data: summaries } = await supabase
          .from('project_summaries')
          .select('summary_text')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)
        pastSummaries = (summaries ?? []).map((s) => s.summary_text)
      }

      const prompt = buildAgentUnderstandingPrompt(userInput, { ...context, pastSummaries })
      const result = (await callClaude(prompt, 'haiku')) as {
        reply?: string
        category?: string | null
        stage?: string | null
        item_summary?: string | null
        target_customer?: string | null
        ready_for_cta?: boolean
      }
      if (!result.reply) return NextResponse.json({ fallback: true })

      return NextResponse.json({
        reply: result.reply,
        category: result.category ?? null,
        stage: result.stage ?? null,
        item_summary: result.item_summary ?? null,
        target_customer: result.target_customer ?? null,
        ready_for_cta: Boolean(result.ready_for_cta),
      })
    } catch (err) {
      // Claude 호출 실패(크레딧 부족/네트워크 오류 등) — 에러를 사용자에게
      // 노출하지 않고 클라이언트가 기존 규칙기반 제네릭 응답으로 조용히
      // 대체하도록 신호만 준다.
      console.error('[agent/understand] callClaude failed', err)
      return NextResponse.json({ fallback: true })
    }
  } catch (err) {
    console.error('[agent/understand]', err)
    return NextResponse.json({ fallback: true })
  }
}
