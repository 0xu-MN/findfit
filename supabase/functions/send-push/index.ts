import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// FCM 스마트 푸시 — 의뢰 등록 시 매칭된 평가단에게 발송
serve(async (req) => {
  const { request_id } = await req.json()
  // TODO: 카테고리 매칭 + FCM 푸시 발송 로직
  return new Response(JSON.stringify({ request_id, status: 'pending' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
