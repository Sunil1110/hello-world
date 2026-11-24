import { describe, expect, it, vi } from 'vitest'
import { AppSearchError, buildSearchUrl, searchApps } from './appStore.ts'

function mockFetch(body: unknown, init: ResponseInit = {}) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const rawApp = {
  trackId: 1,
  trackName: 'Notes Pro',
  artistName: 'Acme Inc.',
  artworkUrl100: 'https://example.com/icon-100.png',
  primaryGenreName: 'Productivity',
  formattedPrice: 'Free',
  averageUserRating: 4.62,
  userRatingCount: 1200,
  trackViewUrl: 'https://apps.apple.com/us/app/notes-pro/id1',
}

describe('buildSearchUrl', () => {
  it('targets the software search endpoint with defaults', () => {
    const url = new URL(buildSearchUrl('photo editor'))

    expect(url.origin + url.pathname).toBe('https://itunes.apple.com/search')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      term: 'photo editor',
      country: 'us',
      media: 'software',
      entity: 'software',
      limit: '24',
    })
  })

  it('honours country and limit options', () => {
    const url = new URL(buildSearchUrl('maps', { country: 'in', limit: 5 }))

    expect(url.searchParams.get('country')).toBe('in')
    expect(url.searchParams.get('limit')).toBe('5')
  })
})

describe('searchApps', () => {
  it('returns no apps for a blank term without calling the API', async () => {
    const fetchMock = mockFetch({ results: [] })

    await expect(searchApps('   ')).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps API results to app listings', async () => {
    const fetchMock = mockFetch({ resultCount: 1, results: [rawApp] })

    const apps = await searchApps('  notes ')

    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('term')).toBe('notes')
    expect(apps).toEqual([
      {
        id: 1,
        name: 'Notes Pro',
        developer: 'Acme Inc.',
        iconUrl: 'https://example.com/icon-100.png',
        genre: 'Productivity',
        price: 'Free',
        rating: 4.62,
        ratingCount: 1200,
        storeUrl: 'https://apps.apple.com/us/app/notes-pro/id1',
      },
    ])
  })

  it('reports a null rating for apps with no ratings', async () => {
    mockFetch({ results: [{ ...rawApp, averageUserRating: 0, userRatingCount: 0 }] })

    const [app] = await searchApps('notes')

    expect(app.rating).toBeNull()
  })

  it('drops duplicate and incomplete results', async () => {
    mockFetch({
      results: [rawApp, rawApp, { trackName: 'No id' }, { ...rawApp, trackId: 2, trackViewUrl: undefined }],
    })

    const apps = await searchApps('notes')

    expect(apps.map((app) => app.id)).toEqual([1])
  })

  it('throws AppSearchError on a non-OK response', async () => {
    mockFetch({}, { status: 503 })

    await expect(searchApps('notes')).rejects.toThrow(AppSearchError)
    await expect(searchApps('notes')).rejects.toThrow(/503/)
  })

  it('throws AppSearchError when the network request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(searchApps('notes')).rejects.toThrow(AppSearchError)
  })

  it('lets aborts propagate unchanged', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('Aborted', 'AbortError')
      }),
    )

    await expect(searchApps('notes')).rejects.toMatchObject({ name: 'AbortError' })
  })
})
