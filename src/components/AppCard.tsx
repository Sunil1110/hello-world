import type { AppListing } from '../api/appStore.ts'

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function AppCard({ app }: { app: AppListing }) {
  const meta = [app.genre, app.price].filter(Boolean).join(' · ')

  return (
    <li className="app-card">
      {app.iconUrl ? (
        <img className="app-card__icon" src={app.iconUrl} alt="" width={72} height={72} loading="lazy" />
      ) : (
        <div className="app-card__icon app-card__icon--empty" aria-hidden="true" />
      )}
      <div className="app-card__body">
        <h3 className="app-card__name">
          <a href={app.storeUrl} target="_blank" rel="noreferrer">
            {app.name}
          </a>
        </h3>
        <p className="app-card__developer">{app.developer}</p>
        {meta && <p className="app-card__meta">{meta}</p>}
        <p className="app-card__rating">
          {app.rating == null ? (
            'No ratings yet'
          ) : (
            <>
              <span aria-hidden="true">★ </span>
              <span className="visually-hidden">Rated </span>
              {app.rating.toFixed(1)}
              <span className="visually-hidden"> out of 5</span>
              <span className="app-card__rating-count">
                {' '}
                ({compactNumber.format(app.ratingCount)}
                <span className="visually-hidden"> ratings</span>)
              </span>
            </>
          )}
        </p>
      </div>
    </li>
  )
}
