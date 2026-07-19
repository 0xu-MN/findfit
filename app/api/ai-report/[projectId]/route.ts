import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAndSaveReport } from '@/lib/ai/generateReport'

// POST: 실제 review_answers를 조회해 리포트를 생성/재생성하고 ai_reports에 저장
export async function POST(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const supabase = await createClient()
    const report = await generateAndSaveReport(projectId, supabase)
    return NextResponse.json({ report })
  } catch (err) {
    console.error('[ai-report:POST]', err)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
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
