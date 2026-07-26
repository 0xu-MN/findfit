import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 이메일/닉네임 중복 확인 — users RLS는 본인 row만 SELECT 가능(009)이라
// 다른 사람 이메일/닉네임 존재 여부를 확인하려면 서비스 롤이 필요하다.
// 존재 여부(boolean)만 반환하고 그 외 정보는 절대 노출하지 않는다.
export async function POST(req: Request) {
  try {
    const { field, value } = (await req.json()) as { field?: 'email' | 'nickname'; value?: string }
    if (field !== 'email' && field !== 'nickname') {
      return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
    }
    const trimmed = (value ?? '').trim()
    if (!trimmed) return NextResponse.json({ error: '값을 입력해주세요' }, { status: 400 })

    // "haloforge"는 관리자 전용 식별자라 다른 사람이 이메일/닉네임에 쓸 수
    // 없게 예약한다 — 단, 실제 관리자 계정 본인의 이메일(haloforge@haloforge.kr)
    // 이나 그 계정이 쓸 닉네임(haloforge)까지 막으면 본인도 (재)가입을 못
    // 하게 되므로, 그 정확한 값 자체는 예외로 통과시킨다.
    const ADMIN_RESERVED_VALUES = ['haloforge@haloforge.kr', 'haloforge']
    const isExactAdminValue = ADMIN_RESERVED_VALUES.includes(trimmed.toLowerCase())
    if (!isExactAdminValue && trimmed.toLowerCase().includes('haloforge')) {
      return NextResponse.json({ available: false })
    }

    const admin = createAdminClient()
    const column = field === 'email' ? 'email' : 'nickname'
    const { data } = await admin.from('users').select('id').eq(column, trimmed).maybeSingle()

    return NextResponse.json({ available: !data })
  } catch (err) {
    console.error('[auth/check-availability]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
