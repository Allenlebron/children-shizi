import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { findCardByQuery, getDailyCard } from '../../content/cards'
import { generateCard, resolveSearch } from '../../lib/api/client'
import { rememberPreviewToken } from '../../lib/preview-token'

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dailyCard = getDailyCard()!
  const [query, setQuery] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const trimmedQuery = query.trim()

  useEffect(() => {
    const previewToken = searchParams.get('previewToken')

    if (previewToken) {
      rememberPreviewToken(previewToken)
    }
  }, [searchParams])

  async function openQuery(event: FormEvent) {
    event.preventDefault()
    if (!trimmedQuery || isSearching) {
      return
    }

    const card = findCardByQuery(trimmedQuery)
    if (card) {
      setStatusMessage('')
      navigate(`/cards/${card.slug}`)
      return
    }

    setIsSearching(true)

    try {
      const resolved = await resolveSearch(trimmedQuery)

      if (resolved.status === 'unsupported') {
        setStatusMessage('首版暂不支持这个字')
        return
      }

      if (resolved.status === 'ready_private' || resolved.status === 'ready_public') {
        setStatusMessage('')
        navigate(`/cards/${resolved.cardId}`)
        return
      }

      setStatusMessage('正在为你准备...')

      const generated = await generateCard(trimmedQuery)

      if (generated.status === 'ready_private') {
        setStatusMessage('')
        navigate(`/cards/${generated.cardId}`)
        return
      }

      setStatusMessage('这个字还没准备好')
    } catch {
      setStatusMessage('网络有点忙，请再试一次')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <section className="hero-stack">
      <article className="hero-card">
        <p className="eyebrow">今天的故事字</p>
        <h1>{dailyCard.character}</h1>
        <p>{dailyCard.heroLine}</p>
        <button type="button" onClick={() => navigate(`/cards/${dailyCard.slug}`)}>
          开始今天这张卡
        </button>
      </article>

      <form className="panel-card" onSubmit={openQuery}>
        <label htmlFor="card-query">搜一个字</label>
        <input
          id="card-query"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (statusMessage) {
              setStatusMessage('')
            }
          }}
        />
        <button type="submit" disabled={!trimmedQuery || isSearching}>
          {isSearching ? '正在准备...' : '打开这个字卡'}
        </button>
        {statusMessage ? (
          <p className="field-hint" role="status" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </form>
    </section>
  )
}
