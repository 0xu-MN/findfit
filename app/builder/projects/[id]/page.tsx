import DashboardLayout from '@/components/shared/DashboardLayout'
import ProjectDetailPage from '@/components/builder/ProjectDetailPage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

interface Props {
  params: { id: string }
}

export default function BuilderProjectDetailPage({ params }: Props) {
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <ProjectDetailPage projectId={params.id} />
    </DashboardLayout>
  )
}
