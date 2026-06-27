import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

async function sendRejectEmail(to: string, projectTitle: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'haloforge@haloforge.kr',
      to,
      subject: '[FindFit] 리뷰어 지원 안내',
      html: `
        <p>안녕하세요!</p>
        <p><strong>${projectTitle}</strong> 프로젝트 리뷰어 지원에 감사드립니다.</p>
        <p>이번에는 매칭이 어려웠지만, 다른 프로젝트에서 뵐 수 있기를 기대합니다.</p>
        <p>감사합니다,<br/>FindFit 팀</p>
      `,
    }),
  }).catch((e) => console.error('[Resend reject]', e))
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const { id } = await context.params
  const supabase: AnySupabase = await createClient()

  const { data: match } = await supabase
    .from('project_matches')
    .select('applicant_email, projects(title)')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다' }, { status: 404 })

  await supabase
    .from('project_matches')
    .update({ status: 'dropped' })
    .eq('id', id)

  // fire-and-forget
  if (match.applicant_email) {
    sendRejectEmail(match.applicant_email, match.projects?.title ?? '프로젝트')
  }

  return NextResponse.json({ ok: true })
}
