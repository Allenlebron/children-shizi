import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { findCardByQuery, getDailyCard } from '../../content/cards'
import { generateCard, resolveSearch } from '../../lib/api/client'
import { rememberPreviewToken } from '../../lib/preview-token'
import { readReviewSummary } from '../../lib/progress/store'

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dailyCard = getDailyCard()!
  const [query, setQuery] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const reviewSummary = readReviewSummary()
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
    <section className="hero-stack home-forest">
      <article className="hero-card hero-card-daily">
        <span className="storybook-blob storybook-blob-one" aria-hidden="true" />
        <span className="storybook-blob storybook-blob-two" aria-hidden="true" />
        <p className="eyebrow">森林识字队 · 今天的故事字</p>
        <div className="mission-row" aria-hidden="true">
          <span>今日小任务</span>
          <span>约 5 分钟</span>
        </div>
        <h1 className="hero-character">{dailyCard.character}</h1>
        <p className="hero-line">{dailyCard.heroLine}</p>
        <p className="home-helper">跟着故事看画面、听一听、说一说，慢慢认识这个字。</p>
        <button type="button" onClick={() => navigate(`/cards/${dailyCard.slug}`)}>
          开始今天这张卡
        </button>
      </article>

      <article className="panel-card review-entry-card">
        <span className="review-entry-leaf" aria-hidden="true">
          叶
        </span>
        <div>
          <p className="eyebrow">小树叶闯关 · 轻复习</p>
          <h2>今天复习 3 个字</h2>
          <p className="home-helper">看画面和词语，帮孩子把刚认识的字再找回来。</p>
          <p className="review-entry-progress">今天已收集 {reviewSummary.todayLeaves} 片</p>
        </div>
        <button type="button" onClick={() => navigate('/review')}>
          开始复习小闯关
        </button>
      </article>

      <form className="panel-card search-card" onSubmit={openQuery}>
        <div className="section-header-row">
          <label htmlFor="card-query">搜一个字</label>
          <span className="soft-badge" aria-hidden="true">
            找新树叶
          </span>
        </div>
        <input
          id="card-query"
          placeholder="比如：水、火、木"
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
