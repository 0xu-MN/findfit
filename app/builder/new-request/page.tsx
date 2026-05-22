import DashboardLayout from '@/components/shared/DashboardLayout'
import NewRequestPage from '@/components/builder/NewRequestPage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function BuilderNewRequestPage() {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <NewRequestPage />
    </DashboardLayout>
  )
}
