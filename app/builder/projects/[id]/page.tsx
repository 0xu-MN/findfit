import DashboardLayout from '@/components/shared/DashboardLayout'
import ProjectDetailPage from '@/components/builder/ProjectDetailPage'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BuilderProjectDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <DashboardLayout role="creator" rightPanel={<SharedLoungeFeed />}>
      <ProjectDetailPage projectId={id} />
    </DashboardLayout>
  )
}
