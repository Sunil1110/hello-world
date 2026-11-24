/**
 * Client for Apple's public iTunes Search API.
 * Docs: https://performance-partners.apple.com/search-api
 */

const DEFAULT_API_BASE = 'https://itunes.apple.com'

export const DEFAULT_COUNTRY = 'us'
export const DEFAULT_LIMIT = 24

/** Storefronts offered in the country picker (ISO 3166-1 alpha-2 codes). */
export const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'in', name: 'India' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'jp', name: 'Japan' },
] as const

export function isSupportedCountry(code: string): boolean {
  return COUNTRIES.some((country) => country.code === code)
}

/** An app as the UI consumes it. */
export interface AppListing {
  id: number
  name: string
  developer: string
  iconUrl: string
  genre: string
  /** Display price, e.g. "Free" or "$4.99". */
  price: string
  /** Average rating from 0 to 5, or null when the app has no ratings yet. */
  rating: number | null
  ratingCount: number
  storeUrl: string
}

/** The subset of the raw API result this app reads. */
interface RawAppResult {
  trackId?: number
  trackName?: string
  artistName?: string
  artworkUrl512?: string
  artworkUrl100?: string
  artworkUrl60?: string
  primaryGenreName?: string
  formattedPrice?: string
  price?: number
  averageUserRating?: number
  userRatingCount?: number
  trackViewUrl?: string
}

interface RawSearchResponse {
  resultCount?: number
  results?: RawAppResult[]
}

export interface SearchOptions {
  country?: string
  limit?: number
  signal?: AbortSignal
}

export class AppSearchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AppSearchError'
  }
}

function apiBase(): string {
  const configured = import.meta.env.VITE_APPSTORE_API_BASE?.trim()
  return (configured || DEFAULT_API_BASE).replace(/\/+$/, '')
}

export function buildSearchUrl(term: string, options: SearchOptions = {}): string {
  const params = new URLSearchParams({
    term,
    country: options.country ?? DEFAULT_COUNTRY,
    media: 'software',
    entity: 'software',
    limit: String(options.limit ?? DEFAULT_LIMIT),
  })
  return `${apiBase()}/search?${params}`
}

function toAppListing(raw: RawAppResult): AppListing | null {
  if (raw.trackId == null || !raw.trackName || !raw.trackViewUrl) return null

  const ratingCount = raw.userRatingCount ?? 0
  return {
    id: raw.trackId,
    name: raw.trackName,
    developer: raw.artistName ?? 'Unknown developer',
    iconUrl: raw.artworkUrl100 ?? raw.artworkUrl512 ?? raw.artworkUrl60 ?? '',
    genre: raw.primaryGenreName ?? '',
    price: raw.formattedPrice ?? (raw.price === 0 ? 'Free' : ''),
    rating: ratingCount > 0 && raw.averageUserRating != null ? raw.averageUserRating : null,
    ratingCount,
    storeUrl: raw.trackViewUrl,
  }
}

/**
 * Search the App Store for apps matching `term`.
 * Rejects with `AppSearchError` on network or API failures; aborts propagate as-is.
 */
export async function searchApps(term: string, options: SearchOptions = {}): Promise<AppListing[]> {
  const query = term.trim()
  if (!query) return []

  let response: Response
  try {
    response = await fetch(buildSearchUrl(query, options), { signal: options.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new AppSearchError('Could not reach the App Store. Check your connection and try again.', {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new AppSearchError(`The App Store search failed (HTTP ${response.status}). Try again shortly.`)
  }

  let body: RawSearchResponse
  try {
    body = (await response.json()) as RawSearchResponse
  } catch (error) {
    throw new AppSearchError('The App Store returned an unreadable response.', { cause: error })
  }

  const seen = new Set<number>()
  const apps: AppListing[] = []
  for (const raw of body.results ?? []) {
    const app = toAppListing(raw)
    if (app && !seen.has(app.id)) {
      seen.add(app.id)
      apps.push(app)
    }
  }
  return apps
}
