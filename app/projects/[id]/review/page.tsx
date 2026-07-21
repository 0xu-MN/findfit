import { redirect } from 'next/navigation'

// Superseded by app/evaluator/review/[id]/page.tsx — kept as a redirect
// (not deleted) so any stale bookmark/link to the old URL still lands
// somewhere real instead of 404ing.
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/evaluator/review/${params.id}`)
}
