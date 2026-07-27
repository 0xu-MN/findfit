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

// 키워드에서 대략적인 카테고리를 추정 — 예전엔 무조건 'default'(=
// "스타트업 서비스")로 getTrendLine을 호출해서, 사용자가 뭘 입력하든
// 참고 트렌드가 항상 "스타트업 서비스 검색량 감소" 한 줄로 고정돼 있었다.
// Claude가 키워드보다 이 트렌드 문구를 더 따라가서 "반려동물 간식"을
// 입력해도 "스타트업 컨설팅" 같은 엉뚱한 추천이 나오는 원인이었다.
const CATEGORY_HINTS: Record<string, string[]> = {
  health: ['건강', '헬스', '웰니스', '피트니스', '다이어트', '운동'],
  food: ['간식', '식품', '밀키트', '음식', '요리', '반려동물', '펫'],
  edu: ['교육', '학습', '강의', '스터디', '과외'],
  fintech: ['금융', '결제', '핀테크', '투자', '대출'],
  commerce: ['쇼핑', '커머스', '구독', '판매', '이커머스'],
  app: ['앱', 'saas', '소프트웨어', '생산성', '툴'],
}
function guessCategory(keyword: string): string {
  const lower = keyword.toLowerCase()
  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some((h) => lower.includes(h))) return cat
  }
  return 'default'
}

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

    const trendLine = await getTrendLine(guessCategory(keyword))

    const answerLines = Object.entries(answers ?? {})
      .map(([q, a]) => `- ${q}: ${a}`)
      .join('\n')

    const prompt = `당신은 FindFit의 창업 아이템 추천 에이전트입니다. 아래 정보를 참고해 "요즘 이런 게 핫해요" 톤으로 실제로 검증해볼 만한 구체적인 상품/서비스 아이템 3개를 추천하세요.

[사용자 입력 키워드] — 반드시 이 키워드와 직접 관련된 아이템만 추천하세요. 아래 참고
트렌드는 보조 정보일 뿐이니, 키워드와 안 맞으면 무시하세요.
${keyword}

[세부 질문 답변]
${answerLines || '(없음)'}

[참고 트렌드 — 보조 정보, 키워드와 무관하면 무시]
${trendLine}

JSON 배열로만 응답하세요. 각 항목은 {"title": "아이템 이름(15자 이내)", "description": "한 줄 설명(40자 이내)", "reason": "추천 이유(30자 이내)"} 형식입니다.`

    // Claude 호출이 가끔 실패(타임아웃/일시적 API 오류)할 때 바로
    // FALLBACK_ITEMS로 떨어지면 사용자 입장에선 "절반은 그냥 안 된다"로
    // 보인다 — 한 번은 재시도해서 성공률을 높인다.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callClaude(prompt, 'haiku')
        const items = Array.isArray(result) ? (result as RecommendedItem[]) : null
        if (items && items.length > 0) {
          return NextResponse.json({ items: items.slice(0, 3), trendLine })
        }
      } catch (err) {
        console.error(`[agent/recommend-items] callClaude failed (attempt ${attempt + 1})`, err)
      }
    }
    return NextResponse.json({ items: FALLBACK_ITEMS, trendLine })
  } catch (err) {
    console.error('[agent/recommend-items]', err)
    return NextResponse.json({ items: FALLBACK_ITEMS })
  }
}
