import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 크리에이터가 "자기 프로젝트"의 지원자를 직접 승인하는 API.
// 기존엔 /admin/applications(관리자 전용, ADMIN_SECRET_KEY 필요)에서만
// 승인이 가능해서, 정작 프로젝트 주인인 크리에이터는 지원자를 승인할
// 방법이 없었다 — project_matches는 RLS상 리뷰어 본인만 UPDATE 가능하므로,
// 여기서 소유권을 검증한 뒤 서비스 롤로 대신 UPDATE한다.
async function sendAcceptEmail(to: string, projectTitle: string, projectId: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  const reviewLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/evaluator/review/${projectId}`
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'haloforge@haloforge.kr',
      to,
      subject: '[FindFit] 리뷰어 지원이 수락되었습니다',
      html: `
        <p>안녕하세요!</p>
        <p><strong>${projectTitle}</strong> 프로젝트 리뷰어로 선정되셨습니다 🎉</p>
        <p>아래 링크에서 평가를 진행해 주세요:</p>
        <p><a href="${reviewLink}">${reviewLink}</a></p>
        <p>감사합니다,<br/>FindFit 팀</p>
      `,
    }),
  }).catch((e) => console.error('[Resend accept]', e))
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const admin = createAdminClient()

  const { data: match } = await admin
    .from('project_matches')
    .select('id, project_id, reviewer_id, applicant_email, status')
    .eq('id', matchId)
    .single()
  if (!match) return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다' }, { status: 404 })

  const { data: project } = await admin
    .from('projects')
    .select('creator_id, title, access_method')
    .eq('id', match.project_id as string)
    .single()
  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const isShipping = project.access_method === 'physical_shipping'

  const { error } = await admin
    .from('project_matches')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      ...(isShipping ? { shipping_status: 'pending' } : {}),
    })
    .eq('id', matchId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (match.applicant_email) {
    sendAcceptEmail(match.applicant_email, project.title, match.project_id as string)
  }

  if (match.reviewer_id) {
    await admin.from('notifications').insert({
      user_id: match.reviewer_id,
      type: 'match_accepted',
      message: `"${project.title}" 프로젝트 리뷰어로 선정되었습니다. 지금 바로 평가를 시작해보세요.`,
    })
  }

  return NextResponse.json({ ok: true })
}
