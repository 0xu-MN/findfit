// FindFit Agent Phase 2/3 — 실시간 검색 트렌드 (기획서 5.2 "네이버 데이터랩" 소스).
// NAVER_CLIENT_ID/SECRET이 없으면 기존에 쓰던 정적 문구로 자동 대체된다 —
// Gemini/Claude 키 없을 때 mock으로 대체되는 것과 같은 패턴.
const CATEGORY_KEYWORDS: Record<string, string> = {
  health: '헬스 웰니스',
  food: '건강식품 밀키트',
  edu: 'AI 교육 온라인학습',
  fintech: '핀테크 간편결제',
  commerce: '이커머스 쇼핑',
  app: 'SaaS 생산성앱',
  default: '스타트업 서비스',
}

const FALLBACK_TEXTS: Record<string, string> = {
  health: '헬스·웰니스 관련 검색은 최근 6개월간 국내에서 꾸준히 증가하고 있어요',
  food: '건강 식품·밀키트 관련 검색은 최근 6개월간 지속 상승 중이에요',
  edu: 'AI 교육·온라인 학습 관련 검색은 최근 1년간 급격히 증가했어요',
  app: 'SaaS·생산성 앱 관련 검색은 최근 3개월간 꾸준히 늘고 있어요',
  fintech: '핀테크·간편 금융 관련 검색은 최근 6개월간 안정적으로 성장 중이에요',
  commerce: '커머스·이커머스 관련 검색은 최근 6개월간 꾸준히 성장하고 있어요',
  default: '관련 분야 검색은 최근 6개월간 국내에서 꾸준히 증가하고 있어요',
}

type DataLabPoint = { period: string; ratio: number }
type DataLabResponse = {
  results: { title: string; data: DataLabPoint[] }[]
}

// 최근 6개월 검색 비율 추이에서 초반 대비 최근 변화율(%)을 계산
function computeChangePct(points: DataLabPoint[]): number | null {
  if (points.length < 2) return null
  const first = points[0].ratio
  const last = points[points.length - 1].ratio
  if (first <= 0) return null
  return Math.round(((last - first) / first) * 100)
}

export async function getTrendLine(categoryKey: string): Promise<string> {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return FALLBACK_TEXTS[categoryKey] ?? FALLBACK_TEXTS.default
  }

  try {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 6)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const keyword = CATEGORY_KEYWORDS[categoryKey] ?? CATEGORY_KEYWORDS.default

    const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        timeUnit: 'month',
        keywordGroups: [{ groupName: keyword, keywords: keyword.split(' ') }],
      }),
    })

    if (!res.ok) return FALLBACK_TEXTS[categoryKey] ?? FALLBACK_TEXTS.default

    const json = (await res.json()) as DataLabResponse
    const points = json.results?.[0]?.data ?? []
    const changePct = computeChangePct(points)

    if (changePct === null) return FALLBACK_TEXTS[categoryKey] ?? FALLBACK_TEXTS.default

    const direction = changePct >= 0 ? '증가' : '감소'
    return `${keyword} 관련 검색량이 최근 6개월간 ${Math.abs(changePct)}% ${direction}했어요 (네이버 데이터랩)`
  } catch {
    return FALLBACK_TEXTS[categoryKey] ?? FALLBACK_TEXTS.default
  }
}
