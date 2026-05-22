import DashboardLayout from '@/components/shared/DashboardLayout'
import CreatorDashboard from '@/components/builder/CreatorDashboard'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function BuilderDashboardPage() {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <CreatorDashboard />
    </DashboardLayout>
  )
}
