import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { checkAndIncrementSuggestionCap } from '@/lib/ai/suggestionCap'
import { createClient } from '@/lib/supabase/server'
import { buildInterestSuggestionPrompt, type InterestSuggestProject } from '@/lib/ai/prompt'

// 등록 마법사 초안(draft) 단계라 project_id가 없다 — 유저+날짜 단위 캡.
const DRAFT_SUGGESTION_DAILY_CAP = 10

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { project, existing } = (await req.json()) as {
      project?: InterestSuggestProject
      existing?: string[]
    }
    if (!project) return NextResponse.json({ suggestions: [] })

    const date = new Date().toISOString().slice(0, 10)
    const allowed = await checkAndIncrementSuggestionCap(
      `interest_suggest:draft:${user.id}:${date}`,
      DRAFT_SUGGESTION_DAILY_CAP
    )
    if (!allowed) {
      return NextResponse.json({ error: '오늘 AI 추천 요청 횟수를 다 쓰셨어요' }, { status: 429 })
    }

    const prompt = buildInterestSuggestionPrompt(project, existing ?? [])
    // haiku 등급 — 자동추천처럼 빠른 응답이 중요한 가벼운 작업
    const raw = await callClaude(prompt, 'haiku')
    const suggestions = Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : []

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[interests/suggest]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
