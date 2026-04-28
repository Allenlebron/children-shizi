import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCardBySlug } from '../../content/cards'
import type { CardDocument } from '../../content/types'
import { speak, supportsSpeechSynthesis } from '../../lib/audio/speak'
import { loadCardDocument } from '../../lib/cards/loadCardDocument'
import { markCompleted, readProgress, toggleFavorite } from '../../lib/progress/store'

export function CardPage() {
  const navigate = useNavigate()
  const { cardId = '' } = useParams()
  const initialCurated = getCardBySlug(cardId)
  const readingFlowRef = useRef<HTMLElement | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
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
  const canPlayStory = supportsSpeechSynthesis()

  useEffect(() => {
    let cancelled = false

    const curated = getCardBySlug(cardId)
    if (curated) {
      setDocument({
        cardId: curated.slug,
        access: 'curated',
        card: curated,
      })
      setIsFavorite(readProgress()[cardId]?.favorite ?? false)
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
        setIsFavorite(nextDocument ? (readProgress()[nextDocument.cardId]?.favorite ?? false) : false)
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

  const { card, access } = document
  const snapshot = {
    cardId: document.cardId,
    character: card.character,
    source: access,
  } as const

  return (
    <article className="card-storybook">
      <header className="card-hero">
        <h1 className="card-page-title">学习页</h1>
        <div className="card-scene">
          <p className="card-section-label">故事画面</p>
          <p className="card-scene-text">{card.storyScene}</p>
        </div>
        <h2 className="card-character">{card.character}</h2>
        <p className="card-hero-line">{card.heroLine}</p>
        <div className="card-actions">
          <button
            type="button"
            disabled={!canPlayStory}
            aria-describedby={canPlayStory ? undefined : 'story-audio-hint'}
            onClick={() => speak(card.storyText)}
          >
            听这个故事
          </button>
          <button
            className="button-secondary"
            type="button"
            onClick={() => {
              readingFlowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              readingFlowRef.current?.focus({ preventScroll: true })
            }}
          >
            我来慢慢讲
          </button>
          {canPlayStory ? null : (
            <p className="card-action-hint" id="story-audio-hint">
              这个浏览器暂时不能播放故事，可以直接往下读。
            </p>
          )}
        </div>
      </header>

      <section
        className="panel-card card-story-panel"
        ref={readingFlowRef}
        tabIndex={-1}
        aria-label="慢慢讲给孩子听"
      >
        <p className="card-section-label">慢慢讲给孩子听</p>
        <p className="card-story-text">{card.storyText}</p>
      </section>

      <section className="panel-card card-story-panel">
        <h2>家长小提示</h2>
        <p>{card.parentPrompt}</p>
      </section>

      <section className="panel-card card-story-panel">
        <h2>词和句子</h2>
        <div className="card-language-grid">
          <div>
            <p className="card-mini-heading">词</p>
            <ul className="card-bullet-list">
              {card.words.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="card-mini-heading">句子</p>
            <ul className="card-bullet-list">
              {card.sentences.map((sentence) => (
                <li key={sentence}>{sentence}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel-card card-story-panel">
        <h2>互动一下</h2>
        <p>{card.activityPrompt}</p>
      </section>

      <div className="card-finish">
        <button
          className="button-secondary"
          type="button"
          onClick={() => {
            toggleFavorite(snapshot)
            setIsFavorite((currentFavorite) => !currentFavorite)
          }}
        >
          {isFavorite ? '取消收藏' : '收藏这张卡'}
        </button>
        <button
          type="button"
          onClick={() => {
            markCompleted(snapshot)
            navigate('/')
          }}
        >
          今天这张读完了
        </button>
      </div>
    </article>
  )
}
