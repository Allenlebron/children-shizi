import type { Env } from './env'
import { assertAdmin } from './lib/admin'
import { createOpenAIGenerator } from './lib/openai'
import { generatePrivateCard, type CardGenerator } from './lib/generation'
import { corsHeaders, json } from './lib/http'
import { createRepository, type GeneratedCardRepository } from './lib/repository'
import { isSingleHanzi, normalizeQuery } from './lib/whitelist'

type WorkerOverrides = {
  repository?: GeneratedCardRepository
  generator?: CardGenerator
}

export function createWorker(overrides: WorkerOverrides = {}): ExportedHandler<Env> {
  return {
    async fetch(request, env) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(request.headers.get('origin'), env),
        })
      }

      const url = new URL(request.url)
      const repository = overrides.repository ?? createRepository(env.DB)
      const generator = overrides.generator ?? createOpenAIGenerator(env)

      if (request.method === 'GET' && url.pathname === '/api/health') {
        return json({ ok: true }, { status: 200 }, request, env)
      }

      if (request.method === 'POST' && url.pathname === '/api/search/resolve') {
        const { query } = (await request.json()) as { query?: unknown }
        const normalized = normalizeQuery(query)
        const browserId = request.headers.get('x-browser-id') ?? ''

        if (!browserId || !isSingleHanzi(normalized)) {
          return json({ error: 'Invalid search payload' }, { status: 400 }, request, env)
        }

        if (!(await repository.isWhitelisted(normalized))) {
          return json({ status: 'unsupported', query: normalized }, { status: 200 }, request, env)
        }

        const publicCardId = await repository.findPublicCardId(normalized)
        if (publicCardId) {
          return json(
            { status: 'ready_public', query: normalized, cardId: publicCardId },
            { status: 200 },
            request,
            env,
          )
        }

        const privateCardId = await repository.findPrivateCardId(browserId, normalized)
        if (privateCardId) {
          return json(
            { status: 'ready_private', query: normalized, cardId: privateCardId },
            { status: 200 },
            request,
            env,
          )
        }

        return json(
          { status: 'needs_generation', query: normalized },
          { status: 200 },
          request,
          env,
        )
      }

      if (request.method === 'POST' && url.pathname === '/api/generate') {
        const { query } = (await request.json()) as { query?: unknown }
        const normalized = normalizeQuery(query)
        const browserId = request.headers.get('x-browser-id') ?? ''

        if (
          !browserId ||
          !isSingleHanzi(normalized) ||
          !(await repository.isWhitelisted(normalized))
        ) {
          return json({ error: 'Invalid generation payload' }, { status: 400 }, request, env)
        }

        const result = await generatePrivateCard(
          env,
          repository,
          browserId,
          normalized,
          generator,
        )

        return json(result, { status: 200 }, request, env)
      }

      if (request.method === 'GET' && url.pathname.startsWith('/api/cards/')) {
        const cardId = url.pathname.replace('/api/cards/', '')
        const browserId = request.headers.get('x-browser-id') ?? ''
        const document = await repository.findCardForBrowser(cardId, browserId)

        if (!document) {
          return json({ error: 'Card not found' }, { status: 403 }, request, env)
        }

        return json(document, { status: 200 }, request, env)
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/private-cards') {
        if (!assertAdmin(request, env)) {
          return json({ error: 'Unauthorized' }, { status: 401 }, request, env)
        }

        return json(await repository.listRecentPrivateCards(), { status: 200 }, request, env)
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/promote') {
        if (!assertAdmin(request, env)) {
          return json({ error: 'Unauthorized' }, { status: 401 }, request, env)
        }

        const { cardId } = (await request.json()) as { cardId?: string }
        const result = cardId ? await repository.promotePrivateCard(cardId) : null

        if (!result) {
          return json({ error: 'Card not found' }, { status: 404 }, request, env)
        }

        return json(result, { status: 200 }, request, env)
      }

      return json({ error: 'Not found' }, { status: 404 }, request, env)
    },
  }
}

export default createWorker()
