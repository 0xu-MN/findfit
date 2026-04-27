import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// 리워드 자동 지급 — 평가 품질 검증 통과 시 포인트 지급
serve(async (req) => {
  const { evaluation_id } = await req.json()
  // TODO: 품질 필터 통과 여부 확인 + 포인트 지급 + Giftishow API 연동
  return new Response(JSON.stringify({ evaluation_id, status: 'pending' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
