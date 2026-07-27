import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 크리에이터가 모집을 마감하고 리뷰 단계로 넘어가는 3가지 시나리오를
// 전부 이 API 하나로 처리한다 — 상태 전이 자체(active → reviewing)는
// 셋 다 동일하고, mode는 어떤 화면 문구/확인 절차를 거쳐 왔는지 구분용:
//   - force_early:    마감일 전, 목표 인원 미달인데 강제로 지금 시작
//                      (재확인 모달 필요 — 손실 확정)
//   - proceed_short:  마감일 지났고 목표 미달, 지금까지 모인 인원으로 시작
//                      (부족한 인원만큼은 환불 대상 — refund_needed로 표시)
//   - complete_start: 목표 인원 다 채워서 바로 시작 (경고 불필요)
//
// ⚠️ proceed_short의 "부족한 인원만큼 전액 환불"은 실제 결제 연동
// (PortOne)이 아직 스텁 상태라 이 API가 돈을 실제로 돌려주지는 않는다 —
// refund_needed 플래그와 부족 인원 수만 응답에 남겨서, 나중에 결제 연동이
// 붙을 때 이 정보로 처리할 수 있게 해둔 것. 화면에는 "환불돼요"라고
// 안내하지만 실제 환불 처리는 별도 확인이 필요하다는 걸 팀 내부적으로는
// 알고 있어야 한다.
//
// 이 전이는 지금까지 앱 어디에도 없던 유일한 진입점이다 — distribute
// 라우트(app/api/projects/[id]/distribute/route.ts)가 이미 project.status
// === 'reviewing'을 전제로 하고 있었는데, 그 상태로 넘기는 코드가 지금껏
// 하나도 없어서 크리에이터가 사례금 배분 단계 자체에 도달할 방법이 없었다.
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { mode } = (await req.json()) as { mode?: 'force_early' | 'proceed_short' | 'complete_start' }
  if (mode !== 'force_early' && mode !== 'proceed_short' && mode !== 'complete_start') {
    return NextResponse.json({ error: 'mode는 force_early, proceed_short, complete_start 중 하나여야 합니다' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, creator_id, status, target_count, completed_count')
    .eq('id', id)
    .single()
  if (!project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  if (project.creator_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (project.status !== 'active') {
    return NextResponse.json({ error: '모집 중인 프로젝트만 마감할 수 있습니다' }, { status: 400 })
  }

  const { error } = await supabase.from('projects').update({ status: 'reviewing' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shortfall = Math.max(0, project.target_count - project.completed_count)
  return NextResponse.json({
    ok: true,
    mode,
    refundNeeded: mode === 'proceed_short' && shortfall > 0,
    shortfallCount: shortfall,
  })
}
