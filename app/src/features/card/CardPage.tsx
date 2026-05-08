import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCardBySlug } from '../../content/cards'
import type { CardDocument } from '../../content/types'
import { loadCardDocument } from '../../lib/cards/loadCardDocument'
import { PagedReadingFlow } from './PagedReadingFlow'

export function CardPage() {
  const navigate = useNavigate()
  const { cardId = '' } = useParams()
  const initialCurated = getCardBySlug(cardId)
  const [document, setDocument] = useState<CardDocument | null>(() =>
    initialCurated
      ? {
          cardId: initialCurated.slug,
          access: 'curated',
          card: initialCurated,
        }
      : null,
  )
  const [isLoading, setIsLoading] = useState(!initialCurated)

  useEffect(() => {
    let cancelled = false

    const curated = getCardBySlug(cardId)
    if (curated) {
      setDocument({
        cardId: curated.slug,
        access: 'curated',
        card: curated,
      })
      setIsLoading(false)
      return () => {
        cancelled = true
      }
    }

    setIsLoading(true)
    setDocument(null)

    loadCardDocument(cardId)
      .then((nextDocument) => {
        if (cancelled) {
          return
        }

        setDocument(nextDocument)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [cardId])

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
