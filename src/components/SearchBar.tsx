import type { FormEvent } from 'react'
import { COUNTRIES } from '../api/appStore.ts'

interface SearchBarProps {
  term: string
  country: string
  onTermChange: (term: string) => void
  onCountryChange: (country: string) => void
}

export function SearchBar({ term, country, onTermChange, onCountryChange }: SearchBarProps) {
  const onSubmit = (event: FormEvent) => event.preventDefault()

  return (
    <form className="search-bar" role="search" onSubmit={onSubmit}>
      <label className="visually-hidden" htmlFor="app-search">
        Search apps
      </label>
      <div className="search-bar__field">
        <svg className="search-bar__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" />
        </svg>
        <input
          id="app-search"
          className="search-bar__input"
          type="search"
          name="q"
          value={term}
          onChange={(event) => onTermChange(event.target.value)}
          placeholder="Search apps by name, developer, or keyword"
          autoComplete="off"
          autoFocus
        />
      </div>

      <label className="visually-hidden" htmlFor="app-country">
        Storefront
      </label>
      <select
        id="app-country"
        className="search-bar__country"
        value={country}
        onChange={(event) => onCountryChange(event.target.value)}
      >
        {COUNTRIES.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </form>
  )
}
