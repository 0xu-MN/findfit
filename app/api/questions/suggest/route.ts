import { generateQuestionSuggestions } from '@/lib/ai/index'
import { checkAndIncrementSuggestionCap } from '@/lib/ai/suggestionCap'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 등록 마법사 초안(draft) 단계라 아직 project_id가 없다 — 유저+날짜 단위로
// 캡을 건다(프로젝트 단위 총 횟수 캡은 project_id가 생긴 뒤인
// /api/projects/[id]/questions/suggest 쪽에서 처리).
const DRAFT_SUGGESTION_DAILY_CAP = 10

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { project, psf_pmf_type, remaining_slots } = await req.json()

    if (!project || remaining_slots <= 0) {
      return NextResponse.json({ suggestions: [], remainingSlots: 0 })
    }

    const date = new Date().toISOString().slice(0, 10)
    const allowed = await checkAndIncrementSuggestionCap(
      `question_suggest:draft:${user.id}:${date}`,
      DRAFT_SUGGESTION_DAILY_CAP
    )
    if (!allowed) {
      return NextResponse.json({ error: '오늘 AI 추천 요청 횟수를 다 쓰셨어요' }, { status: 429 })
    }

    const requiredQuestions =
      psf_pmf_type === 'psf'
        ? [
            { question_text: '이 문제를 직접 겪어보신 적이 있나요?' },
            { question_text: '현재는 이 문제를 어떻게 해결하고 계신가요?' },
            { question_text: '이런 솔루션이 있다면 사용해보시겠어요?' },
            { question_text: '이 문제는 얼마나 자주 발생하나요?' },
          ]
        : [
            { question_text: '이 제품/서비스를 더 이상 사용할 수 없게 된다면 어떤 기분이 들겠습니까?' },
          ]

    // draft 단계엔 크리에이터 레벨 정보가 없으므로 'seed' 기본값 (Claude haiku 사용)
    const suggestions = await generateQuestionSuggestions(
      project,
      requiredQuestions,
      [],
      remaining_slots,
      'seed'
    )

    return NextResponse.json({ suggestions, remainingSlots: remaining_slots })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
