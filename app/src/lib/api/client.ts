import type { CardDocument } from '../../content/types'
import { getBrowserId } from '../browser-id'
import type {
  FetchCardDocumentResponse,
  GenerateCardResponse,
  ResolveSearchResponse,
} from './contracts'
import { getPreviewToken } from '../preview-token'

const API_BASE_URL = import.meta.env.VITE_HANZI_API_BASE_URL ?? 'http://127.0.0.1:8787'

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-browser-id': getBrowserId(),
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function resolveSearch(query: string) {
  return request<ResolveSearchResponse>('/api/search/resolve', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export function generateCard(query: string) {
  const previewToken = getPreviewToken()

  return request<GenerateCardResponse>('/api/generate', {
    method: 'POST',
    headers: previewToken
      ? {
          'x-preview-token': previewToken,
        }
      : undefined,
    body: JSON.stringify({ query }),
  })
}

export function fetchCardDocument(cardId: string) {
  return request<FetchCardDocumentResponse>(`/api/cards/${cardId}`) as Promise<CardDocument>
}

export function listPrivateCards(adminToken: string) {
  return request<Array<{ cardId: string; character: string; browserId: string; createdAt: string }>>(
    '/api/admin/private-cards',
    {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    },
  )
}

export function promoteCard(adminToken: string, cardId: string) {
  return request<{ status: 'ready_public'; cardId: string; character: string }>(
    '/api/admin/promote',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ cardId }),
    },
  )
}
