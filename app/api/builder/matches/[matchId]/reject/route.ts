import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 크리에이터가 자기 프로젝트의 지원자를 직접 거절하는 API. accept/route.ts와 동일한
// 소유권 검증 + 서비스 롤 우회 패턴을 사용한다.
async function sendRejectEmail(to: string, projectTitle: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'haloforge@haloforge.kr',
      to,
      subject: '[FindFit] 리뷰어 지원 결과 안내',
      html: `
        <p>안녕하세요,</p>
        <p><strong>${projectTitle}</strong> 프로젝트 리뷰어 지원 결과, 이번엔 함께하지 못하게 되었습니다.</p>
        <p>다른 프로젝트에서 다시 만나요!</p>
        <p>감사합니다,<br/>FindFit 팀</p>
      `,
    }),
  }).catch((e) => console.error('[Resend reject]', e))
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
    .select('id, project_id, applicant_email')
    .eq('id', matchId)
    .single()
  if (!match) return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다' }, { status: 404 })

  const { data: project } = await admin
    .from('projects')
    .select('creator_id, title')
    .eq('id', match.project_id as string)
    .single()
  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { error } = await admin.from('project_matches').update({ status: 'dropped' }).eq('id', matchId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (match.applicant_email) {
    sendRejectEmail(match.applicant_email, project.title)
  }

  return NextResponse.json({ ok: true })
}
