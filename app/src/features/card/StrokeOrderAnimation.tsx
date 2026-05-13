import { useState } from 'react'
import { getStrokeOrder } from './stroke-order-data'

type StrokeOrderAnimationProps = {
  character: string
}

function getTitleId(character: string) {
  const codePoint = character.codePointAt(0)?.toString(16) ?? 'unknown'

  return `stroke-order-${codePoint}`
}

export function StrokeOrderAnimation({ character }: StrokeOrderAnimationProps) {
  const [playKey, setPlayKey] = useState(0)
  const strokeOrder = getStrokeOrder(character)

  if (!strokeOrder) {
    return (
      <aside className="stroke-order-card stroke-order-empty">
        <p className="card-mini-heading">笔顺动画</p>
        <p>这个字的笔顺动画还在准备中。</p>
      </aside>
    )
  }

  const titleId = getTitleId(character)

  return (
    <aside className="stroke-order-card" aria-label={`${character} 的书写顺序`}>
      <div className="stroke-order-heading">
        <div>
          <p className="card-mini-heading">笔顺动画</p>
          <p className="stroke-order-meta">
            {strokeOrder.character} · {strokeOrder.strokes.length} 笔
          </p>
        </div>
        <button className="button-secondary stroke-replay-button" type="button" onClick={() => setPlayKey((current) => current + 1)}>
          重新播放笔顺
        </button>
      </div>

      <svg
        aria-labelledby={titleId}
        className="stroke-order-svg"
        key={playKey}
        role="img"
        viewBox={strokeOrder.viewBox}
      >
        <title id={titleId}>{strokeOrder.character} 的笔顺动画</title>
        <g className="stroke-order-guide" aria-hidden="true" transform={strokeOrder.transform}>
          {strokeOrder.strokes.map((stroke) => (
            <path d={stroke.d} key={stroke.label} />
          ))}
        </g>
        <g transform={strokeOrder.transform}>
          {strokeOrder.strokes.map((stroke, index) => (
            <path
              className="stroke-order-stroke"
              d={stroke.d}
              key={stroke.label}
              style={{ animationDelay: `${index * 420}ms` }}
            />
          ))}
        </g>
        <g className="stroke-order-trace-layer" transform={strokeOrder.transform}>
          {strokeOrder.strokes.map((stroke, index) => (
            <path
              className="stroke-order-trace"
              d={stroke.median}
              key={`${stroke.label}-median`}
              pathLength={100}
              style={{ animationDelay: `${index * 420}ms` }}
            />
          ))}
        </g>
      </svg>

      <ol className="stroke-order-steps">
        {strokeOrder.strokes.map((stroke) => (
          <li key={stroke.label}>{stroke.label}</li>
        ))}
      </ol>
    </aside>
  )
}
