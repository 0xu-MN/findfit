import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/checkAdmin'
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

const DAILY_TREND_DAYS = 14

// 일자별 신규 가입자 수 + 결제 시도/성공 건수(등록 이용료 결제 기준) —
// "매일매일 유입률/결제율을 보고 싶다"는 요청에 대응. 세션/트래픽 로그가
// 따로 없어 "유입"은 가입(users.created_at) 기준으로 근사한다.
async function getDailyTrend() {
  const supabase: AnySupabase = createAdminClient()
  const since = new Date(Date.now() - DAILY_TREND_DAYS * 86400000).toISOString()

  const [{ data: users }, { data: payments }] = await Promise.all([
    supabase.from('users').select('created_at').gte('created_at', since),
    supabase.from('payments').select('created_at, status').gte('created_at', since),
  ])

  const days: string[] = []
  for (let i = DAILY_TREND_DAYS - 1; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10))
  }

  const signupsByDay = new Map<string, number>()
  for (const u of users ?? []) {
    const day = (u.created_at as string).slice(0, 10)
    signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1)
  }

  const paymentsByDay = new Map<string, { attempts: number; success: number }>()
  for (const p of payments ?? []) {
    const day = (p.created_at as string).slice(0, 10)
    const entry = paymentsByDay.get(day) ?? { attempts: 0, success: 0 }
    entry.attempts += 1
    if (p.status === 'captured' || p.status === 'waived_test') entry.success += 1
    paymentsByDay.set(day, entry)
  }

  return days.map((day) => {
    const signups = signupsByDay.get(day) ?? 0
    const pay = paymentsByDay.get(day) ?? { attempts: 0, success: 0 }
    return {
      day,
      signups,
      paymentAttempts: pay.attempts,
      paymentSuccess: pay.success,
      conversionPct: signups > 0 ? Math.round((pay.success / signups) * 100) : null,
    }
  })
}

export default async function AdminStatsPage() {
  if (!(await checkAdmin())) redirect('/admin/login')

  const [stats, dailyTrend] = await Promise.all([getActivityStats(), getDailyTrend()])

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

        <div>
          <h2 className="text-lg font-black text-[#1D1C1C]">일별 유입·결제 추이</h2>
          <p className="text-[11px] font-bold text-[#999] mt-1">
            최근 {DAILY_TREND_DAYS}일 · 유입은 가입(신규 계정) 기준 근사치, 결제율은 그날 가입자 대비
            결제 성공 건수
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#1D1C1C]/8 text-[#999] font-bold">
                <th className="text-left px-4 py-2.5">날짜</th>
                <th className="text-right px-4 py-2.5">신규 가입</th>
                <th className="text-right px-4 py-2.5">결제 시도</th>
                <th className="text-right px-4 py-2.5">결제 성공</th>
                <th className="text-right px-4 py-2.5">전환율</th>
              </tr>
            </thead>
            <tbody>
              {dailyTrend.map((row) => (
                <tr key={row.day} className="border-b border-[#1D1C1C]/5 last:border-0">
                  <td className="px-4 py-2 font-bold text-[#1D1C1C]">{row.day}</td>
                  <td className="px-4 py-2 text-right font-black">{row.signups}</td>
                  <td className="px-4 py-2 text-right text-[#666]">{row.paymentAttempts}</td>
                  <td className="px-4 py-2 text-right text-[#2E7D32] font-black">{row.paymentSuccess}</td>
                  <td className="px-4 py-2 text-right font-bold text-[#999]">
                    {row.conversionPct === null ? '—' : `${row.conversionPct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
