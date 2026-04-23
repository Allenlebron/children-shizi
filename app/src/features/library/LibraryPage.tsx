import { Link } from 'react-router-dom'
import { listCards } from '../../content/cards'

export function LibraryPage() {
  return (
    <section className="panel-card">
      <h1>精选字卡</h1>
      <ul className="card-list">
        {listCards().map((card) => (
          <li key={card.slug}>
            <Link to={`/cards/${card.slug}`}>
              {card.character} · {card.theme}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
