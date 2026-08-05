import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveReport } from '@/lib/ai/generateReport'
import { callClaude } from '@/lib/ai/claude'
import { buildProjectSummaryPrompt } from '@/lib/ai/prompt'
import { MIN_SHORT_ANSWER_LENGTH, CARELESS_ANSWER_PATTERN } from '@/lib/reviewValidation'

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

    // 다중계정 방지 — 휴대폰 인증 안 된 계정은 리뷰 제출 자체를 막는다
    const { data: userRow } = await supabase
      .from('users')
      .select('phone_verified_at')
      .eq('id', user.id)
      .single()
    if (!userRow?.phone_verified_at) {
      return NextResponse.json({ error: '휴대폰 인증 후 리뷰를 제출할 수 있어요. 계정 설정에서 인증해주세요.' }, { status: 403 })
    }

    // 리포트의 panel_summary(직군별 인원 집계)가 domain_tags 미입력으로
    // 거의 항상 비어 있었다(2026-07-31 확인: 5명 중 0명) — 매칭이 수락된
    // 리뷰어는 리뷰 제출 전에 반드시 관심 직군을 채우도록 게이트를 건다.
    const { data: profile } = await supabase
      .from('reviewer_profiles')
      .select('domain_tags')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!profile?.domain_tags || profile.domain_tags.length === 0) {
      return NextResponse.json({ error: '리뷰 제출 전에 관심 직군을 먼저 선택해주세요. 계정 설정에서 선택할 수 있어요.' }, { status: 403 })
    }

    // 성별도 마찬가지 — app/api/evaluator/apply/route.ts, app/api/projects/[id]/join/route.ts
    // 에 지원/참여 시점 게이트가 있지만, 초대 링크로 그 절차를 우회해 바로
    // 들어오는 경로가 생기더라도 최종적으로 여기서 한 번 더 걸러지도록 동일한
    // 안전망을 둔다(직군 게이트와 같은 이유 — 두 시점 모두에 둬야 확실함).
    const { data: userGender } = await supabase.from('users').select('gender').eq('id', user.id).maybeSingle()
    if (!userGender?.gender) {
      return NextResponse.json({ error: '리뷰 제출 전에 성별을 먼저 등록해주세요. 계정 설정에서 등록할 수 있어요.' }, { status: 403 })
    }

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

    // 관리자가 지원을 수락해도(match.status='accepted') 크리에이터가 프로젝트
    // 단위로 "리뷰 시작하기"를 눌러 status를 'reviewing'으로 넘기기 전까지는
    // 실제 리뷰 제출을 막는다 — projects 원본 테이블은 RLS상 크리에이터
    // 본인만 조회 가능하므로 리뷰어용 projects_public 뷰로 확인한다.
    const { data: projectGate } = await supabase
      .from('projects_public')
      .select('status')
      .eq('id', projectId)
      .single()
    if (projectGate?.status !== 'reviewing') {
      return NextResponse.json(
        { error: '아직 크리에이터가 리뷰를 시작하지 않았어요. 시작되면 알림으로 알려드릴게요.' },
        { status: 403 }
      )
    }

    const { data: questions } = await supabase
      .from('review_questions')
      .select('id, question_type')
      .eq('project_id', projectId)

    const questionById = new Map((questions ?? []).map((q: { id: string; question_type: string }) => [q.id, q]))
    const answerRows = Object.entries(answers)
      .filter(([qId]) => questionById.has(qId))
      .map(([qId, text]) => ({
        project_id: projectId,
        reviewer_id: user.id,
        question_id: qId,
        answer_text: text,
      }))

    if (answerRows.length === 0) {
      return NextResponse.json({ error: '유효한 답변이 없습니다' }, { status: 400 })
    }

    // 서술형 단답/성의없는 답변 차단 — 지금까지 프론트(ProjectCardExpandable.tsx의
    // MIN_SHORT_ANSWER_LENGTH/CARELESS_ANSWER_PATTERN)에만 있었고 서버엔
    // 없어서, 화면을 안 거치고 이 API를 직접 호출하면 그대로 우회됐다.
    // 검증 기준은 프론트와 반드시 동일하게 유지할 것.
    const careless = answerRows.find((row) => {
      const q = questionById.get(row.question_id)
      if (q?.question_type !== 'short_answer') return false
      const text = row.answer_text.trim()
      return text.length < MIN_SHORT_ANSWER_LENGTH || CARELESS_ANSWER_PATTERN.test(text)
    })
    if (careless) {
      return NextResponse.json({ error: '서술형 답변을 조금 더 구체적으로 작성해주세요 (최소 5자)' }, { status: 400 })
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
          const savedReport = await generateAndSaveReport(projectId, admin)
          // M-3: 리포트 생성 완료 후 프로젝트 상태 정리 — 어드민 대시보드의
          // "진행중 프로젝트" 카운트가 끝난 프로젝트까지 세던 문제.
          await admin.from('projects').update({ status: 'completed' }).eq('id', projectId)
          reportGenerated = true

          // 프로젝트 종료 시점 경량 요약 1건 — 원본 대화는 저장하지 않고
          // 이 요약만 다음 Agent 대화의 참고자료로 이관한다(§21.2/§21.4).
          try {
            const { data: projectRow } = await admin
              .from('projects')
              .select('title, problem, solution, creator_id')
              .eq('id', projectId)
              .single()
            if (projectRow?.creator_id) {
              const summaryPrompt = buildProjectSummaryPrompt(
                { title: projectRow.title, problem: projectRow.problem ?? undefined, solution: projectRow.solution ?? undefined },
                savedReport?.verdict ?? null
              )
              const summaryResult = (await callClaude(summaryPrompt, 'haiku')) as { summary?: string }
              if (summaryResult.summary) {
                await admin.from('project_summaries').insert({
                  project_id: projectId,
                  creator_id: projectRow.creator_id,
                  summary_text: summaryResult.summary,
                })
              }
            }
          } catch (summaryErr) {
            console.error('[reviews/submit] project summary generation failed', summaryErr)
            // 요약 실패해도 제출/리포트 생성 자체는 이미 성공 처리된 상태 유지
          }
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
