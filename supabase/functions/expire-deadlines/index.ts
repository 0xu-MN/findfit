import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// M-5: 마감 기한(deadline) 초과 처리 — cron으로 매일 실행.
// 지금까지 projects.deadline은 저장만 되고 넘겨도 아무 일도 일어나지
// 않았다(자동 마감/알림 없음). deadline이 지났는데 아직 목표 리뷰 수에
// 못 미친 채 active 상태인 프로젝트를 부분 완료로 마감 처리한다 — 완전
// 무응답으로 영영 열려있는 것보다, 지금까지 걷힌 리뷰만으로라도 정리되는
// 편이 크리에이터 입장에서 낫다는 판단.
serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: expired, error } = await supabase
    .from('projects')
    .update({ status: 'completed' })
    .eq('status', 'active')
    .lt('deadline', new Date().toISOString())
    .select('id, completed_count, target_count')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ status: 'ok', closedCount: expired?.length ?? 0, closed: expired ?? [] }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
