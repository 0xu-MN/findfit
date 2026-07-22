export async function callGemini(prompt: string): Promise<Record<string, unknown> | unknown[]> {
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

function getMockResponse(prompt: string): Record<string, unknown> | unknown[] {
  // 질문 추천 프롬프트(buildQuestionRecommendationPrompt)는 배열을 기대하는데,
  // 이 케이스가 없어서 아래 psf_score 기본 객체로 떨어졌었다 — 그 객체의
  // key_insights(문자열 배열)가 QuestionSuggestion[]인 것처럼 잘못 소비돼
  // "AI 추천 질문"이 깨진 카드로 렌더링되던 원인.
  if (prompt.includes('관심사 키워드')) {
    return ['가성비', '시간 절약', '트렌드에 민감함', '1인 가구', '재택근무', '자기계발']
  }
  if (prompt.includes('question_text')) {
    return [
      {
        question_text: '이 제품을 처음 사용했을 때 가장 헷갈렸던 부분은 무엇인가요?',
        question_type: 'short_answer',
        options: null,
      },
      {
        question_text: '이 제품을 얼마나 자주 사용할 것 같나요?',
        question_type: 'likert_5',
        options: ['매우 자주', '자주', '보통', '가끔', '거의 안 함'],
      },
      {
        question_text: '아래 중 이 제품을 쓰지 않을 것 같은 이유가 있다면?',
        question_type: 'multiple_choice',
        options: ['가격', '복잡한 사용법', '필요성을 못 느낌', '기타'],
      },
    ]
  }
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
