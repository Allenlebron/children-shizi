import { Link } from 'react-router-dom'
import { readProgress } from '../../lib/progress/store'

export function ProfilePage() {
  const progress = Object.values(readProgress()).filter((entry) => entry.completed || entry.favorite)
  const completedCount = progress.filter((entry) => entry.completed).length
  const favoriteCount = progress.filter((entry) => entry.favorite).length

  return (
    <section className="panel-card profile-page">
      <p className="eyebrow">我的森林</p>
      <h1>我的</h1>
      <div className="profile-stats" aria-hidden="true">
        <div>
          <strong>{completedCount}</strong>
          <span>学过字卡</span>
        </div>
        <div>
          <strong>{favoriteCount}</strong>
          <span>收藏树叶</span>
        </div>
      </div>
      <div className="profile-summary-row">
        <p>学过 {completedCount} 张</p>
        <p>收藏 {favoriteCount} 张</p>
      </div>
      {progress.length === 0 ? <p className="page-intro">读完一张字卡后，这里会长出小树叶。</p> : null}
      <ul className="card-list profile-card-list">
        {progress.map((entry) => (
          <li className="profile-card-item" key={entry.cardId}>
            <Link to={`/cards/${entry.cardId}`}>{entry.character}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
