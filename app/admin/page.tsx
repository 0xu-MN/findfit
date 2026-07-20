import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

async function getAdminStats() {
  const supabase: AnySupabase = createAdminClient()

  const [
    { count: pendingApplications },
    { count: pendingDistributions },
    { count: activeProjects },
    { count: pendingReview },
  ] = await Promise.all([
    supabase.from('project_matches').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('distributions').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
  ])

  return {
    pendingApplications: pendingApplications ?? 0,
    pendingDistributions: pendingDistributions ?? 0,
    activeProjects: activeProjects ?? 0,
    pendingReview: pendingReview ?? 0,
  }
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('findfit-admin-token')?.value
  if (!token || token !== process.env.ADMIN_SECRET_KEY) redirect('/admin/login')

  const stats = await getAdminStats()

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-[#1D1C1C]">FindFit</span>
          <span className="text-[10px] font-black text-white bg-[#1D1C1C] px-2 py-0.5 rounded">
            운영 패널
          </span>
        </div>
        <Link
          href="/admin/login"
          className="text-[11px] font-black text-[#999] hover:text-[#1D1C1C] transition-colors"
        >
          로그아웃
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-[#1D1C1C]">대시보드</h1>
          <p className="text-[12px] font-bold text-[#999] mt-1">운영 현황을 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="신규 지원"
            value={stats.pendingApplications}
            color="#1565C0"
            badge={stats.pendingApplications > 0 ? '처리 필요' : undefined}
          />
          <StatCard
            label="정산 대기"
            value={stats.pendingDistributions}
            color="#F77019"
            badge={stats.pendingDistributions > 0 ? '처리 필요' : undefined}
          />
          <StatCard
            label="진행 중 프로젝트"
            value={stats.activeProjects}
            color="#2E7D32"
          />
        </div>

        {/* 바로가기 */}
        <div className="grid grid-cols-2 gap-4">
          <NavCard
            href="/admin/applications"
            title="지원자 관리"
            desc="수락 · 거절 처리"
            count={stats.pendingApplications}
            color="#1565C0"
          />
          <NavCard
            href="/admin/distributions"
            title="정산 관리"
            desc="사례금 지급 완료 처리"
            count={stats.pendingDistributions}
            color="#F77019"
          />
          <NavCard
            href="/admin/requests"
            title="프로젝트 검수"
            desc="등록된 프로젝트 승인/반려"
            count={stats.pendingReview}
            color="#1565C0"
          />
          <NavCard
            href="/admin/evaluators"
            title="유저 관리"
            desc="크리에이터·리뷰어 검색/정지/탈퇴"
            count={0}
            color="#1D1C1C"
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label, value, color, badge,
}: {
  label: string; value: number; color: string; badge?: string
}) {
  return (
    <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 flex flex-col gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">{label}</span>
        {badge && (
          <span className="text-[8px] font-black text-white px-1.5 py-0.5 rounded-full" style={{ background: color }}>
            {badge}
          </span>
        )}
      </div>
      <span className="text-3xl font-black" style={{ color }}>{value}</span>
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
      className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-black text-[#1D1C1C] group-hover:text-opacity-80">{title}</p>
          <p className="text-[11px] font-bold text-[#999] mt-0.5">{desc}</p>
        </div>
        {count > 0 && (
          <span
            className="text-[11px] font-black text-white px-2 py-0.5 rounded-full"
            style={{ background: color }}
          >
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
