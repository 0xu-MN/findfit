import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 크리에이터 홈 / 리뷰어 대시보드 히어로 배너 — 공개 조회(active만).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const placement = searchParams.get('placement')
  if (!placement) return NextResponse.json({ banners: [] })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ad_banners')
    .select('*')
    .eq('placement', placement)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ banners: [] })
  return NextResponse.json({ banners: data ?? [] })
}
