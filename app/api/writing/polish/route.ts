import { callClaude } from '@/lib/ai/claude'
import { checkAndIncrementSuggestionCap } from '@/lib/ai/suggestionCap'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 등록 마법사의 장문 서술형 필드(문제/솔루션/대안 등)를 대충 적어도
// AI가 완성된 문장으로 다듬어주는 기능 — question_suggest와 동일하게
// project_id가 아직 없는 draft 단계라 유저+날짜 단위로 캡을 건다.
const DAILY_CAP = 20

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { fieldLabel, draftText, maxLength } = (await req.json()) as {
      fieldLabel?: string
      draftText?: string
      maxLength?: number
    }

    if (!draftText || !draftText.trim()) {
      return NextResponse.json({ error: '다듬을 내용을 먼저 입력해주세요' }, { status: 400 })
    }

    const date = new Date().toISOString().slice(0, 10)
    const allowed = await checkAndIncrementSuggestionCap(`writing_polish:${user.id}:${date}`, DAILY_CAP)
    if (!allowed) {
      return NextResponse.json({ error: '오늘 AI 다듬기 요청 횟수를 다 쓰셨어요' }, { status: 429 })
    }

    const limit = maxLength ?? 200
    const prompt = `당신은 FindFit의 창업 프로젝트 등록 문구를 다듬는 편집자입니다. 아래는 크리에이터가 대충 적은 초안입니다. 의미를 바꾸지 말고, 리뷰어가 읽고 바로 이해할 수 있도록 자연스러운 완성된 문장으로 다듬으세요.

[항목] ${fieldLabel ?? ''}
[초안] ${draftText}
[글자수 제한] 공백 포함 ${limit}자 이내

JSON으로만 응답하세요: {"polished": "다듬어진 문장(${limit}자 이내)"}`

    const result = await callClaude(prompt, 'haiku') as { polished?: string }
    const polished = (result?.polished ?? draftText).slice(0, limit)

    return NextResponse.json({ polished })
  } catch (err) {
    console.error('[writing/polish]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
