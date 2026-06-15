export async function callGemini(prompt: string): Promise<Record<string, unknown>> {
  if (!process.env.GEMINI_API_KEY) {
    return getMockResponse(prompt)
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })

  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return JSON.parse(text)
}

function getMockResponse(prompt: string): Record<string, unknown> {
  if (prompt.includes('winner')) {
    return {
      winner: 'A',
      ratio_summary: 'A 62% / B 38%',
      key_comments: ['디자인이 직관적이에요', 'A가 더 깔끔하게 느껴집니다'],
      one_line_recommendation: 'A 방향으로 진행을 권장합니다',
    }
  }
  if (prompt.includes('usability_score')) {
    return {
      usability_score: 74,
      intuitiveness_score: 68,
      trust_score: 71,
      friction_points: ['온보딩 단계가 복잡함', '핵심 기능 탐색이 어려움'],
      priority_fixes: ['온보딩 단순화', '메인 CTA 버튼 강조', '네비게이션 개선'],
    }
  }
  return {
    psf_score: 72,
    sean_ellis_pct: 41,
    recommendation: 'continue',
    key_insights: ['문제 인식률이 높음', '솔루션 수용 의향 긍정적'],
    pattern_analysis: '응답자 대다수가 문제를 인지하고 있으며 솔루션에 관심을 보임',
    benchmark_comment: '동일 카테고리 평균(Sean Ellis 40%) 대비 소폭 상회',
    action_plan: ['핵심 기능 우선 개발', '초기 사용자 온보딩 강화'],
    pivot_scenarios: ['타겟 고객 세분화', '가격 정책 재검토'],
  }
}
