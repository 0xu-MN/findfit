import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// AI 리포트 생성 — 모든 평가 완료 시 자동 트리거
// Sean Ellis 스코어 + PSF/PMF 점수 + 추천(continue/pivot/stop) 생성
serve(async (req) => {
  const { request_id } = await req.json()
  // TODO: OpenAI GPT-4o 호출 로직
  return new Response(JSON.stringify({ request_id, status: 'pending' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
