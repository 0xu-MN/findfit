import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ShippingStatus } from '@/types/database'

// 크리에이터가 배송형 프로젝트의 리뷰어별 배송 상태를 수동으로 바꾸는 API.
// project_matches는 RLS상 리뷰어 본인만 UPDATE 가능하므로(migration 009),
// 크리에이터가 이 컬럼만 안전하게 바꿀 수 있도록 서버에서 소유권을 검증한
// 뒤 서비스 롤로 대신 UPDATE한다.
export async function POST(
  req: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await context.params
  const { shipping_status } = (await req.json()) as { shipping_status: ShippingStatus }

  if (!['pending', 'shipped', 'delivered'].includes(shipping_status)) {
    return NextResponse.json({ error: '잘못된 상태값입니다' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const admin = createAdminClient()

  // 이 매칭이 정말 로그인한 유저 소유의 프로젝트에 속하는지 확인
  const { data: match } = await admin
    .from('project_matches')
    .select('id, project_id')
    .eq('id', matchId)
    .single()
  if (!match) return NextResponse.json({ error: '매칭을 찾을 수 없습니다' }, { status: 404 })

  const { data: project } = await admin
    .from('projects')
    .select('creator_id')
    .eq('id', match.project_id as string)
    .single()
  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { error } = await admin.from('project_matches').update({ shipping_status }).eq('id', matchId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
