import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { listCards } from '../../content/cards'

export function LibraryPage() {
  const cards = listCards()

  return (
    <section className="panel-card library-page">
      <div className="library-heading-block">
        <p className="eyebrow">森林书架</p>
        <h1>森林小书架</h1>
        <p className="page-intro">挑一本喜欢的小字卡，像翻绘本一样慢慢读。</p>
      </div>
      <ul className="card-list library-card-list library-shelf" aria-label="精选故事字卡">
        {cards.map((card, index) => (
          <li
            className="library-card-item"
            key={card.slug}
            style={{ '--library-card-index': index } as CSSProperties}
          >
            <Link
              aria-label={`${card.character} · ${card.theme}`}
              className="library-card-link library-cover"
              to={`/cards/${card.slug}`}
            >
              <span className="library-cover-label" aria-hidden="true">
                小字卡
              </span>
              <span className="library-hanzi">{card.character}</span>
              <span className="library-theme">{card.theme}</span>
              <span className="library-action">翻开故事</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
