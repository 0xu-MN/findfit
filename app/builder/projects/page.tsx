import { Suspense } from 'react'
import CreatorLayout from '@/components/creator/CreatorLayout'
import ProjectsWorkspace from '@/components/creator/ProjectsWorkspace'

export default function BuilderProjectsPage() {
  return (
    <CreatorLayout>
      <Suspense fallback={<div className="w-full h-64 rounded-3xl bg-white animate-pulse" />}>
        <ProjectsWorkspace />
      </Suspense>
    </CreatorLayout>
  )
}
