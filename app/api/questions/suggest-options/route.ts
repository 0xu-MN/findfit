import { callClaude } from '@/lib/ai/claude'
import { checkAndIncrementSuggestionCap } from '@/lib/ai/suggestionCap'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 객관식/키워드 질문을 적는 동안 "다음에 올 선지"를 코드 자동완성처럼
// 희미하게 미리 보여주는 기능(QuestionBuilder.tsx의 placeholder 고스트
// 텍스트)의 백엔드. question_suggest와 동일한 draft 단계 캡 재사용.
const DAILY_CAP = 30

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { questionText, questionType, optionCount } = (await req.json()) as {
      questionText?: string
      questionType?: string
      optionCount?: number
    }
    if (!questionText || !questionText.trim()) {
      return NextResponse.json({ options: [] })
    }

    const date = new Date().toISOString().slice(0, 10)
    const allowed = await checkAndIncrementSuggestionCap(`option_suggest:${user.id}:${date}`, DAILY_CAP)
    if (!allowed) {
      return NextResponse.json({ options: [], error: '오늘 요청 횟수를 다 쓰셨어요' }, { status: 429 })
    }

    const count = Math.min(Math.max(optionCount ?? 4, 2), 6)
    const prompt = `당신은 FindFit의 설문 문항 설계를 돕는 어시스턴트입니다. 아래 질문에 어울리는 답변 선지 후보를 만드세요.

[질문] ${questionText}
[유형] ${questionType ?? 'multiple_choice'}
[개수] ${count}개

JSON으로만 응답: {"options": ["선지1", "선지2", ...]} (각 선지는 12자 이내, 서로 겹치지 않게)`

    const result = await callClaude(prompt, 'haiku') as { options?: string[] }
    return NextResponse.json({ options: (result?.options ?? []).slice(0, count) })
  } catch (err) {
    console.error('[questions/suggest-options]', err)
    return NextResponse.json({ options: [] })
  }
}
