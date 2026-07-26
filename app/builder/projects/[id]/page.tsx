import CreatorLayout from '@/components/creator/CreatorLayout'
import ProjectDetailPage from '@/components/builder/ProjectDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BuilderProjectDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <CreatorLayout>
      <ProjectDetailPage projectId={id} />
    </CreatorLayout>
  )
}
