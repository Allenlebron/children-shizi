import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCardBySlug } from '../../content/cards'
import type { CardDocument } from '../../content/types'
import { loadCardDocument } from '../../lib/cards/loadCardDocument'
import { PagedReadingFlow } from './PagedReadingFlow'

export function CardPage() {
  const navigate = useNavigate()
  const { cardId = '' } = useParams()
  const curatedCard = getCardBySlug(cardId)
  const curatedDocument: CardDocument | null = curatedCard
    ? {
        cardId: curatedCard.slug,
        access: 'curated',
        card: curatedCard,
      }
    : null
  const [loadedDocument, setLoadedDocument] = useState<CardDocument | null>(null)
  const [settledCardId, setSettledCardId] = useState<string | null>(curatedCard ? cardId : null)
  const document =
    curatedDocument ?? (loadedDocument?.cardId === cardId ? loadedDocument : null)
  const isLoading = !curatedDocument && settledCardId !== cardId

  useEffect(() => {
    if (curatedCard) {
      return
    }

    let cancelled = false

    loadCardDocument(cardId)
      .then((nextDocument) => {
        if (cancelled) {
          return
        }

        setLoadedDocument(nextDocument)
        setSettledCardId(cardId)
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setLoadedDocument(null)
        setSettledCardId(cardId)
      })

    return () => {
      cancelled = true
    }
  }, [cardId, curatedCard])

  if (isLoading) {
    return (
      <section className="panel-card card-missing">
        <p className="eyebrow">学习页</p>
        <p>正在把这张字卡拿给你...</p>
      </section>
    )
  }

  if (!document) {
    return (
      <section className="panel-card card-missing">
        <p className="eyebrow">学习页</p>
        <h1>这张字卡还在路上</h1>
        <p>先回首页，我们从今天准备好的故事开始。</p>
        <button type="button" onClick={() => navigate('/')}>
          回首页看看
        </button>
      </section>
    )
  }

  return <PagedReadingFlow document={document} />
}
