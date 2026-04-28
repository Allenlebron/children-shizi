import { useState } from 'react'
import { listPrivateCards, promoteCard } from '../../lib/api/client'

const ADMIN_TOKEN_STORAGE_KEY = 'hanzi-h5-admin-token'

type AdminCardItem = {
  cardId: string
  character: string
  browserId: string
  createdAt: string
}

export function AdminPage() {
  const [token, setToken] = useState(window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? '')
  const [items, setItems] = useState<AdminCardItem[]>([])
  const [statusMessage, setStatusMessage] = useState('')

  async function loadItems() {
    window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
    const nextItems = await listPrivateCards(token)
    setItems(nextItems)
    setStatusMessage('')
  }

  async function promote(cardId: string) {
    const result = await promoteCard(token, cardId)
    setStatusMessage(`已提升 ${result.character}`)
    setItems((currentItems) => currentItems.filter((item) => item.cardId !== cardId))
  }

  return (
    <section className="panel-card">
      <h1>生成管理</h1>
      <label htmlFor="admin-token">管理员 token</label>
      <input
        id="admin-token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
      />
      <button type="button" onClick={loadItems} disabled={!token.trim()}>
        加载生成记录
      </button>
      {statusMessage ? <p role="status">{statusMessage}</p> : null}
      <ul className="card-list">
        {items.map((item) => (
          <li key={item.cardId}>
            <span>
              {item.character} · {item.browserId}
            </span>
            <button type="button" onClick={() => promote(item.cardId)}>
              提升为公共缓存
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
