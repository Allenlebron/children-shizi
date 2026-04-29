import { describe, expect, it, vi } from 'vitest'
import worker from '../src/index'
import type { Env } from '../src/env'

function createExecutionContextStub() {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext
}

type WorkerRequest = Parameters<NonNullable<typeof worker.fetch>>[0]

describe('worker health endpoint', () => {
  it('returns ok json and CORS headers', async () => {
    const request = new Request('http://example.com/api/health', {
      headers: {
        origin: 'http://localhost:5173',
      },
    }) as WorkerRequest
    const env: Env = {
      DB: {} as D1Database,
      ALLOWED_ORIGIN: 'http://localhost:5173',
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      ADMIN_TOKEN: 'test-token',
      PREVIEW_TOKEN: 'preview-token',
    }

    const response = await worker.fetch!(
      request,
      env,
      createExecutionContextStub(),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
