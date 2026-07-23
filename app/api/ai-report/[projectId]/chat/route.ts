import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/ai/gemini'

// POST: 리포트 데이터를 컨텍스트로 넘겨 자유 질문에 답하는 상태 없는(stateless)
// 채팅 — 대화 이력은 저장하지 않고 매 요청마다 report_data 전체를 다시 넘긴다.
// RLS(ai_reports_owner_select)가 프로젝트 소유자만 조회 가능하게 막아주므로
// 세션 클라이언트 그대로 사용.
export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { question } = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: '질문을 입력해주세요' }, { status: 400 })
    }

    const { data: report } = await supabase
      .from('ai_reports')
      .select('report_data')
      .eq('project_id', projectId)
      .maybeSingle()
    if (!report) return NextResponse.json({ error: '리포트를 찾을 수 없습니다' }, { status: 404 })

    const prompt = `당신은 FindFit PSF/PMF 검증 리포트를 설명해주는 분석 어시스턴트입니다.

[리포트 데이터]
${JSON.stringify(report.report_data)}

[사용자 질문]
${question}

위 리포트 데이터에 근거해서만 답하세요. 데이터에 없는 내용은 추측하지 말고
"리포트에는 해당 정보가 없어요"라고 답하세요. 2~4문장으로 간결하게 답변하세요.

아래 JSON 형식으로만 반환하세요:
{ "answer": "..." }`

    const result = (await callGemini(prompt)) as { answer?: string }
    return NextResponse.json({ answer: result.answer ?? '답변을 생성하지 못했어요.' })
  } catch (err) {
    console.error('[ai-report:chat:POST]', err)
    return NextResponse.json({ error: '답변 생성에 실패했습니다' }, { status: 500 })
  }
}
