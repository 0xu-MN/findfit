import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// 캐시 소멸 — cron으로 매일 실행, 180일 초과 미사용 캐시 소멸 처리
serve(async (_req) => {
  // TODO: 180일 초과 cash_transactions 조회 후 expire 처리
  return new Response(JSON.stringify({ status: 'pending' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
