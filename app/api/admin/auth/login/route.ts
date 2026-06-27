import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()
  const secret = process.env.ADMIN_SECRET_KEY

  if (!secret || password !== secret) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('findfit-admin-token', secret, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
    sameSite: 'lax',
  })
  return res
}
