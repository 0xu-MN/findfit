import { NextResponse } from 'next/server'
import { getTrendLine } from '@/lib/agent/naverTrends'

export async function POST(req: Request) {
  try {
    const { category } = (await req.json()) as { category?: string }
    const line = await getTrendLine(category ?? 'default')
    return NextResponse.json({ line })
  } catch (err) {
    console.error('[agent/trend]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
