# AppstoreListing

A website for finding apps by search. Type a name, developer, or keyword and browse matching
App Store listings — icon, developer, category, price, and rating — with a link through to each
app's store page.

Search results come from Apple's public
[iTunes Search API](https://performance-partners.apple.com/search-api). No API key is needed.
This project is not affiliated with Apple.

## Features

- Search-as-you-type, debounced into a single request, with stale requests cancelled
- Storefront (country) picker
- Shareable searches: the query and storefront live in the URL (`?q=notes&country=in`)
- Loading, empty, and error states with retry
- Responsive layout with light and dark themes

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload         |
| `npm run build`     | Type-check and build for production (`dist`) |
| `npm run preview`   | Serve the production build locally           |
| `npm test`          | Run the test suite once                      |
| `npm run test:watch`| Run tests in watch mode                      |
| `npm run lint`      | Lint with oxlint                             |
| `npm run typecheck` | Type-check without building                  |

## Project structure

```
src/
  api/appStore.ts            Search API client and the AppListing type
  hooks/useAppSearch.ts      Runs searches; exposes idle/loading/success/error state
  hooks/useUrlSearchState.ts Keeps the query and storefront in sync with the URL
  hooks/useDebouncedValue.ts Debounce helper
  components/                SearchBar, SearchResults, AppCard
  App.tsx                    Page layout and wiring
  index.css                  Styles and theme tokens
```

## Configuration

Copy `.env.example` to `.env.local` to override defaults.

| Variable                 | Default                    | Purpose                                         |
| ------------------------ | -------------------------- | ----------------------------------------------- |
| `VITE_APPSTORE_API_BASE` | `https://itunes.apple.com` | Base URL of the search API (e.g. your own proxy) |

The browser calls the search API directly. Apple rate-limits it (roughly 20 requests per minute
per client), so for a high-traffic deployment put a caching proxy in front and point
`VITE_APPSTORE_API_BASE` at it.

## Tech stack

[Vite](https://vite.dev) · [React](https://react.dev) · TypeScript ·
[Vitest](https://vitest.dev) + Testing Library · [oxlint](https://oxc.rs/docs/guide/usage/linter)
