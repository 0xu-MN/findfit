import DashboardLayout from '@/components/shared/DashboardLayout'
import ProjectListPage from '@/components/builder/ProjectListPage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function BuilderProjectsPage() {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <ProjectListPage />
    </DashboardLayout>
  )
}
