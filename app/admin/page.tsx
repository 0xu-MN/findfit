import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/checkAdmin'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

const TREND_DAYS = 7
const CATEGORY_COLORS = ['#F77019', '#189DF7', '#8B5CF6', '#2E7D32', '#F5B400', '#EF4444', '#999999']

async function getAdminStats() {
  const supabase: AnySupabase = createAdminClient()
  const since = new Date(Date.now() - TREND_DAYS * 86400000).toISOString()

  const [
    { count: pendingApplications },
    { count: pendingDistributions },
    { count: activeProjects },
    { count: pendingReview },
    { count: totalCreators },
    { count: totalReviewers },
    { data: categories },
    { data: recentUsers },
    { data: recentPayments },
    { data: capturedPayments },
  ] = await Promise.all([
    supabase.from('project_matches').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('distributions').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
    supabase.from('projects').select('id', { count: 'exact', head: true }).in('status', ['active', 'reviewing']),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'builder'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'evaluator'),
    supabase.from('projects').select('categories'),
    supabase.from('users').select('created_at').gte('created_at', since),
    supabase.from('payments').select('created_at, status').gte('created_at', since),
    supabase.from('payments').select('amount').in('status', ['captured', 'waived_test']),
  ])

  // 분야별 프로젝트 분포 — 카테고리는 배열(복수 선택 가능)이라 각 항목을
  // 개별 집계한다.
  const categoryCounts = new Map<string, number>()
  for (const p of (categories ?? []) as { categories: string[] | null }[]) {
    for (const c of p.categories ?? []) {
      categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1)
    }
  }
  const categoryBreakdown = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count], i) => ({ name, count, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))

  // 최근 N일 일별 가입자 수(막대 그래프용)
  const days: string[] = []
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10))
  }
  const signupsByDay = new Map<string, number>()
  for (const u of (recentUsers ?? []) as { created_at: string }[]) {
    const day = u.created_at.slice(0, 10)
    signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1)
  }
  const dailySignups = days.map((day) => ({ day, count: signupsByDay.get(day) ?? 0 }))

  const recentPaymentAttempts = (recentPayments ?? []).length
  const recentPaymentSuccess = (recentPayments ?? []).filter(
    (p: { status: string }) => p.status === 'captured' || p.status === 'waived_test'
  ).length

  const totalRevenue = (capturedPayments ?? []).reduce((sum: number, p: { amount: number }) => sum + (p.amount ?? 0), 0)

  return {
    pendingApplications: pendingApplications ?? 0,
    pendingDistributions: pendingDistributions ?? 0,
    activeProjects: activeProjects ?? 0,
    pendingReview: pendingReview ?? 0,
    totalCreators: totalCreators ?? 0,
    totalReviewers: totalReviewers ?? 0,
    categoryBreakdown,
    dailySignups,
    recentPaymentAttempts,
    recentPaymentSuccess,
    totalRevenue,
  }
}

export default async function AdminDashboardPage() {
  if (!(await checkAdmin())) redirect('/admin/login')

  const stats = await getAdminStats()
  const maxSignup = Math.max(1, ...stats.dailySignups.map((d) => d.count))
  const categoryTotal = stats.categoryBreakdown.reduce((s, c) => s + c.count, 0) || 1
  const paymentConversionPct = stats.recentPaymentAttempts > 0
    ? Math.round((stats.recentPaymentSuccess / stats.recentPaymentAttempts) * 100)
    : 0

  // 도넛 차트 — conic-gradient로 각 카테고리 비중을 표현(별도 차트
  // 라이브러리 없이 CSS만으로 구현).
  let acc = 0
  const gradientStops = stats.categoryBreakdown.map((c) => {
    const start = (acc / categoryTotal) * 360
    acc += c.count
    const end = (acc / categoryTotal) * 360
    return `${c.color} ${start}deg ${end}deg`
  })
  const donutBackground = gradientStops.length
    ? `conic-gradient(${gradientStops.join(', ')})`
    : 'conic-gradient(#333 0deg 360deg)'

  return (
    <div className="min-h-screen text-white">
      {/* 사이드바는 app/admin/layout.tsx가 모든 /admin/* 페이지에 공통으로
          씌워준다 — 예전엔 이 페이지만 따로 사이드바를 그려서, 대시보드는
          새 디자인인데 나머지 페이지는 옛날 흰 배경 그대로인 불일치가 있었다. */}
      <main className="px-8 py-8 flex flex-col gap-6 max-w-[1200px]">
        <div>
          <h1 className="text-xl font-black">대시보드</h1>
          <p className="text-[12px] font-bold text-white/40 mt-1">운영 현황을 한눈에 확인하세요</p>
        </div>

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="신규 지원" value={stats.pendingApplications} color="#189DF7" urgent={stats.pendingApplications > 0} />
          <KpiCard label="정산 대기" value={stats.pendingDistributions} color="#F77019" urgent={stats.pendingDistributions > 0} />
          <KpiCard label="검수 대기" value={stats.pendingReview} color="#F5B400" urgent={stats.pendingReview > 0} />
          <KpiCard label="진행 중 프로젝트" value={stats.activeProjects} color="#2E7D32" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="전체 크리에이터" value={stats.totalCreators} color="#F77019" />
          <KpiCard label="전체 리뷰어" value={stats.totalReviewers} color="#189DF7" />
          <KpiCard label={`최근 ${TREND_DAYS}일 결제 전환율`} value={`${paymentConversionPct}%`} color="#8B5CF6" />
          <KpiCard label="누적 결제액(원)" value={stats.totalRevenue.toLocaleString()} color="#2E7D32" />
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          {/* 일별 신규가입 막대그래프 */}
          <div className="bg-[#15171C] rounded-3xl border border-white/5 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-black text-white/80">최근 {TREND_DAYS}일 신규가입 추이</span>
              <Link href="/admin/stats" className="text-[10px] font-bold text-[#F77019] hover:underline">자세히 →</Link>
            </div>
            <div className="flex items-end justify-between gap-2 h-36">
              {stats.dailySignups.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-28">
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#F77019] to-[#F5B400] transition-all"
                      style={{ height: `${Math.max(4, (d.count / maxSignup) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-white/40">{d.day.slice(5)}</span>
                  <span className="text-[10px] font-black text-white/70">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 분야별 프로젝트 분포 도넛 */}
          <div className="bg-[#15171C] rounded-3xl border border-white/5 p-6 flex flex-col gap-4">
            <span className="text-[12px] font-black text-white/80">분야별 프로젝트 분포</span>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-[11px] font-bold text-white/30 py-8 text-center">아직 데이터가 없어요</p>
            ) : (
              <div className="flex items-center gap-5">
                <div
                  className="w-28 h-28 rounded-full flex-shrink-0"
                  style={{ background: donutBackground, boxShadow: 'inset 0 0 0 10px #15171C' }}
                />
                <div className="flex flex-col gap-1.5 min-w-0">
                  {stats.categoryBreakdown.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-white/70 truncate">{c.name}</span>
                      <span className="text-white/40 ml-auto">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 바로가기 */}
        <div>
          <span className="text-[12px] font-black text-white/80">바로가기</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            <NavCard href="/admin/applications" title="지원자 관리" desc="수락 · 거절 처리" count={stats.pendingApplications} color="#189DF7" />
            <NavCard href="/admin/distributions" title="정산 관리" desc="사례금 지급 완료 처리" count={stats.pendingDistributions} color="#F77019" />
            <NavCard href="/admin/requests" title="프로젝트 검수" desc="등록된 프로젝트 승인/반려" count={stats.pendingReview} color="#F5B400" />
            <NavCard href="/admin/insights" title="인사이트 관리" desc="피드 · 뉴스룸 글 작성/수정" count={0} color="#8B5CF6" />
            <NavCard href="/admin/banners" title="배너 광고 관리" desc="홈 · 대시보드 배너 작성/교체" count={0} color="#8B5CF6" />
            <NavCard href="/admin/evaluators" title="유저 관리" desc="크리에이터·리뷰어 검색/정지/탈퇴" count={0} color="#1D1C1C" />
          </div>
        </div>
      </main>
    </div>
  )
}

function KpiCard({ label, value, color, urgent }: { label: string; value: number | string; color: string; urgent?: boolean }) {
  return (
    <div className="bg-[#15171C] rounded-2xl border border-white/5 p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">{label}</span>
        {urgent && <span className="text-[8px] font-black text-white px-1.5 py-0.5 rounded-full" style={{ background: color }}>처리 필요</span>}
      </div>
      <span className="text-2xl font-black" style={{ color }}>{value}</span>
    </div>
  )
}

function NavCard({
  href, title, desc, count, color,
}: {
  href: string; title: string; desc: string; count: number; color: string
}) {
  return (
    <Link
      href={href}
      className="bg-[#15171C] rounded-2xl border border-white/5 p-5 flex flex-col gap-3 hover:border-white/15 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-black text-white/90">{title}</p>
          <p className="text-[11px] font-bold text-white/40 mt-0.5">{desc}</p>
        </div>
        {count > 0 && (
          <span className="text-[11px] font-black text-white px-2 py-0.5 rounded-full" style={{ background: color }}>
            {count}
          </span>
        )}
      </div>
      <span className="text-[11px] font-black self-end" style={{ color }}>
        바로가기 →
      </span>
    </Link>
  )
}
