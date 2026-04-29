import { describe, expect, it } from 'vitest'
import type { Env } from '../src/env'
import { createWorker } from '../src/index'
import { generatePrivateCard, type CardGenerator } from '../src/lib/generation'
import type { GeneratedCardRepository } from '../src/lib/repository'

function card(character: string) {
  return {
    slug: `generated-${character}`,
    character,
    pinyin: 'mu',
    theme: '自然',
    estimatedMinutes: 5,
    heroLine: `今天用一个小故事认识“${character}”。`,
    storyScene: `一棵和“${character}”有关的小树站在阳光里。`,
    storyText: `家长和孩子看见这棵小树，就一起想到“${character}”和树木的关系。`,
    parentPrompt: '先让孩子看画面，再说像不像树站在地上。',
    words: [`${character}头`, `${character}门`, `树${character}`],
    sentences: [`${character}门开了。`, `树${character}长高了。`],
    activityPrompt: '伸开手臂站一站，像一棵小树一样。',
  }
}

function createRepositoryStub() {
  const savedCards: Array<{ cardId: string; browserId: string; character: string; payload: unknown }> = []
  const finishedJobs: Array<{ status: string; attempts: number; cardId?: string; failureReason?: string }> = []

  const repository: GeneratedCardRepository = {
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
    async savePrivateCard(input) {
      savedCards.push(input)
    },
    async finishGenerationJob(input) {
      finishedJobs.push(input)
    },
  }

  return { repository, savedCards, finishedJobs }
}

type WorkerRequest = Parameters<NonNullable<ReturnType<typeof createWorker>['fetch']>>[0]

function createExecutionContextStub() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  } as unknown as ExecutionContext
}

describe('generatePrivateCard', () => {
  it('retries once and stores a private card when the repaired output passes', async () => {
    const { repository, savedCards, finishedJobs } = createRepositoryStub()
    const generator: CardGenerator = {
      async generateCard() {
        return {
          ...card('木'),
          words: ['树叶'],
          sentences: ['很好。'],
        }
      },
      async repairCard() {
        return card('木')
      },
      async reviewCard() {
        return {
          passed: true,
          issues: [],
        }
      },
    }
    const env: Env = {
      DB: {} as D1Database,
      ALLOWED_ORIGIN: 'http://localhost:5173',
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      ADMIN_TOKEN: 'test-token',
      PREVIEW_TOKEN: 'preview-token',
    }

    const result = await generatePrivateCard(env, repository, 'browser-alpha', '木', generator)

    expect(result).toMatchObject({
      status: 'ready_private',
      query: '木',
      cardId: expect.stringContaining('priv-'),
      attempts: 2,
    })
    expect(savedCards).toHaveLength(1)
    expect(finishedJobs.at(-1)).toMatchObject({
      status: 'ready_private',
      attempts: 2,
    })
  })

  it('fails after three bad attempts', async () => {
    const { repository, savedCards, finishedJobs } = createRepositoryStub()
    const generator: CardGenerator = {
      async generateCard() {
        return {
          ...card('木'),
          parentPrompt: '木字最早出现在甲骨文里，是一个象形字。',
        }
      },
      async repairCard() {
        return {
          ...card('木'),
          parentPrompt: '木字最早出现在甲骨文里，是一个象形字。',
        }
      },
      async reviewCard() {
        return {
          passed: false,
          issues: ['家长提示太像知识讲解'],
        }
      },
    }
    const env: Env = {
      DB: {} as D1Database,
      ALLOWED_ORIGIN: 'http://localhost:5173',
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      ADMIN_TOKEN: 'test-token',
      PREVIEW_TOKEN: 'preview-token',
    }

    const result = await generatePrivateCard(env, repository, 'browser-alpha', '木', generator)

    expect(result).toEqual({
      status: 'failed',
      query: '木',
      reason: 'quality_gate',
      attempts: 3,
    })
    expect(savedCards).toHaveLength(0)
    expect(finishedJobs.at(-1)).toMatchObject({
      status: 'failed',
      attempts: 3,
      failureReason: 'quality_gate',
    })
  })
})

describe('generate route', () => {
  it('returns a private card response when generation succeeds', async () => {
    const { repository } = createRepositoryStub()
    const generator: CardGenerator = {
      async generateCard() {
        return {
          ...card('木'),
          words: ['树叶'],
          sentences: ['很好。'],
        }
      },
      async repairCard() {
        return card('木')
      },
      async reviewCard() {
        return {
          passed: true,
          issues: [],
        }
      },
    }
    const env: Env = {
      DB: {} as D1Database,
      ALLOWED_ORIGIN: 'http://localhost:5173',
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      ADMIN_TOKEN: 'test-token',
      PREVIEW_TOKEN: 'preview-token',
    }
    const worker = createWorker({
      repository,
      generator,
    } as never)

    const response = await worker.fetch!(
      new Request('http://example.com/api/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
          'x-preview-token': 'preview-token',
        },
        body: JSON.stringify({ query: '木' }),
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'ready_private',
      query: '木',
      cardId: expect.stringContaining('priv-'),
      attempts: 2,
    })
  })

  it('rejects invalid generate payloads', async () => {
    const { repository } = createRepositoryStub()
    const env: Env = {
      DB: {} as D1Database,
      ALLOWED_ORIGIN: 'http://localhost:5173',
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      ADMIN_TOKEN: 'test-token',
      PREVIEW_TOKEN: 'preview-token',
    }
    const worker = createWorker({
      repository,
    } as never)

    const response = await worker.fetch!(
      new Request('http://example.com/api/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-preview-token': 'preview-token',
        },
        body: JSON.stringify({ query: '木' }),
      }) as WorkerRequest,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(400)
  })

  it('rejects generation without the preview token', async () => {
    const { repository } = createRepositoryStub()
    const env: Env = {
      DB: {} as D1Database,
      ALLOWED_ORIGIN: 'http://localhost:5173',
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      ADMIN_TOKEN: 'test-token',
      PREVIEW_TOKEN: 'preview-token',
    }
    const worker = createWorker({
      repository,
    } as never)

    const response = await worker.fetch!(
      new Request('http://example.com/api/generate', {
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

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Preview token required' })
  })
})
