import ReportsSidebar from '@/components/builder/ReportsSidebar'

// 리포트 상세 라우트(/builder/reports/[id])끼리 이동할 때 이 레이아웃은
// 리마운트되지 않으므로, 좌측 목록을 여기 한 번만 마운트해서 노션처럼
// "목록은 그대로, 본문만 바뀌는" 화면을 만든다.
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10">
      <ReportsSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
