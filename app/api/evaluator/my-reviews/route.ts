import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 리뷰어 "내 리뷰" 페이지용 조회 — 본인 project_matches를 projects와
// 조인하고, distributions와 좌조인해서 사례금 입금 여부까지 한 번에 내려준다.
// RLS(project_matches_own_select류, distributions_own_select — migration 009)가
// 이미 본인 행만 보이게 막아주므로 세션 클라이언트로 충분하고 서비스 롤은
// 필요 없다.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: matches, error } = await supabase
    .from('project_matches')
    .select('id, project_id, status, applied_at, accepted_at, submitted_at, projects(id, title, one_liner, target_count, completed_count)')
    .eq('reviewer_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projectIds = (matches ?? []).map((m) => m.project_id).filter((id): id is string => !!id)
  const { data: distributions } = projectIds.length
    ? await supabase
        .from('distributions')
        .select('project_id, status, paid_at, amount')
        .eq('reviewer_id', user.id)
        .in('project_id', projectIds)
    : { data: [] }

  const distByProject = new Map((distributions ?? []).map((d) => [d.project_id, d]))

  const rows = (matches ?? []).map((m) => {
    const dist = m.project_id ? distByProject.get(m.project_id) : undefined
    return {
      matchId: m.id,
      projectId: m.project_id,
      status: m.status,
      appliedAt: m.applied_at,
      acceptedAt: m.accepted_at,
      submittedAt: m.submitted_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      project: m.projects as any,
      payout: dist ? { status: dist.status, paidAt: dist.paid_at, amount: dist.amount } : null,
    }
  })

  return NextResponse.json({ reviews: rows })
}
