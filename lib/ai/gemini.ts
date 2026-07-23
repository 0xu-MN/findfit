export async function callGemini(
  prompt: string,
  options?: { maxOutputTokens?: number }
): Promise<Record<string, unknown> | unknown[]> {
  if (!process.env.GEMINI_API_KEY) {
    return getMockResponse(prompt)
  }

  // gemini-2.0-flash 유지 — Flash 계열이라 무료 티어 대상. AI 비용 상한(채팅
  // 라우트) 목적으로 maxOutputTokens만 선택적으로 넘길 수 있게 확장.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        ...(options?.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
      },
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
  if (prompt.includes('[사용자 질문]')) {
    return { answer: '리포트 기준으로는 문제 공감도와 솔루션 수용도가 높게 나타났어요. 다만 실제 서비스 키가 연결되면 더 정확한 답변을 드릴 수 있어요.' }
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
  const stageMatch = prompt.match(/\[현재 단계\] (\w+)/)
  const stage = stageMatch?.[1] ?? 'beta'
  const ueEligible = stage === 'beta' || stage === 'launched'

  return {
    psf_score: 72,
    sean_ellis_pct: 41,
    recommendation: 'continue',
    key_insights: [
      '문제 인식률이 높음',
      '솔루션 수용 의향 긍정적',
      '가격 민감도가 낮은 편',
      '핵심 기능 사용 빈도가 높음',
      '온보딩 단계에서 이탈 신호가 일부 관찰됨',
    ],
    pattern_analysis: '응답자 대다수가 문제를 인지하고 있으며 솔루션에 관심을 보임',
    benchmark_comment: '동일 카테고리 평균(Sean Ellis 40%) 대비 소폭 상회',
    action_plan: ['핵심 기능 우선 개발', '초기 사용자 온보딩 강화', '베타 테스터 10명 추가 확보'],
    pivot_scenarios: ['타겟 고객 세분화', '가격 정책 재검토'],
    competitor_references: [
      { name: '레퍼런스 A', description: '유사 문제를 다루는 국내 서비스 — 온보딩 단순화로 초기 이탈률을 낮춘 사례' },
      { name: '레퍼런스 B', description: '해외 유사 서비스 — 커뮤니티 기반 마케팅으로 초기 확산에 성공한 사례' },
      { name: '레퍼런스 C', description: '인접 카테고리 서비스 — 프리미엄 요금제 전환에 성공한 가격 정책 참고 사례' },
    ],
    market_size: {
      tam: { label: '전체 시장', value: '1.2조원', basis: '유사 카테고리 시장 규모 추정' },
      sam: { label: '유효 시장', value: '3,400억원', basis: '타겟 세그먼트 비중 추정' },
      som: { label: '초기 목표 시장', value: '42억원', basis: 'SAM의 약 1% 초기 점유 가정' },
      note: 'AI가 일반 지식을 바탕으로 추정한 수치이며, 실제 시장조사를 대체하지 않습니다.',
    },
    positioning_map: {
      axes: { x_label: '가격 (저렴 → 프리미엄)', y_label: '기능 (단순 → 고도화)' },
      competitors: [
        { name: '경쟁사 A', x: 30, y: 60 },
        { name: '경쟁사 B', x: 70, y: 40 },
      ],
      self: { x: 50, y: 75 },
      note: 'AI 추정치이며, 일반적으로 알려진 포지션 기준의 참고용 배치입니다.',
    },
    unit_economics: ueEligible
      ? { cac: '3,200원', ltv: '89,700원', ratio: '28x', basis_note: 'AI가 유사 카테고리 평균을 참고해 추정한 수치이며, 실제 결제 데이터 기반이 아닙니다.' }
      : null,
    gtm_strategies: ueEligible
      ? [
          { title: '커뮤니티 마케팅', phase: 'Phase 1 · 초기 확산', description: '관련 커뮤니티에서 자연스럽게 노출해 초기 사용자를 낮은 비용으로 확보' },
          { title: 'SNS 바이럴', phase: 'Phase 2 · 성장', description: '실사용 후기 콘텐츠로 유기적 확산 유도' },
        ]
      : null,
    scaleup_roadmap: (ueEligible && stage === 'launched')
      ? [
          { phase: '현재 · 완료', title: 'PSF 검증 완료', description: '목표 리뷰 수 달성, 시장 가설 검증 완료', kpis: ['PSF 72', '응답자 30명'] },
          { phase: 'Phase 1 · 1~3개월', title: '리텐션 확인', description: '초기 사용자의 재방문율을 측정해 다음 단계 투자를 결정', kpis: ['7일 리텐션 30%+'] },
        ]
      : null,
  }
}
