import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { getCardBySlug } from '../../content/cards'
import { readProgress } from '../../lib/progress/store'

const leafPositions = [
  { x: 112, y: 68, rotate: -24 },
  { x: 176, y: 56, rotate: 18 },
  { x: 216, y: 92, rotate: -12 },
  { x: 88, y: 106, rotate: 22 },
  { x: 152, y: 112, rotate: -18 },
  { x: 236, y: 132, rotate: 24 },
  { x: 124, y: 144, rotate: 10 },
  { x: 194, y: 150, rotate: -20 },
]

const maxVisibleTreeLeaves = 6

export function ProfilePage() {
  const progress = Object.values(readProgress()).filter((entry) => entry.completed || entry.favorite)
  const completedCount = progress.filter((entry) => entry.completed).length
  const favoriteCount = progress.filter((entry) => entry.favorite).length
  const treeLeaves = progress.flatMap((entry) => {
    const character = entry.character || getCardBySlug(entry.cardId)?.character || '叶'

    return [
      ...(entry.completed
        ? [{ character, key: `${entry.cardId}-completed`, kind: 'completed' as const }]
        : []),
      ...(entry.favorite ? [{ character, key: `${entry.cardId}-favorite`, kind: 'favorite' as const }] : []),
    ]
  })
  const visibleLeaves = treeLeaves.slice(0, maxVisibleTreeLeaves)
  const overflowLeafCount = Math.max(0, treeLeaves.length - visibleLeaves.length)
  const treeLabel = `识字小树，已长出 ${treeLeaves.length} 片叶子`

  return (
    <section className="panel-card profile-page">
      <p className="eyebrow">我的森林</p>
      <h1>我的</h1>
      <figure className="profile-tree-card">
        <svg className="profile-tree" viewBox="0 0 320 220" role="img" aria-label={treeLabel}>
          <title>{treeLabel}</title>
          <path className="profile-tree-ground" d="M58 190 C96 162 226 162 266 190" />
          <path className="profile-tree-trunk" d="M158 184 C156 144 168 118 160 84" />
          <path className="profile-tree-branch" d="M160 112 C132 102 112 84 94 66" />
          <path className="profile-tree-branch" d="M162 108 C190 96 208 78 228 58" />
          <path className="profile-tree-branch" d="M162 134 C132 132 106 126 82 108" />
          <path className="profile-tree-branch" d="M164 134 C198 128 224 120 250 98" />
          {visibleLeaves.map((entry, index) => {
            const leaf = leafPositions[index]

            return (
              <g
                className={`profile-tree-leaf profile-tree-leaf-${entry.kind}`}
                key={entry.key}
                style={{ '--leaf-index': index } as CSSProperties}
                transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate})`}
              >
                <ellipse cx="0" cy="0" rx="20" ry="12" />
                <text x="0" y="5" textAnchor="middle">
                  {entry.character}
                </text>
              </g>
            )
          })}
          {treeLeaves.length === 0 ? (
            <text className="profile-tree-empty" x="160" y="112" textAnchor="middle">
              读完一张卡，小树会长叶子
            </text>
          ) : null}
          {overflowLeafCount > 0 ? (
            <g className="profile-tree-overflow" transform="translate(258 64)">
              <circle r="26" />
              <text x="0" y="7" textAnchor="middle">
                +{overflowLeafCount}
              </text>
            </g>
          ) : null}
        </svg>
        <figcaption>
          {treeLeaves.length === 0 ? (
            '今天先种下一颗小种子。'
          ) : overflowLeafCount > 0 ? (
            <>
              <span>树上先放 {visibleLeaves.length} 片。</span>
              <span>还有 {overflowLeafCount} 片小叶子在森林里。</span>
            </>
          ) : (
            '读完长绿叶，收藏长金叶。'
          )}
        </figcaption>
      </figure>
      <div className="profile-stats" aria-hidden="true">
        <div>
          <strong>{completedCount}</strong>
          <span>学过字卡</span>
        </div>
        <div>
          <strong>{favoriteCount}</strong>
          <span>收藏树叶</span>
        </div>
      </div>
      <div className="profile-summary-row">
        <p>学过 {completedCount} 张</p>
        <p>收藏 {favoriteCount} 张</p>
      </div>
      {progress.length === 0 ? <p className="page-intro">读完一张字卡后，这里会长出小树叶。</p> : null}
      <ul className="card-list profile-card-list">
        {progress.map((entry) => (
          <li className="profile-card-item" key={entry.cardId}>
            <Link to={`/cards/${entry.cardId}`}>{entry.character || getCardBySlug(entry.cardId)?.character || '叶'}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
