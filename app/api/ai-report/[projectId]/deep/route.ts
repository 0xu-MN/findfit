import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDeepAnalysis } from '@/lib/ai/generateDeepAnalysis'

// GET: 저장된 deep_analysis_data가 있으면 그대로 반환 (재생성 안 함 — 비용 절감)
export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const supabase = await createClient()
    const { data: report } = await supabase
      .from('ai_reports')
      .select('deep_analysis_data, deep_analysis_generated_at')
      .eq('project_id', projectId)
      .maybeSingle()
    return NextResponse.json({
      deepAnalysis: report?.deep_analysis_data ?? null,
      generatedAt: report?.deep_analysis_generated_at ?? null,
    })
  } catch (err) {
    console.error('[ai-report:deep:GET]', err)
    return NextResponse.json({ error: '고급 분석 조회에 실패했습니다' }, { status: 500 })
  }
}

// POST: Claude로 새로 생성. 여러 리뷰어의 답변/도메인 태그를 넘나들어
// 집계해야 하므로(개별 세션 권한으로는 불가능) 서비스 롤 클라이언트로 실행.
export async function POST(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const admin = createAdminClient()
    const report = await generateDeepAnalysis(projectId, admin)
    return NextResponse.json({
      deepAnalysis: report.deep_analysis_data,
      generatedAt: report.deep_analysis_generated_at,
    })
  } catch (err) {
    console.error('[ai-report:deep:POST]', err)
    const message = err instanceof Error ? err.message : '고급 분석 생성에 실패했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
