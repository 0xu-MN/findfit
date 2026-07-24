// 모델 slug는 Anthropic 공식 문서(platform.claude.com/docs/en/about-claude/models/overview)
// 기준 — 마케팅명과 API 문자열이 다를 수 있어 여기서 한 곳으로 고정한다.
// sonnet: 리포트 생성처럼 품질이 중요한 무거운 작업. haiku: 챗봇/자동추천처럼
// 응답속도·비용이 중요한 가벼운 작업.
const MODEL_SLUGS = {
  sonnet: 'claude-sonnet-5',
  haiku: 'claude-haiku-4-5-20251001',
} as const

export type ClaudeTier = keyof typeof MODEL_SLUGS

export async function callClaude(
  prompt: string,
  tier: ClaudeTier = 'sonnet',
  options?: { maxTokens?: number }
): Promise<Record<string, unknown> | unknown[]> {
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
      model: MODEL_SLUGS[tier],
      max_tokens: options?.maxTokens ?? 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  if (data.type === 'error') {
    throw new Error(`Claude API error: ${data.error?.message ?? 'unknown'}`)
  }
  const text: string = data.content?.[0]?.text ?? ''
  return JSON.parse(extractJson(text))
}

// Gemini와 달리 Claude Messages API는 강제 JSON 모드가 없어서, 프롬프트에서
// "JSON만 반환하라"고 지시해도 ```json ... ``` 코드펜스로 감싸서 응답할 때가
// 있다 — 그대로 JSON.parse하면 깨지므로 펜스와 앞뒤 잡텍스트를 제거한다.
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()

  const trimmed = text.trim()
  const firstBrace = Math.min(
    ...['{', '['].map((c) => { const i = trimmed.indexOf(c); return i === -1 ? Infinity : i })
  )
  if (firstBrace === Infinity) return trimmed
  const lastBrace = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'))
  return lastBrace === -1 ? trimmed : trimmed.slice(firstBrace, lastBrace + 1)
}

function getMockResponse(prompt: string): Record<string, unknown> | unknown[] {
  if (prompt.includes('[사용자 질문]')) {
    return { answer: '리포트 기준으로는 문제 공감도와 솔루션 수용도가 높게 나타났어요. 실제 키가 연결되면 더 정확한 답변을 드릴 수 있어요.' }
  }
  if (prompt.includes('관심사 키워드')) {
    return ['가성비', '시간 절약', '트렌드에 민감함', '1인 가구', '재택근무', '자기계발']
  }
  if (prompt.includes('question_text')) {
    return [
      { question_text: '이 제품을 처음 사용했을 때 가장 헷갈렸던 부분은 무엇인가요?', question_type: 'short_answer', options: null },
      { question_text: '이 제품을 얼마나 자주 사용할 것 같나요?', question_type: 'likert_5', options: ['매우 자주', '자주', '보통', '가끔', '거의 안 함'] },
      { question_text: '아래 중 이 제품을 쓰지 않을 것 같은 이유가 있다면?', question_type: 'multiple_choice', options: ['가격', '복잡한 사용법', '필요성을 못 느낌', '기타'] },
    ]
  }
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

  const stageMatch = prompt.match(/\[현재 단계\] (\w+)/)
  const stage = stageMatch?.[1] ?? 'beta'
  const ueEligible = stage === 'beta' || stage === 'launched'

  return {
    psf_score: 76,
    sean_ellis_pct: 44,
    recommendation: 'continue',
    key_insights: [
      '핵심 문제 공감도 높음',
      '솔루션 차별성 명확',
      '가격 민감도 낮은 편',
      '핵심 기능 사용 빈도가 높음',
      '온보딩 단계에서 이탈 신호가 일부 관찰됨',
    ],
    pattern_analysis: '사용자들이 현재 대안에 불만족하며 새로운 솔루션을 원하는 패턴이 뚜렷함',
    benchmark_comment: '동일 카테고리 상위 20% 수준의 PMF 신호',
    action_plan: ['핵심 기능 집중 개발', '신뢰 요소(후기/인증) 강화', '온보딩 개선'],
    pivot_scenarios: ['B2B 전환 검토', '특정 직군 타겟 세분화'],
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
          { phase: '현재 · 완료', title: 'PSF 검증 완료', description: '목표 리뷰 수 달성, 시장 가설 검증 완료', kpis: ['PSF 76', '응답자 30명'] },
          { phase: 'Phase 1 · 1~3개월', title: '리텐션 확인', description: '초기 사용자의 재방문율을 측정해 다음 단계 투자를 결정', kpis: ['7일 리텐션 30%+'] },
        ]
      : null,
  }
}
