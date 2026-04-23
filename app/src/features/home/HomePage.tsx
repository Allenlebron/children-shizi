import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { findCardByQuery, getDailyCard } from '../../content/cards'

export function HomePage() {
  const navigate = useNavigate()
  const dailyCard = getDailyCard()
  const [query, setQuery] = useState('')

  function openQuery(event: FormEvent) {
    event.preventDefault()
    const card = findCardByQuery(query)
    if (card) navigate(`/cards/${card.slug}`)
  }

  return (
    <section className="hero-stack">
      <article className="hero-card">
        <p className="eyebrow">今天的故事字</p>
        <h1>{dailyCard?.character}</h1>
        <p>{dailyCard?.heroLine}</p>
        <button type="button" onClick={() => navigate(`/cards/${dailyCard?.slug}`)}>
          开始今天这张卡
        </button>
      </article>

      <form className="panel-card" onSubmit={openQuery}>
        <label htmlFor="card-query">搜一个字</label>
        <input
          id="card-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">打开这个字卡</button>
      </form>
    </section>
  )
}
