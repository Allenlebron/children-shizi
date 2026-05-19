import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCards } from '../../content/cards'
import type { HanziCard } from '../../content/types'
import { recordReviewResult } from '../../lib/progress/store'

type ReviewQuestion = {
  card: HanziCard
  options: string[]
}

const questionCount = 3

function createReviewQuestions(): ReviewQuestion[] {
  const cards = listCards().slice(0, Math.max(questionCount + 1, 4))

  return cards.slice(0, questionCount).map((card, index) => ({
    card,
    options: cards
      .slice(index, index + questionCount)
      .map((optionCard) => optionCard.character)
      .concat(cards[index - 1]?.character ?? [])
      .filter((character, optionIndex, options) => options.indexOf(character) === optionIndex)
      .slice(0, questionCount),
  }))
}

export function ReviewPage() {
  const questions = useMemo(() => createReviewQuestions(), [])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const hasRecordedRef = useRef(false)
  const isComplete = questionIndex >= questions.length
  const currentQuestion = questions[questionIndex]

  useEffect(() => {
    if (!isComplete || hasRecordedRef.current) {
      return
    }

    hasRecordedRef.current = true
    recordReviewResult({
      totalQuestions: questions.length,
      correctAnswers,
      leaves: correctAnswers,
    })
  }, [correctAnswers, isComplete, questions.length])

  function answer(character: string) {
    if (!currentQuestion) {
      return
    }

    if (character !== currentQuestion.card.character) {
      setMessage('再看看画面，找找线索。')
      return
    }

    const nextCorrectAnswers = correctAnswers + 1
    setCorrectAnswers(nextCorrectAnswers)
    setMessage(`答对啦，收集 ${nextCorrectAnswers} 片小树叶！`)
    setQuestionIndex((current) => current + 1)
  }

  if (isComplete) {
    return (
      <section className="review-quest review-quest-complete">
        <article className="review-card review-finish-card">
          <p className="eyebrow">森林识字队 · 复习完成</p>
          <h1>今天收集了 {correctAnswers} 片小树叶</h1>
          <p className="review-score">{correctAnswers} / {questions.length} 题答对</p>
          <p className="review-helper">孩子刚刚完成了一轮小复习，可以夸一句：你的小眼睛很会找线索。</p>
          <div className="reading-action-grid">
            <Link className="button-secondary" to="/">
              回首页
            </Link>
            <Link to="/cards">继续看字卡</Link>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="review-quest">
      <article className="review-card">
        <span className="storybook-blob review-blob-one" aria-hidden="true" />
        <span className="storybook-blob review-blob-two" aria-hidden="true" />
        <p className="eyebrow">森林识字队 · 收集小树叶</p>
        <h1>小树叶闯关</h1>
        <div className="review-progress-row">
          <span>第 {questionIndex + 1} / {questions.length} 题</span>
          <span>{correctAnswers} 片叶子</span>
        </div>
        <p className="review-helper">看看画面和词语，选出正确的字。</p>
        <figure className="review-picture-card">
          {currentQuestion.card.comic ? (
            <img src={currentQuestion.card.comic.imageSrc} alt={currentQuestion.card.comic.alt} />
          ) : (
            <div className="review-picture-fallback">{currentQuestion.card.character}</div>
          )}
          <figcaption>{currentQuestion.card.comic?.caption ?? currentQuestion.card.storyScene}</figcaption>
        </figure>
        <div className="review-clue-list" aria-label="复习线索">
          {currentQuestion.card.words.slice(0, 2).map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>
        <div className="review-option-grid">
          {currentQuestion.options.map((character) => (
            <button key={character} type="button" onClick={() => answer(character)}>
              {character}
            </button>
          ))}
        </div>
        {message ? (
          <p className="review-message" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
      </article>
    </section>
  )
}
