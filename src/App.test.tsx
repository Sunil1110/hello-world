import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

function appResult(id: number, name: string) {
  return {
    trackId: id,
    trackName: name,
    artistName: 'Acme Inc.',
    artworkUrl100: `https://example.com/${id}.png`,
    primaryGenreName: 'Productivity',
    formattedPrice: 'Free',
    averageUserRating: 4.5,
    userRatingCount: 3400,
    trackViewUrl: `https://apps.apple.com/us/app/id${id}`,
  }
}

function stubSearch(...responses: Array<() => Response>) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) fetchMock.mockImplementationOnce(async () => response())
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const json = (body: unknown) => () => new Response(JSON.stringify(body))

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('App', () => {
  it('shows suggestions before any search', () => {
    stubSearch()
    render(<App />)

    expect(screen.getByText('Find any app on the App Store')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Podcasts' })).toBeInTheDocument()
  })

  it('searches as the user types and lists matching apps', async () => {
    const fetchMock = stubSearch(json({ results: [appResult(1, 'Notes Pro'), appResult(2, 'Quick Notes')] }))
    render(<App />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search apps' }), 'notes')

    const link = await screen.findByRole('link', { name: 'Notes Pro' })
    expect(link).toHaveAttribute('href', 'https://apps.apple.com/us/app/id1')
    expect(screen.getByRole('link', { name: 'Quick Notes' })).toBeInTheDocument()
    expect(screen.getByText('2 apps for “notes”')).toBeInTheDocument()

    // Typing is debounced into a single request, and the search lands in the URL.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(window.location.search).toBe('?q=notes')
  })

  it('restores the search from the URL', async () => {
    window.history.replaceState(null, '', '/?q=maps&country=in')
    const fetchMock = stubSearch(json({ results: [appResult(7, 'City Maps')] }))
    render(<App />)

    expect(await screen.findByRole('link', { name: 'City Maps' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('maps')
    expect(screen.getByRole('combobox', { name: 'Storefront' })).toHaveValue('in')
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('country')).toBe('in')
  })

  it('tells the user when nothing matches', async () => {
    window.history.replaceState(null, '', '/?q=zzzz')
    stubSearch(json({ results: [] }))
    render(<App />)

    expect(await screen.findByText('No apps found for “zzzz”')).toBeInTheDocument()
  })

  it('shows an error and recovers on retry', async () => {
    window.history.replaceState(null, '', '/?q=notes')
    stubSearch(() => new Response('', { status: 500 }), json({ results: [appResult(1, 'Notes Pro')] }))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Notes Pro' })).toBeInTheDocument()
  })

  it('runs a search when a suggestion is clicked', async () => {
    const fetchMock = stubSearch(json({ results: [appResult(3, 'Cast Box')] }))
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Podcasts' }))

    expect(await screen.findByRole('link', { name: 'Cast Box' })).toBeInTheDocument()
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('term')).toBe('Podcasts')
  })
})
