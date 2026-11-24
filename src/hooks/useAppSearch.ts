import { useEffect, useState } from 'react'
import { searchApps, type AppListing } from '../api/appStore.ts'

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; term: string }
  | { status: 'success'; term: string; apps: AppListing[] }
  | { status: 'error'; term: string; message: string }

interface Settled {
  key: string
  state: SearchState
}

/**
 * Runs an app search whenever `term` or `country` changes.
 * In-flight requests are aborted when the inputs change, so stale results never land.
 * `retryToken` re-runs the same search when it changes.
 */
export function useAppSearch(term: string, country: string, retryToken = 0): SearchState {
  const query = term.trim()
  const key = `${country}\n${query}\n${retryToken}`
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (!query) return

    const controller = new AbortController()
    searchApps(query, { country, signal: controller.signal })
      .then((apps) => {
        setSettled({ key, state: { status: 'success', term: query, apps } })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Something went wrong.'
        setSettled({ key, state: { status: 'error', term: query, message } })
      })

    return () => controller.abort()
  }, [query, country, key])

  if (!query) return { status: 'idle' }
  if (settled?.key === key) return settled.state
  return { status: 'loading', term: query }
}
