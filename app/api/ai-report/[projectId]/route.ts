import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveReport } from '@/lib/ai/generateReport'

// POST: 실제 review_answers를 조회해 리포트를 생성/재생성하고 ai_reports에 저장.
// 여러 리뷰어의 답변을 넘나들어 집계해야 하므로(개별 리뷰어 세션 권한으로는
// review_answers를 자기 것만 읽을 수 있어 불가능) 서비스 롤 클라이언트로 실행한다.
export async function POST(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const admin = createAdminClient()
    const report = await generateAndSaveReport(projectId, admin)
    return NextResponse.json({ report })
  } catch (err) {
    console.error('[ai-report:POST]', err)
    const message = err instanceof Error ? err.message : 'Report generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET: 저장된 ai_reports row 조회 (없으면 report: null)
export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const supabase = await createClient()
    const { data: report } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
    return NextResponse.json({ report: report ?? null })
  } catch (err) {
    console.error('[ai-report:GET]', err)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
