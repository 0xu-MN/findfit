import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveReport } from '@/lib/ai/generateReport'

// 리뷰 제출 전체 파이프라인을 서버 트랜잭션 성격으로 하나의 라우트에 묶는다
// (C-1): 이전엔 브라우저가 review_answers insert → project_matches 갱신 →
// increment_completed_count RPC → 완료 체크 → /api/ai-report POST까지
// 4~5번 왕복했다. 이 중 하나라도 실패(탭 닫힘/네트워크 끊김)하면 "완료됐는데
// 리포트가 안 나오는" 상태가 될 수 있었다. 지금은 브라우저가 이 라우트 하나만
// 호출하면, 완료율 도달 여부 판단과 리포트 생성(및 M-3: projects.status
// 갱신)까지 서버에서 순서대로 처리한다.
export async function POST(
  req: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params
    const { answers } = (await req.json()) as { answers?: Record<string, string> }
    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: '답변이 없습니다' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    // project_matches RLS(reviewer_id=auth.uid())가 이미 본인 row만 보이도록
    // 걸러주지만, matchId가 애초에 남의 것이면 select 자체가 0건 → 아래에서 404.
    const { data: match } = await supabase
      .from('project_matches')
      .select('id, project_id, reviewer_id, submitted_at')
      .eq('id', matchId)
      .single()

    if (!match || !match.project_id) return NextResponse.json({ error: '참여 정보를 찾을 수 없습니다' }, { status: 404 })
    if (match.reviewer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    if (match.submitted_at) return NextResponse.json({ error: '이미 제출된 리뷰입니다' }, { status: 400 })
    const projectId = match.project_id

    const { data: questions } = await supabase
      .from('review_questions')
      .select('id')
      .eq('project_id', projectId)

    const questionIds = new Set((questions ?? []).map((q: { id: string }) => q.id))
    const answerRows = Object.entries(answers)
      .filter(([qId]) => questionIds.has(qId))
      .map(([qId, text]) => ({
        project_id: projectId,
        reviewer_id: user.id,
        question_id: qId,
        answer_text: text,
      }))

    if (answerRows.length === 0) {
      return NextResponse.json({ error: '유효한 답변이 없습니다' }, { status: 400 })
    }

    const { error: insertErr } = await supabase.from('review_answers').insert(answerRows)
    if (insertErr) {
      console.error('[reviews/submit] answer insert failed', insertErr)
      return NextResponse.json({ error: '제출 중 오류가 발생했습니다' }, { status: 500 })
    }

    await supabase
      .from('project_matches')
      .update({ submitted_at: new Date().toISOString(), status: 'completed' })
      .eq('id', matchId)

    // increment_completed_count가 갱신 후의 실제 값을 반환(migration 010)하므로,
    // 브라우저가 들고 있던 stale한 completed_count에 기대지 않고 이 값으로
    // 완료율 도달 여부를 판단한다.
    const { data: newCompletedCount, error: rpcErr } = await supabase.rpc('increment_completed_count', {
      project_id: projectId,
    })
    if (rpcErr) console.error('[reviews/submit] increment_completed_count failed', rpcErr)

    let reportGenerated = false
    if (typeof newCompletedCount === 'number') {
      const admin = createAdminClient()
      const { data: proj } = await admin
        .from('projects')
        .select('target_count')
        .eq('id', projectId)
        .single()

      if (proj && newCompletedCount >= proj.target_count) {
        try {
          await generateAndSaveReport(projectId, admin)
          // M-3: 리포트 생성 완료 후 프로젝트 상태 정리 — 어드민 대시보드의
          // "진행중 프로젝트" 카운트가 끝난 프로젝트까지 세던 문제.
          await admin.from('projects').update({ status: 'completed' }).eq('id', projectId)
          reportGenerated = true
        } catch (err) {
          console.error('[reviews/submit] report generation failed', err)
          // 리포트 생성 실패해도 제출 자체는 성공 처리 — Builder 리포트
          // 페이지 방문 시 fallback으로 재생성 가능(app/builder/reports/[id]).
        }
      }
    }

    return NextResponse.json({ ok: true, reportGenerated })
  } catch (err) {
    console.error('[reviews/submit]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
