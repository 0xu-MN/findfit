import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10)
}

// POST: 프로젝트 소유자(크리에이터)의 공유 링크를 가져오거나(있으면) 새로 만든다.
// RLS(report_shares_owner_all)가 project_id의 creator_id === auth.uid()인
// 경우만 허용하므로, 세션 클라이언트 그대로 사용해도 안전하다.
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'projectId가 필요합니다' }, { status: 400 })

    const { data: existing } = await supabase
      .from('report_shares')
      .select('slug')
      .eq('project_id', projectId)
      .maybeSingle()

    if (existing) return NextResponse.json({ slug: existing.slug })

    // project_id에 UNIQUE 제약이 있어(마이그레이션 024), 개발 모드의 StrictMode
    // 이중 마운트 등으로 동시에 두 번 호출돼도 하나만 insert되고 나머지는
    // 23505(duplicate) 에러가 나는데, 그 경우 그냥 다시 조회해서 반환한다.
    for (let i = 0; i < 5; i++) {
      const slug = generateSlug()
      const { data: created, error } = await supabase
        .from('report_shares')
        .insert({ project_id: projectId, slug })
        .select('slug')
        .single()
      if (!error) return NextResponse.json({ slug: created.slug })
      if (error.code === '23505') {
        const { data: raceWinner } = await supabase
          .from('report_shares')
          .select('slug')
          .eq('project_id', projectId)
          .maybeSingle()
        if (raceWinner) return NextResponse.json({ slug: raceWinner.slug })
        continue // slug 자체가 충돌난 경우 — 다른 slug로 재시도
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: '공유 링크 생성에 실패했습니다' }, { status: 500 })
  } catch (err) {
    console.error('[reports/share:POST]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
