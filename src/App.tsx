import { useState } from 'react'
import { SearchBar } from './components/SearchBar.tsx'
import { SearchResults } from './components/SearchResults.tsx'
import { useAppSearch } from './hooks/useAppSearch.ts'
import { useDebouncedValue } from './hooks/useDebouncedValue.ts'
import { useUrlSearchState } from './hooks/useUrlSearchState.ts'

const SEARCH_DEBOUNCE_MS = 350

export default function App() {
  const [{ term, country }, setSearch] = useUrlSearchState()
  const [retryToken, setRetryToken] = useState(0)

  // Debounce typing, but react instantly when the box is cleared.
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS)
  const activeTerm = term.trim() ? debouncedTerm : ''
  const state = useAppSearch(activeTerm, country, retryToken)

  return (
    <div className="page">
      <header className="header">
        <h1 className="header__brand">
          Appstore<span>Listing</span>
        </h1>
        <p className="header__tagline">Search the App Store and browse app listings.</p>
        <SearchBar
          term={term}
          country={country}
          onTermChange={(next) => setSearch({ term: next })}
          onCountryChange={(next) => setSearch({ country: next })}
        />
      </header>

      <main className="main">
        <SearchResults
          state={state}
          onSuggestion={(suggestion) => setSearch({ term: suggestion })}
          onRetry={() => setRetryToken((token) => token + 1)}
        />
      </main>

      <footer className="footer">
        Results come from Apple’s public iTunes Search API. This site is not affiliated with Apple.
      </footer>
    </div>
  )
}
