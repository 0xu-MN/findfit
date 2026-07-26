import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'
import { getTrendLine } from '@/lib/agent/naverTrends'
import { checkAndIncrementSuggestionCap } from '@/lib/ai/suggestionCap'

const DAILY_CAP = 20

export type RecommendedItem = {
  title: string
  description: string
  reason: string
}

const FALLBACK_ITEMS: RecommendedItem[] = [
  {
    title: '저당 간식 정기구독 키트',
    description: '당 섭취를 관리하는 2030 소비자를 위한 월간 저당 간식 큐레이션',
    reason: '건강 관리 트렌드와 정기구독 모델 수요가 동시에 늘고 있어요',
  },
  {
    title: '반려동물 맞춤 영양 간식',
    description: '견종·연령별 맞춤 레시피를 제공하는 프리미엄 펫 간식',
    reason: '반려동물 헬스케어 시장이 꾸준히 성장 중이에요',
  },
  {
    title: '1인 가구용 소분 밀키트',
    description: '조리 부담을 줄인 1~2인분 단위의 간편식 밀키트',
    reason: '1인 가구 증가와 함께 소용량 식품 수요가 커지고 있어요',
  },
]

// 홈 검색 → "검증 시작" 흐름에서 쓰는 AI 아이템 추천 — 사용자가 입력한
// 키워드 + 세부 질문 답변을 바탕으로 네이버 트렌드 한 줄(기존 getTrendLine,
// /api/agent/trend와 동일 함수 재사용)을 곁들여 Claude에게 아이템 3개를
// 뽑게 한다. 캡/폴백 처리는 /api/agent/understand와 동일한 패턴.
export async function POST(req: Request) {
  try {
    const { keyword, answers, sessionId } = (await req.json()) as {
      keyword?: string
      answers?: Record<string, string>
      sessionId?: string
    }
    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ items: FALLBACK_ITEMS })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const subject = user?.id ?? sessionId ?? 'anonymous'
    const date = new Date().toISOString().slice(0, 10)

    const allowed = await checkAndIncrementSuggestionCap(`agent_recommend:${subject}:${date}`, DAILY_CAP)
    if (!allowed) {
      return NextResponse.json({ items: FALLBACK_ITEMS, capped: true })
    }

    const trendLine = await getTrendLine('default')

    const answerLines = Object.entries(answers ?? {})
      .map(([q, a]) => `- ${q}: ${a}`)
      .join('\n')

    const prompt = `당신은 FindFit의 창업 아이템 추천 에이전트입니다. 아래 정보를 참고해 "요즘 이런 게 핫해요" 톤으로 실제로 검증해볼 만한 구체적인 상품/서비스 아이템 3개를 추천하세요.

[사용자 입력 키워드]
${keyword}

[세부 질문 답변]
${answerLines || '(없음)'}

[참고 트렌드]
${trendLine}

JSON 배열로만 응답하세요. 각 항목은 {"title": "아이템 이름(15자 이내)", "description": "한 줄 설명(40자 이내)", "reason": "추천 이유(30자 이내)"} 형식입니다.`

    try {
      const result = await callClaude(prompt, 'haiku')
      const items = Array.isArray(result) ? (result as RecommendedItem[]) : FALLBACK_ITEMS
      return NextResponse.json({ items: items.length > 0 ? items.slice(0, 3) : FALLBACK_ITEMS, trendLine })
    } catch (err) {
      console.error('[agent/recommend-items] callClaude failed', err)
      return NextResponse.json({ items: FALLBACK_ITEMS, trendLine })
    }
  } catch (err) {
    console.error('[agent/recommend-items]', err)
    return NextResponse.json({ items: FALLBACK_ITEMS })
  }
}
