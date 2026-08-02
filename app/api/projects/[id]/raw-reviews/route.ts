import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 크리에이터가 AI 요약이 아니라 리뷰어가 실제로 제출한 답변 원문을 문항별로
// 그대로 볼 수 있게 하는 라우트 — AI 리포트와는 별개 화면(리포트 이미지의
// "참고 레퍼런스"처럼 AI가 재가공한 게 아니라 원본 그대로). 리뷰어 개인정보
// (이름/닉네임/이메일)는 절대 노출하지 않고, 성별/나이/직군만 "리뷰어 A"
// 식 익명 라벨과 함께 보여준다 — lib/ai/prompt.ts의 reviewerTag()와 동일한
// 명명 규칙(순서대로 A, B, C...)을 여기서도 그대로 따른다.
function reviewerTag(index: number): string {
  return `리뷰어 ${String.fromCharCode(65 + (index % 26))}`
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, creator_id')
    .eq('id', projectId)
    .single()
  if (!project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  if (project.creator_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

  // 여러 리뷰어의 답변을 넘나들어 조회해야 해서(개별 리뷰어 세션 권한으로는
  // review_answers를 자기 것만 읽을 수 있음) 서비스 롤로 조회한다 — 위에서
  // 이미 요청자가 이 프로젝트의 크리에이터 본인인지 확인했으므로 안전하다.
  const admin = createAdminClient()
  const [{ data: questions }, { data: answers }] = await Promise.all([
    admin
      .from('review_questions')
      .select('id, question_text, question_type, order_index')
      .eq('project_id', projectId)
      .order('order_index'),
    admin
      .from('review_answers')
      .select('reviewer_id, question_id, answer_text')
      .eq('project_id', projectId),
  ])

  const qById = new Map((questions ?? []).map((q) => [q.id, q]))
  const byReviewer = new Map<string, { question_text: string; question_type: string; order_index: number; answer_text: string }[]>()
  for (const a of answers ?? []) {
    if (!a.reviewer_id || !a.question_id) continue
    const q = qById.get(a.question_id)
    if (!q) continue
    const bucket = byReviewer.get(a.reviewer_id) ?? []
    bucket.push({ question_text: q.question_text, question_type: q.question_type, order_index: q.order_index, answer_text: a.answer_text })
    byReviewer.set(a.reviewer_id, bucket)
  }

  const reviewerIds = Array.from(byReviewer.keys())
  const [{ data: users }, { data: profiles }] = reviewerIds.length
    ? await Promise.all([
        admin.from('users').select('id, gender, birth_date').in('id', reviewerIds),
        admin.from('reviewer_profiles').select('user_id, domain_tags').in('user_id', reviewerIds),
      ])
    : [{ data: [] }, { data: [] }]

  const genderById = new Map((users ?? []).map((u) => [u.id, u.gender as string | null]))
  const ageById = new Map(
    (users ?? []).map((u) => [
      u.id,
      u.birth_date ? Math.floor((Date.now() - new Date(u.birth_date as string).getTime()) / (365.25 * 86400000)) : null,
    ])
  )
  const domainById = new Map((profiles ?? []).map((p) => [p.user_id, p.domain_tags as string[] | null]))

  const reviewers = reviewerIds.map((id, i) => ({
    reviewerTag: reviewerTag(i),
    gender: genderById.get(id) === 'male' ? '남성' : genderById.get(id) === 'female' ? '여성' : null,
    age: ageById.get(id) ?? null,
    jobDomain: domainById.get(id) ?? [],
    answers: (byReviewer.get(id) ?? []).sort((a, b) => a.order_index - b.order_index),
  }))

  return NextResponse.json({ projectTitle: project.title, reviewers })
}
