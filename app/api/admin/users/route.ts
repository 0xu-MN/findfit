import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

// 관리자용 전체 유저 목록(빌더+리뷰어) — 역할별 프로젝트/리뷰 활동 수를
// 함께 집계해서 반환한다.
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const admin = createAdminClient()

  const [{ data: users, error }, { data: projectCounts }, { data: reviewCounts }] = await Promise.all([
    admin.from('users').select('id, email, role, status, created_at').order('created_at', { ascending: false }),
    admin.from('projects').select('creator_id'),
    admin.from('project_matches').select('reviewer_id').eq('status', 'completed'),
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

  const enriched = (users ?? []).map((u) => ({
    ...u,
    project_count: projectCountByUser.get(u.id) ?? 0,
    completed_review_count: reviewCountByUser.get(u.id) ?? 0,
  }))

  return NextResponse.json({ users: enriched })
}
