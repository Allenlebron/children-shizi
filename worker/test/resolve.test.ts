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
  ADMIN_TOKEN: 'test-token',
}

function createExecutionContextStub() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  } as unknown as ExecutionContext
}

function repositoryStub(overrides: Partial<GeneratedCardRepository>) {
  return {
    async isWhitelisted() {
      return true
    },
    async findPublicCardId() {
      return null
    },
    async findPrivateCardId() {
      return null
    },
    async findCardForBrowser() {
      return null
    },
    async listRecentPrivateCards() {
      return []
    },
    async promotePrivateCard() {
      return null
    },
    async insertGenerationJob() {},
    async savePrivateCard() {},
    async finishGenerationJob() {},
    ...overrides,
  } satisfies GeneratedCardRepository
}

describe('search resolve endpoint', () => {
  it('returns unsupported for a Hanzi outside the whitelist', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async isWhitelisted() {
          return false
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/search/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '火' }),
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'unsupported',
      query: '火',
    })
  })

  it('returns ready_public when a public card already exists', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async findPublicCardId() {
          return 'pub-mu-001'
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/search/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '木' }),
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'ready_public',
      query: '木',
      cardId: 'pub-mu-001',
    })
  })

  it('returns ready_private when the same browser already generated the card', async () => {
    const worker = createWorker({
      repository: repositoryStub({
        async findPrivateCardId() {
          return 'priv-mu-001'
        },
      }),
    })

    const response = await worker.fetch!(
      new Request('http://example.com/api/search/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '木' }),
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'ready_private',
      query: '木',
      cardId: 'priv-mu-001',
    })
  })
})
