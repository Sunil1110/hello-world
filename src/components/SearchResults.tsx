import type { SearchState } from '../hooks/useAppSearch.ts'
import { AppCard } from './AppCard.tsx'

const SUGGESTIONS = ['Photo editor', 'Budget tracker', 'Podcasts', 'Meditation', 'Language learning']
const SKELETON_COUNT = 9

interface SearchResultsProps {
  state: SearchState
  onSuggestion: (term: string) => void
  onRetry: () => void
}

export function SearchResults({ state, onSuggestion, onRetry }: SearchResultsProps) {
  if (state.status === 'idle') {
    return (
      <section className="notice" aria-label="Suggestions">
        <p className="notice__title">Find any app on the App Store</p>
        <p className="notice__text">Start typing above, or try one of these:</p>
        <ul className="chips">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button type="button" className="chip" onClick={() => onSuggestion(suggestion)}>
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  if (state.status === 'loading') {
    return (
      <section aria-busy="true">
        <p className="results__summary" role="status">
          Searching for “{state.term}”…
        </p>
        <ul className="results__grid" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <li key={index} className="app-card app-card--skeleton">
              <div className="app-card__icon" />
              <div className="app-card__body">
                <div className="skeleton-line skeleton-line--wide" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line--narrow" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="notice" role="alert">
        <p className="notice__title">Search failed</p>
        <p className="notice__text">{state.message}</p>
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      </section>
    )
  }

  if (state.apps.length === 0) {
    return (
      <section className="notice" role="status">
        <p className="notice__title">No apps found for “{state.term}”</p>
        <p className="notice__text">Check the spelling, try a broader keyword, or switch storefront.</p>
      </section>
    )
  }

  return (
    <section>
      <p className="results__summary" role="status">
        {state.apps.length} {state.apps.length === 1 ? 'app' : 'apps'} for “{state.term}”
      </p>
      <ul className="results__grid">
        {state.apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </ul>
    </section>
  )
}
