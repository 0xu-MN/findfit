import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

// 관리자용 프로젝트 목록(전체 status) — projects는 RLS상 소유 크리에이터만
// 조회 가능하므로 서비스 롤로 대신 조회한다. 검수 큐(pending_review)뿐
// 아니라 전체 상태를 함께 보여줘서 운영 현황 파악에 쓴다.
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('projects')
    .select(
      'id, title, one_liner, project_type, status, categories, target_count, completed_count, access_method, creator_id, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}
