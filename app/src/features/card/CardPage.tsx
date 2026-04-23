import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCardBySlug } from '../../content/cards'
import { speak, supportsSpeechSynthesis } from '../../lib/audio/speak'

export function CardPage() {
  const navigate = useNavigate()
  const { slug = '' } = useParams()
  const readingFlowRef = useRef<HTMLElement | null>(null)
  const card = getCardBySlug(slug)
  const canPlayStory = supportsSpeechSynthesis()

  if (!card) {
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
        <button type="button" onClick={() => navigate('/')}>
          今天这张读完了
        </button>
      </div>
    </article>
  )
}
