import { redirect } from 'next/navigation'

// Superseded by the admin distributions queue (app/admin/distributions) —
// there's no per-project distribution page in the new flow, so this just
// sends any stale link to the admin list instead of 404ing.
export default function Page() {
  redirect('/admin/distributions')
}
