import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_COUNTRY, isSupportedCountry } from '../api/appStore.ts'

export interface UrlSearchState {
  term: string
  country: string
}

function readFromUrl(): UrlSearchState {
  const params = new URLSearchParams(window.location.search)
  const country = params.get('country')?.toLowerCase() ?? ''
  return {
    term: params.get('q') ?? '',
    country: isSupportedCountry(country) ? country : DEFAULT_COUNTRY,
  }
}

function writeToUrl({ term, country }: UrlSearchState) {
  const params = new URLSearchParams()
  if (term.trim()) params.set('q', term.trim())
  if (country !== DEFAULT_COUNTRY) params.set('country', country)

  const search = params.toString()
  const url = `${window.location.pathname}${search ? `?${search}` : ''}`
  if (url !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, '', url)
  }
}

/**
 * Search term and country, mirrored to the `?q=` and `?country=` URL parameters
 * so a search can be bookmarked or shared.
 */
export function useUrlSearchState(): [UrlSearchState, (next: Partial<UrlSearchState>) => void] {
  const [state, setState] = useState(readFromUrl)

  useEffect(() => {
    writeToUrl(state)
  }, [state])

  useEffect(() => {
    const onPopState = () => setState(readFromUrl())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const update = useCallback((next: Partial<UrlSearchState>) => {
    setState((current) => ({ ...current, ...next }))
  }, [])

  return [state, update]
}
