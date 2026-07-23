import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

const ACTIVITY_WINDOW_DAYS = 7

// "지금 몇 명이 쓰고 있나"를 측정할 세션/로그인 이벤트 테이블이 따로 없어서,
// 최근 N일 내 실제 행동(프로젝트 등록/지원/제출)을 남긴 distinct 유저 수로
// 근사한다 — role 컬럼은 계정당 1개로 고정이라 크리에이터/리뷰어 활동을
// 겹치지 않고 명확하게 나눌 수 있다.
async function getActivityStats() {
  const supabase: AnySupabase = createAdminClient()
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86400000).toISOString()

  const [
    { count: totalCreators },
    { count: totalReviewers },
    { data: activeProjectCreators },
    { data: activeMatchReviewers },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'builder'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'evaluator'),
    supabase.from('projects').select('creator_id').gte('created_at', since),
    supabase
      .from('project_matches')
      .select('reviewer_id')
      .or(`applied_at.gte.${since},submitted_at.gte.${since}`),
  ])

  const activeCreators = new Set((activeProjectCreators ?? []).map((r: { creator_id: string }) => r.creator_id)).size
  const activeReviewers = new Set((activeMatchReviewers ?? []).map((r: { reviewer_id: string }) => r.reviewer_id)).size

  return {
    totalCreators: totalCreators ?? 0,
    totalReviewers: totalReviewers ?? 0,
    activeCreators,
    activeReviewers,
  }
}

export default async function AdminStatsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  if (!token || token !== process.env.ADMIN_SECRET_KEY) redirect('/admin/login')

  const stats = await getActivityStats()

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-[#1D1C1C]">활동 통계</h1>
          <p className="text-[12px] font-bold text-[#999] mt-1">
            최근 {ACTIVITY_WINDOW_DAYS}일 내 실제 활동(등록·지원·제출)이 있었던 유저 수 기준
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ActivityCard
            title="크리에이터"
            active={stats.activeCreators}
            total={stats.totalCreators}
            color="#F77019"
          />
          <ActivityCard
            title="리뷰어"
            active={stats.activeReviewers}
            total={stats.totalReviewers}
            color="#1565C0"
          />
        </div>

        <div className="rounded-2xl bg-[#1565C0]/5 border border-[#1565C0]/15 p-4">
          <p className="text-[10px] font-bold text-[#1565C0] leading-relaxed">
            현재는 관리자 패널에서만 보이는 지표입니다. 사용자 화면에 공개 통계로 노출하려면 별도 협의가
            필요합니다.
          </p>
        </div>
      </main>
    </div>
  )
}

function ActivityCard({
  title, active, total, color,
}: {
  title: string; active: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((active / total) * 100) : 0
  return (
    <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">{title}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black" style={{ color }}>{active}</span>
        <span className="text-[11px] font-bold text-[#999]">/ 전체 {total}명</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-bold text-[#999]">최근 활동 비율 {pct}%</span>
    </div>
  )
}
