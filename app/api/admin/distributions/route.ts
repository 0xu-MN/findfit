import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자용 정산 내역 목록 — distributions는 RLS상 리뷰어 본인만 조회
// 가능하므로, 이미 쿠키로 인증된 관리자만 서비스 롤로 대신 조회한다.
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('distributions')
    .select('*, projects(title)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ distributions: data ?? [] })
}
