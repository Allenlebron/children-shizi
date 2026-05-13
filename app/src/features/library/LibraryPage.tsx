import { Link } from 'react-router-dom'
import { listCards } from '../../content/cards'

export function LibraryPage() {
  return (
    <section className="panel-card library-page">
      <p className="eyebrow">森林书架</p>
      <h1>精选字卡</h1>
      <p className="page-intro">挑一张字卡，像翻绘本一样慢慢读。</p>
      <ul className="card-list library-card-list">
        {listCards().map((card) => (
          <li className="library-card-item" key={card.slug}>
            <Link
              aria-label={`${card.character} · ${card.theme}`}
              className="library-card-link"
              to={`/cards/${card.slug}`}
            >
              <span className="library-hanzi">{card.character}</span>
              <span className="library-theme">{card.theme}</span>
              <span className="library-action">打开故事</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
