import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardDocument } from '../../content/types'
import { speak, supportsSpeechSynthesis } from '../../lib/audio/speak'
import { markCompleted, readProgress, toggleFavorite } from '../../lib/progress/store'
import { StrokeOrderAnimation } from './StrokeOrderAnimation'

type ReadingStepKey = 'scene' | 'story' | 'character' | 'language' | 'activity' | 'finish'

type PagedReadingFlowProps = {
  document: CardDocument
}

const steps: Array<{ key: ReadingStepKey; label: string }> = [
  { key: 'scene', label: '看画面' },
  { key: 'story', label: '听故事' },
  { key: 'character', label: '认这个字' },
  { key: 'language', label: '读词句' },
  { key: 'activity', label: '互动一下' },
  { key: 'finish', label: '完成' },
]

function getSafeList(items: string[], fallback: string) {
  return items.length > 0 ? items : [fallback]
}

export function PagedReadingFlow({ document }: PagedReadingFlowProps) {
  const navigate = useNavigate()
  const { card, access } = document
  const [stepIndex, setStepIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(
    () => readProgress()[document.cardId]?.favorite ?? false,
  )
  const canPlayStory = supportsSpeechSynthesis()
  const currentStep = steps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1
  const snapshot = {
    cardId: document.cardId,
    character: card.character,
    source: access,
  } as const

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  function finishCard() {
    markCompleted(snapshot)
    navigate('/')
  }

  function toggleCardFavorite() {
    toggleFavorite(snapshot)
    setIsFavorite((currentFavorite) => !currentFavorite)
  }

  function playText(text: string) {
    speak(text)
  }

  return (
    <article className="paged-reading" aria-label={`${card.character} 的绘本识字流程`}>
      <header className="reading-topbar">
        <p
          className="reading-progress-pill"
          aria-label={`阅读进度 ${stepIndex + 1} / ${steps.length}，${currentStep.label}`}
        >
          {stepIndex + 1} / {steps.length} · {currentStep.label}
        </p>
      </header>

      <section className={`reading-page-card reading-page-${currentStep.key}`} key={currentStep.key}>
        <span className="storybook-blob reading-blob-one" aria-hidden="true" />
        <span className="storybook-blob reading-blob-two" aria-hidden="true" />
        {currentStep.key === 'scene' ? (
          <>
            <p className="card-section-label">故事画面</p>
            {card.comic ? (
              <>
                <figure className="reading-comic-frame">
                  <img src={card.comic.imageSrc} alt={card.comic.alt} />
                  <figcaption>{card.comic.caption}</figcaption>
                </figure>
                <div className="reading-comic-questions" aria-label="看图小问题">
                  {card.comic.questions.map((question) => (
                    <p key={question}>{question}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="reading-scene-box">
                <p>{card.storyScene || '我们先看一看这幅小画面。'}</p>
              </div>
            )}
            <h1 className="reading-character">{card.character}</h1>
            <p className="reading-hero-line">{card.heroLine || `今天认识“${card.character}”。`}</p>
          </>
        ) : null}

        {currentStep.key === 'story' ? (
          <>
            <h1 className="reading-page-heading">听 / 讲故事</h1>
            <p className="reading-story-text">{card.storyText || '这一页我们慢慢看图说一说。'}</p>
            <div className="reading-action-grid">
              <button
                type="button"
                disabled={!canPlayStory}
                aria-describedby={canPlayStory ? undefined : 'story-audio-hint'}
                onClick={() => speak(card.storyText)}
              >
                听这个故事
              </button>
              <button className="button-secondary" type="button">
                我来慢慢讲
              </button>
            </div>
            {canPlayStory ? null : (
              <p className="card-action-hint" id="story-audio-hint">
                这个浏览器暂时不能播放故事，可以直接读给孩子听。
              </p>
            )}
          </>
        ) : null}

        {currentStep.key === 'character' ? (
          <>
            <p className="card-section-label">认这个字</p>
            <h1 className="reading-character reading-character-large">{card.character}</h1>
            <p className="reading-pinyin">{card.pinyin}</p>
            <StrokeOrderAnimation character={card.character} />
            <div className="reading-parent-note">
              <p>{card.parentPrompt || '先和孩子一起看画面，再慢慢说出这个字。'}</p>
            </div>
          </>
        ) : null}

        {currentStep.key === 'language' ? (
          <>
            <h1 className="reading-page-heading">词和句子</h1>
            <div className="reading-language-section">
              <p className="card-mini-heading">词</p>
              <ul className="reading-pill-list">
                {getSafeList(card.words, `关于“${card.character}”的词`).map((word) => (
                  <li key={word}>
                    <button
                      className="reading-read-button reading-word-button"
                      type="button"
                      disabled={!canPlayStory}
                      aria-label={`点读 ${word}`}
                      aria-describedby={canPlayStory ? undefined : 'language-audio-hint'}
                      onClick={() => playText(word)}
                    >
                      <span>{word}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="reading-language-section">
              <p className="card-mini-heading">句子</p>
              <ul className="card-bullet-list">
                {getSafeList(card.sentences, '这一段我们先慢慢看图说一说。').map((sentence) => (
                  <li key={sentence}>
                    <button
                      className="reading-read-button reading-sentence-button"
                      type="button"
                      disabled={!canPlayStory}
                      aria-label={`点读 ${sentence}`}
                      aria-describedby={canPlayStory ? undefined : 'language-audio-hint'}
                      onClick={() => playText(sentence)}
                    >
                      <span>{sentence}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {canPlayStory ? null : (
              <p className="card-action-hint" id="language-audio-hint">
                这个浏览器暂时不能点读词句，可以家长读给孩子听。
              </p>
            )}
          </>
        ) : null}

        {currentStep.key === 'activity' ? (
          <>
            <h1 className="reading-page-heading">互动一下</h1>
            <p className="reading-story-text">
              {card.activityPrompt || '我们一起找一找、说一说这个字。'}
            </p>
            <button type="button">我们试试看</button>
          </>
        ) : null}

        {currentStep.key === 'finish' ? (
          <>
            <p className="card-section-label">完成收尾</p>
            <h1 className="reading-page-heading">今天这张读完了</h1>
            <p className="reading-story-text">可以夸孩子一句：你刚才认真听完了一个故事。</p>
            <div className="reading-action-grid">
              <button className="button-secondary" type="button" onClick={toggleCardFavorite}>
                {isFavorite ? '取消收藏' : '收藏这张卡'}
              </button>
              <button type="button" onClick={finishCard}>
                今天这张读完了
              </button>
            </div>
          </>
        ) : null}
      </section>

      <nav className="reading-footer" aria-label="阅读步骤">
        {isFirstStep ? (
          <span />
        ) : (
          <button className="button-secondary" type="button" onClick={goBack}>
            上一步
          </button>
        )}
        {isLastStep ? null : (
          <button type="button" onClick={goNext}>
            {isFirstStep ? '开始读这张卡' : '下一页'}
          </button>
        )}
      </nav>
    </article>
  )
}
