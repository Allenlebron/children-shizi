import { describe, expect, it } from 'vitest'
import { createWorker } from '../src/index'
import type { Env } from '../src/env'
import type { GeneratedCardRepository } from '../src/lib/repository'

type WorkerRequest = Parameters<NonNullable<ReturnType<typeof createWorker>['fetch']>>[0]

const env: Env = {
  DB: {} as D1Database,
  ALLOWED_ORIGIN: 'http://localhost:5173',
  OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
  OPENAI_API_KEY: 'test-key',
  OPENAI_MODEL: 'gpt-4o-mini',
  ADMIN_TOKEN: 'test-admin-token',
}

function createExecutionContextStub() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  } as unknown as ExecutionContext
}

function repositoryStub(overrides: Record<string, unknown>) {
  return overrides as unknown as GeneratedCardRepository
}

describe('cards and admin endpoints', () => {
  it('decodes encoded private card ids before loading them', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async findCardForBrowser(cardId: string, browserId: string) {
          expect(cardId).toBe('priv-火-001')
          expect(browserId).toBe('browser-alpha')

          return {
            cardId: 'priv-火-001',
            access: 'ready_private',
            card: {
              character: '火',
            },
          }
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/cards/priv-%E7%81%AB-001', {
        headers: {
          'x-browser-id': 'browser-alpha',
        },
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      cardId: 'priv-火-001',
      access: 'ready_private',
      card: {
        character: '火',
      },
    })
  })

  it('returns a private card only to the owning browser', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async findCardForBrowser(cardId: string, browserId: string) {
          expect(cardId).toBe('priv-mu-001')
          expect(browserId).toBe('browser-alpha')

          return {
            cardId: 'priv-mu-001',
            access: 'ready_private',
            card: {
              character: '木',
            },
          }
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/cards/priv-mu-001', {
        headers: {
          'x-browser-id': 'browser-alpha',
        },
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      cardId: 'priv-mu-001',
      access: 'ready_private',
      card: {
        character: '木',
      },
    })
  })

  it('blocks a private card for another browser', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async findCardForBrowser() {
          return null
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/cards/priv-mu-001', {
        headers: {
          'x-browser-id': 'browser-beta',
        },
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(403)
  })

  it('lists recent private cards for an authenticated admin', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async listRecentPrivateCards() {
          return [
            {
              cardId: 'priv-mu-001',
              browserId: 'browser-alpha',
              character: '木',
              createdAt: '2026-04-25T09:00:00.000Z',
            },
          ]
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/admin/private-cards', {
        headers: {
          authorization: 'Bearer test-admin-token',
        },
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        cardId: 'priv-mu-001',
        browserId: 'browser-alpha',
        character: '木',
        createdAt: '2026-04-25T09:00:00.000Z',
      },
    ])
  })

  it('lets admin promote a private card into the public cache', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async promotePrivateCard(cardId: string) {
          expect(cardId).toBe('priv-mu-001')

          return {
            status: 'ready_public',
            cardId: 'priv-mu-001',
            character: '木',
          }
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/admin/promote', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-admin-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ cardId: 'priv-mu-001' }),
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'ready_public',
      cardId: 'priv-mu-001',
      character: '木',
    })
  })
})
