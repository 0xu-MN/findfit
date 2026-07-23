import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callGemini } from '@/lib/ai/gemini'

const DAILY_CHAT_CAP = 15
const MAX_QUESTION_LENGTH = 200
const MAX_OUTPUT_TOKENS = 300

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// POST: 리포트 데이터를 컨텍스트로 넘겨 자유 질문에 답하는 상태 없는(stateless)
// 채팅 — 대화 이력은 저장하지 않고 매 요청마다 report_data 전체를 다시 넘긴다.
// RLS(ai_reports_owner_select)가 프로젝트 소유자만 조회 가능하게 막아주므로
// 세션 클라이언트 그대로 사용. 비용 상한(프로젝트당 하루 15회)은
// report_chat_logs로 카운트.
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
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: `질문은 ${MAX_QUESTION_LENGTH}자 이내로 입력해주세요` }, { status: 400 })
    }

    // report_chat_logs는 RLS만 켜져 있고 정책이 없어(서비스 롤 전용) admin
    // 클라이언트로 카운트를 관리한다 — 세션 쪽에서 직접 조작 못 하게.
    const admin = createAdminClient()
    const date = today()
    const { data: log } = await admin
      .from('report_chat_logs')
      .select('count')
      .eq('project_id', projectId)
      .eq('date', date)
      .maybeSingle()

    if (log && log.count >= DAILY_CHAT_CAP) {
      return NextResponse.json({ error: '오늘 질문 횟수를 다 쓰셨어요, 내일 다시 시도해주세요' }, { status: 429 })
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

    const result = (await callGemini(prompt, { maxOutputTokens: MAX_OUTPUT_TOKENS })) as { answer?: string }

    await admin
      .from('report_chat_logs')
      .upsert({ project_id: projectId, date, count: (log?.count ?? 0) + 1 }, { onConflict: 'project_id,date' })

    return NextResponse.json({ answer: result.answer ?? '답변을 생성하지 못했어요.' })
  } catch (err) {
    console.error('[ai-report:chat:POST]', err)
    return NextResponse.json({ error: '답변 생성에 실패했습니다' }, { status: 500 })
  }
}
