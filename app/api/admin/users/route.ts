import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자용 전체 유저 목록(빌더+리뷰어) — 역할별 프로젝트/리뷰 활동 수를
// 함께 집계해서 반환한다.
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const admin = createAdminClient()

  const [{ data: users, error }, { data: projectCounts }, { data: reviewCounts }, { data: allMatches }] = await Promise.all([
    admin.from('users').select('id, email, role, status, last_active_role, created_at').order('created_at', { ascending: false }),
    admin.from('projects').select('creator_id'),
    admin.from('project_matches').select('reviewer_id').eq('status', 'completed'),
    admin.from('project_matches').select('reviewer_id'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projectCountByUser = new Map<string, number>()
  for (const p of projectCounts ?? []) {
    if (!p.creator_id) continue
    projectCountByUser.set(p.creator_id, (projectCountByUser.get(p.creator_id) ?? 0) + 1)
  }
  const reviewCountByUser = new Map<string, number>()
  for (const r of reviewCounts ?? []) {
    if (!r.reviewer_id) continue
    reviewCountByUser.set(r.reviewer_id, (reviewCountByUser.get(r.reviewer_id) ?? 0) + 1)
  }
  // role 컬럼은 최초 가입 시 한 번 고정되는 값이라, 크리에이터로 시작한
  // 유저가 나중에 리뷰어로도 활동해도 role은 그대로 'builder'로 남는다.
  // 관리자 목록에서 "리뷰어" 필터에 안 뜨는 버그의 원인 — 실제 활동
  // 이력(project_matches 존재 여부)으로 역할을 별도 파생시켜 함께 내려준다.
  const anyMatchByUser = new Set<string>()
  for (const r of allMatches ?? []) {
    if (r.reviewer_id) anyMatchByUser.add(r.reviewer_id)
  }

  const enriched = (users ?? []).map((u) => ({
    ...u,
    project_count: projectCountByUser.get(u.id) ?? 0,
    completed_review_count: reviewCountByUser.get(u.id) ?? 0,
    is_builder: (projectCountByUser.get(u.id) ?? 0) > 0 || u.role === 'builder',
    is_reviewer: anyMatchByUser.has(u.id) || u.role === 'evaluator',
  }))

  return NextResponse.json({ users: enriched })
}
