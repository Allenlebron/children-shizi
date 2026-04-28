import { Link } from 'react-router-dom'
import { readProgress } from '../../lib/progress/store'

export function ProfilePage() {
  const progress = Object.values(readProgress()).filter((entry) => entry.completed || entry.favorite)
  const completedCount = progress.filter((entry) => entry.completed).length
  const favoriteCount = progress.filter((entry) => entry.favorite).length

  return (
    <section className="panel-card">
      <h1>我的</h1>
      <p>学过 {completedCount} 张</p>
      <p>收藏 {favoriteCount} 张</p>
      <ul className="card-list">
        {progress.map((entry) => (
          <li key={entry.cardId}>
            <Link to={`/cards/${entry.cardId}`}>{entry.character}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
