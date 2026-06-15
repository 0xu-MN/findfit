import { generateQuestionSuggestions } from '@/lib/ai/index'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { project, psf_pmf_type, existing_count, remaining_slots } = await req.json()

    if (!project || remaining_slots <= 0) {
      return NextResponse.json({ suggestions: [], remainingSlots: 0 })
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

    // draft 단계엔 크리에이터 레벨 정보가 없으므로 'seed' 기본값 (Gemini 사용)
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
