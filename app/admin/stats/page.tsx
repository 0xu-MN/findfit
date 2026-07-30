import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// 세션/로그인 이벤트를 남기는 테이블이 따로 없어서 "지금 몇 명이 쓰고
// 있나"를 완벽하게 실시간 측정할 수는 없다 — 대신 실제 행동(프로젝트
// 등록/지원/제출)의 타임스탬프를 여러 창(5분/오늘/7일)으로 나눠서
// 근사한다. 창이 좁을수록 "지금 활동 중"에 더 가깝다.
const WINDOWS = [
  { key: 'now', label: '지금(5분 이내)', ms: 5 * 60 * 1000 },
  { key: 'today', label: '오늘', ms: 24 * 60 * 60 * 1000 },
  { key: 'week', label: '최근 7일', ms: 7 * 24 * 60 * 60 * 1000 },
] as const

async function getActivityStats() {
  const supabase: AnySupabase = createAdminClient()

  const [{ count: totalCreators }, { count: totalReviewers }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'builder'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'evaluator'),
  ])

  // 가장 넓은 창(7일)만 조회해서 메모리에서 좁은 창을 다시 필터링 —
  // 창마다 매번 쿼리 3번씩(총 9번) 날릴 필요 없이 1번으로 끝낸다.
  const since7d = new Date(Date.now() - WINDOWS[2].ms).toISOString()
  const [{ data: projectRows }, { data: matchRows }] = await Promise.all([
    supabase.from('projects').select('creator_id, created_at').gte('created_at', since7d),
    supabase.from('project_matches').select('reviewer_id, applied_at, submitted_at').or(`applied_at.gte.${since7d},submitted_at.gte.${since7d}`),
  ])

  const byWindow = WINDOWS.map((w) => {
    const cutoff = Date.now() - w.ms
    const creators = new Set(
      (projectRows ?? [])
        .filter((r: { created_at: string }) => new Date(r.created_at).getTime() >= cutoff)
        .map((r: { creator_id: string }) => r.creator_id)
    )
    const reviewers = new Set(
      (matchRows ?? [])
        .filter((r: { applied_at: string | null; submitted_at: string | null }) => {
          const a = r.applied_at ? new Date(r.applied_at).getTime() : 0
          const s = r.submitted_at ? new Date(r.submitted_at).getTime() : 0
          return a >= cutoff || s >= cutoff
        })
        .map((r: { reviewer_id: string }) => r.reviewer_id)
    )
    return { key: w.key, label: w.label, activeCreators: creators.size, activeReviewers: reviewers.size }
  })

  return { totalCreators: totalCreators ?? 0, totalReviewers: totalReviewers ?? 0, byWindow }
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

// 프로젝트별 참여 세부현황 — "신청은 했는데 실제로 참여 안 하는 사람이
// 있는지" 확인용. active/reviewing 상태 프로젝트만 대상으로, 매칭
// status별 인원수를 함께 보여준다.
type ProjectParticipation = {
  id: string; title: string; status: string; targetCount: number
  pending: number; accepted: number; completed: number; dropped: number; notYetSubmitted: number
}

async function getProjectParticipation(): Promise<ProjectParticipation[]> {
  const supabase: AnySupabase = createAdminClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, target_count, completed_count, created_at')
    .in('status', ['active', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(30)

  if (!projects || projects.length === 0) return []

  const ids = projects.map((p: { id: string }) => p.id)
  const { data: matches } = await supabase
    .from('project_matches')
    .select('project_id, status')
    .in('project_id', ids)

  const byProject = new Map<string, { pending: number; accepted: number; completed: number; dropped: number }>()
  for (const m of matches ?? []) {
    const entry = byProject.get(m.project_id) ?? { pending: 0, accepted: 0, completed: 0, dropped: 0 }
    if (m.status === 'pending') entry.pending += 1
    else if (m.status === 'accepted') entry.accepted += 1
    else if (m.status === 'completed') entry.completed += 1
    else if (m.status === 'dropped') entry.dropped += 1
    byProject.set(m.project_id, entry)
  }

  return projects.map((p: { id: string; title: string; status: string; target_count: number; completed_count: number }) => {
    const counts = byProject.get(p.id) ?? { pending: 0, accepted: 0, completed: 0, dropped: 0 }
    // "신청은 했는데 아직 리뷰 안 낸" 사람 — accepted인데 completed로 안
    // 넘어간 매칭 수(= 수락됐지만 리뷰 미제출, 이탈 후보로 볼 수 있음)
    const notYetSubmitted = counts.accepted
    return { id: p.id, title: p.title, status: p.status, targetCount: p.target_count, ...counts, notYetSubmitted }
  })
}

export default async function AdminStatsPage() {
  if (!(await checkAdmin())) redirect('/admin/login')

  const [stats, dailyTrend, participation] = await Promise.all([
    getActivityStats(),
    getDailyTrend(),
    getProjectParticipation(),
  ])

  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black admin-text">활동 통계</h1>
          <p className="text-[12px] font-bold admin-text-dim mt-1">
            세션 로그가 없어 실제 행동(등록·지원·제출) 시각 기준으로 근사한 활동 유저 수입니다
          </p>
        </div>

        {/* 실시간/오늘/이번 주 활동 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.byWindow.map((w) => (
            <div key={w.key} className="admin-card rounded-3xl border admin-border p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-black admin-text-dim uppercase tracking-wider">{w.label}</span>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-[#F77019]">{w.activeCreators}</span>
                  <span className="text-[9px] font-bold admin-text-dim">크리에이터 / 전체 {stats.totalCreators}명</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-[#189DF7]">{w.activeReviewers}</span>
                  <span className="text-[9px] font-bold admin-text-dim">리뷰어 / 전체 {stats.totalReviewers}명</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-black admin-text">일별 유입·결제 추이</h2>
          <p className="text-[11px] font-bold admin-text-dim mt-1">
            최근 {DAILY_TREND_DAYS}일 · 유입은 가입(신규 계정) 기준 근사치, 결제율은 그날 가입자 대비
            결제 성공 건수
          </p>
        </div>

        <div className="admin-card rounded-3xl border admin-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b admin-border admin-text-dim font-bold">
                <th className="text-left px-4 py-2.5">날짜</th>
                <th className="text-right px-4 py-2.5">신규 가입</th>
                <th className="text-right px-4 py-2.5">결제 시도</th>
                <th className="text-right px-4 py-2.5">결제 성공</th>
                <th className="text-right px-4 py-2.5">전환율</th>
              </tr>
            </thead>
            <tbody>
              {dailyTrend.map((row) => (
                <tr key={row.day} className="border-b admin-border last:border-0">
                  <td className="px-4 py-2 font-bold admin-text">{row.day}</td>
                  <td className="px-4 py-2 text-right font-black">{row.signups}</td>
                  <td className="px-4 py-2 text-right admin-text-mid">{row.paymentAttempts}</td>
                  <td className="px-4 py-2 text-right text-[#2E7D32] font-black">{row.paymentSuccess}</td>
                  <td className="px-4 py-2 text-right font-bold admin-text-dim">
                    {row.conversionPct === null ? '—' : `${row.conversionPct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 프로젝트별 참여 세부현황 */}
        <div>
          <h2 className="text-lg font-black admin-text">진행 중 프로젝트 참여 세부현황</h2>
          <p className="text-[11px] font-bold admin-text-dim mt-1">
            수락됐지만 아직 리뷰를 제출하지 않은 인원(이탈 후보)을 함께 보여줍니다
          </p>
        </div>

        <div className="admin-card rounded-3xl border admin-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto">
          {participation.length === 0 ? (
            <p className="text-[11px] font-bold admin-text-dim text-center py-8">진행 중인 프로젝트가 없습니다</p>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b admin-border admin-text-dim font-bold">
                  <th className="text-left px-4 py-2.5">프로젝트</th>
                  <th className="text-right px-4 py-2.5">목표</th>
                  <th className="text-right px-4 py-2.5">대기</th>
                  <th className="text-right px-4 py-2.5">수락(미제출)</th>
                  <th className="text-right px-4 py-2.5">완료</th>
                  <th className="text-right px-4 py-2.5">이탈</th>
                </tr>
              </thead>
              <tbody>
                {participation.map((p) => (
                  <tr key={p.id} className="border-b admin-border last:border-0">
                    <td className="px-4 py-2 font-bold admin-text truncate max-w-[240px]">{p.title}</td>
                    <td className="px-4 py-2 text-right admin-text-mid">{p.targetCount}</td>
                    <td className="px-4 py-2 text-right admin-text-mid">{p.pending}</td>
                    <td className="px-4 py-2 text-right font-black" style={{ color: p.notYetSubmitted > 0 ? '#F77019' : undefined }}>
                      {p.notYetSubmitted}
                    </td>
                    <td className="px-4 py-2 text-right text-[#2E7D32] font-black">{p.completed}</td>
                    <td className="px-4 py-2 text-right admin-text-dim">{p.dropped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
