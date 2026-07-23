import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveReport } from '@/lib/ai/generateReport'

const DAILY_REGENERATE_CAP = 3

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// POST: 실제 review_answers를 조회해 리포트를 생성/재생성하고 ai_reports에 저장.
// 여러 리뷰어의 답변을 넘나들어 집계해야 하므로(개별 리뷰어 세션 권한으로는
// review_answers를 자기 것만 읽을 수 있어 불가능) 서비스 롤 클라이언트로 실행한다.
// 비용 상한(프로젝트당 하루 3회, 최초 자동 생성 포함)은 report_regenerate_logs로 카운트.
export async function POST(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const admin = createAdminClient()

    const date = today()
    const { data: log } = await admin
      .from('report_regenerate_logs')
      .select('count')
      .eq('project_id', projectId)
      .eq('date', date)
      .maybeSingle()
    if (log && log.count >= DAILY_REGENERATE_CAP) {
      return NextResponse.json({ error: '오늘 리포트 생성 횟수를 다 쓰셨어요, 내일 다시 시도해주세요' }, { status: 429 })
    }

    const report = await generateAndSaveReport(projectId, admin)

    await admin
      .from('report_regenerate_logs')
      .upsert({ project_id: projectId, date, count: (log?.count ?? 0) + 1 }, { onConflict: 'project_id,date' })

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
