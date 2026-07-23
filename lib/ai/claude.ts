export async function callClaude(prompt: string): Promise<Record<string, unknown>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockResponse(prompt)
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const text: string = data.content?.[0]?.text ?? ''
  return JSON.parse(text)
}

function getMockResponse(prompt: string): Record<string, unknown> {
  if (prompt.includes('winner')) {
    return {
      winner: 'A',
      ratio_summary: 'A 65% / B 35%',
      key_comments: ['A가 브랜드 아이덴티티와 더 잘 맞음', '시각적 계층이 명확함'],
      one_line_recommendation: 'A안 채택을 강력히 권장합니다',
    }
  }
  if (prompt.includes('usability_score')) {
    return {
      usability_score: 78,
      intuitiveness_score: 73,
      trust_score: 75,
      friction_points: ['회원가입 단계 과도함', '핵심 기능 접근 경로 불명확'],
      priority_fixes: ['회원가입 간소화 (소셜 로그인)', '홈화면 CTA 재배치', '도움말 인라인 추가'],
      psf_score: 76,
      sean_ellis_pct: 44,
      recommendation: 'continue',
    }
  }
  return {
    psf_score: 76,
    sean_ellis_pct: 44,
    recommendation: 'continue',
    key_insights: ['핵심 문제 공감도 높음', '솔루션 차별성 명확', '가격 민감도 낮음'],
    pattern_analysis: '사용자들이 현재 대안에 불만족하며 새로운 솔루션을 원하는 패턴이 뚜렷함',
    benchmark_comment: '동일 카테고리 상위 20% 수준의 PMF 신호',
    action_plan: ['핵심 기능 집중 개발', '신뢰 요소(후기/인증) 강화', '온보딩 개선'],
    pivot_scenarios: ['B2B 전환 검토', '특정 직군 타겟 세분화'],
  }
}
