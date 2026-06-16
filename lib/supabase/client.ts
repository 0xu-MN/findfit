import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// When Supabase env vars are not configured (local dev), return a no-op stub
// so pages fail gracefully (empty data / null user) instead of crashing.
function createStub() {
  const nullResult = { data: null, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeChain = (): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (..._: any[]) => makeChain()
    fn.then = (resolve: (v: typeof nullResult) => unknown) =>
      Promise.resolve(nullResult).then(resolve)
    return new Proxy(fn, {
      get: (_, key) => {
        if (key === 'then') return fn.then
        return makeChain()
      },
    })
  }
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: () => makeChain(),
    rpc: () => makeChain(),
  }
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!url || !key) return createStub() as unknown as ReturnType<typeof createBrowserClient<Database>>
  return createBrowserClient<Database>(url, key)
}
