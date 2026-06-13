import DashboardLayout from '@/components/shared/DashboardLayout'
import ReviewerFeedPage from '@/components/evaluator/ReviewerFeedPage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

export default function EvaluatorAvailablePage() {
  return (
    <DashboardLayout role="reviewer" rightPanel={<SharedLoungeFeed />}>
      <ReviewerFeedPage />
    </DashboardLayout>
  )
}
