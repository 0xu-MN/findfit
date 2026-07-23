import { redirect } from 'next/navigation'

// Superseded by app/builder/reports/[id]/page.tsx — kept as a redirect
// (not deleted) so any stale bookmark/link to the old URL still lands
// somewhere real instead of 404ing.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/builder/reports/${id}`)
}
