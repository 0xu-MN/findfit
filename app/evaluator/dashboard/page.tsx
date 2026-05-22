import DashboardLayout from '@/components/shared/DashboardLayout'
import ReviewerDashboard from '@/components/evaluator/ReviewerDashboard'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function EvaluatorDashboardPage() {
  return (
    <DashboardLayout role="reviewer" rightPanel={<SharedLoungeFeed />}>
      <ReviewerDashboard />
    </DashboardLayout>
  )
}
