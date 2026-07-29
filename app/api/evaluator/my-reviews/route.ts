import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 리뷰어 "내 리뷰" 페이지용 조회 — 본인 project_matches를 조회하고,
// projects_public 뷰(리뷰어용 — migration 009)에서 프로젝트 정보를,
// distributions에서 사례금 입금 여부를 각각 조회해 합친다.
// RLS(project_matches_own_select류, distributions_own_select)가 이미 본인
// 행만 보이게 막아주므로 세션 클라이언트로 충분하고 서비스 롤은 필요 없다.
//
// 주의: projects 원본 테이블은 "projects_owner_all" 정책상 크리에이터
// 본인만 SELECT 가능해서, project_matches에 projects(...)를 그대로
// 조인하면 리뷰어 입장에선 RLS에 막혀 null이 되어 "삭제된 프로젝트"처럼
// 보이는 버그가 있었다 — 반드시 projects_public 뷰를 따로 조회해야 한다.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: matches, error } = await supabase
    .from('project_matches')
    .select('id, project_id, status, applied_at, accepted_at, submitted_at')
    .eq('reviewer_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projectIds = [...new Set((matches ?? []).map((m) => m.project_id).filter((id): id is string => !!id))]

  const [{ data: projects }, { data: distributions }] = await Promise.all([
    projectIds.length
      ? supabase.from('projects_public').select('id, title, one_liner, target_count, completed_count, status').in('id', projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabase.from('distributions').select('project_id, status, paid_at, amount').eq('reviewer_id', user.id).in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
  ])

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]))
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
      project: m.project_id ? (projectById.get(m.project_id) ?? null) : null,
      payout: dist ? { status: dist.status, paidAt: dist.paid_at, amount: dist.amount } : null,
    }
  })

  return NextResponse.json({ reviews: rows })
}
