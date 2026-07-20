import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  return !!token && token === process.env.ADMIN_SECRET_KEY
}

async function sendPaidEmail(to: string, projectTitle: string, netAmount: number) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'haloforge@haloforge.kr',
      to,
      subject: '[FindFit] 사례금이 지급되었습니다',
      html: `
        <p>안녕하세요!</p>
        <p><strong>${projectTitle}</strong> 프로젝트 리뷰에 참여해 주셔서 감사합니다.</p>
        <p>사례금 <strong>${netAmount.toLocaleString('ko-KR')}원</strong>이 지급되었습니다.</p>
        <p>입금까지 1~2 영업일이 소요될 수 있습니다.</p>
        <p>감사합니다,<br/>FindFit 팀</p>
      `,
    }),
  }).catch((e) => console.error('[Resend paid]', e))
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const { id } = await context.params
  const supabase: AnySupabase = createAdminClient()

  const { data: dist } = await supabase
    .from('distributions')
    .select('net_amount, projects(title), reviewer_id')
    .eq('id', id)
    .single()

  if (!dist) return NextResponse.json({ error: '정산 내역을 찾을 수 없습니다' }, { status: 404 })

  await supabase
    .from('distributions')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('id', id)

  // 리뷰어 이메일 조회
  if (dist.reviewer_id) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', dist.reviewer_id)
      .single()

    if (user?.email) {
      sendPaidEmail(
        user.email,
        dist.projects?.title ?? '프로젝트',
        dist.net_amount ?? dist.amount ?? 0
      )
    }
  }

  return NextResponse.json({ ok: true })
}
