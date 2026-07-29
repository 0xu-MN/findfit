import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// M-5: 마감 기한(deadline) 초과 처리 — cron으로 매일 실행.
//
// ⚠️ 예전엔 여기서 모집 마감일이 지난 active 프로젝트를 곧바로 completed로
// 바꿔버렸다. 그런데 그 뒤 크리에이터가 "모집 마감 → 리뷰 진행"을 명시적으로
// 선언하는 3단계 시나리오(close-recruitment API, reviewing 상태)가 새로
// 생기면서, 이 cron이 그 파이프라인을 완전히 건너뛰는 충돌이 있었다 —
// 크리에이터가 아무것도 안 해도 자정에 이 함수가 먼저 completed로 확정해버려서,
// 이미 지원 수락된 리뷰어가 리뷰를 쓸 기회 자체가 사라지는 문제.
//
// 수정: 이 cron은 이제 딱 한 단계만 담당한다 — 모집 마감일이 지난 active
// 프로젝트를 reviewing으로 전환하고 review_deadline을 정해준다(크리에이터가
// 직접 마감 처리를 안 해도 리뷰 자체는 진행될 수 있게). 그다음 review_deadline
// 마저 지난 reviewing 프로젝트를 completed로 마무리하는 건 별도 단계로
// 분리했다 — 두 단계를 한 번에 건너뛰지 않도록.
const DEFAULT_REVIEW_DAYS = 7

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const now = new Date()
  const reviewDeadline = new Date(now.getTime() + DEFAULT_REVIEW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // 1단계: 모집 마감일이 지난 active 프로젝트 → reviewing (리뷰 시작)
  const { data: startedReview, error: startError } = await supabase
    .from('projects')
    .update({ status: 'reviewing', review_deadline: reviewDeadline })
    .eq('status', 'active')
    .lt('deadline', now.toISOString())
    .select('id, completed_count, target_count')

  if (startError) {
    return new Response(JSON.stringify({ error: startError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2단계: 리뷰 마감일까지 지난 reviewing 프로젝트 → completed (일괄 마감)
  const { data: completed, error: completeError } = await supabase
    .from('projects')
    .update({ status: 'completed' })
    .eq('status', 'reviewing')
    .not('review_deadline', 'is', null)
    .lt('review_deadline', now.toISOString())
    .select('id, completed_count, target_count')

  if (completeError) {
    return new Response(JSON.stringify({ error: completeError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      movedToReviewing: startedReview?.length ?? 0,
      closedCount: completed?.length ?? 0,
      startedReview: startedReview ?? [],
      closed: completed ?? [],
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
