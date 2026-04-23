import { listCards } from '../../content/cards'
import { readProgress } from '../../lib/progress/store'

export function ProfilePage() {
  const progress = readProgress()
  const cardsWithProgress = listCards().filter((card) => {
    const entry = progress[card.slug]
    return entry?.completed || entry?.favorite
  })
  const completedCount = cardsWithProgress.filter((card) => progress[card.slug]?.completed).length
  const favoriteCount = cardsWithProgress.filter((card) => progress[card.slug]?.favorite).length

  return (
    <section className="panel-card">
      <h1>我的</h1>
      <p>学过 {completedCount} 张</p>
      <p>收藏 {favoriteCount} 张</p>
      <ul className="card-list">
        {cardsWithProgress.map((card) => (
          <li key={card.slug}>{card.character}</li>
        ))}
      </ul>
    </section>
  )
}
