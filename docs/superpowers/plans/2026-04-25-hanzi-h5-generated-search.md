# Hanzi H5 Generated Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add whitelist-based generated search so a parent can search a supported Hanzi, wait 10-20 seconds on first lookup, and then open a private cached text card in the existing learning flow.

**Architecture:** Keep curated cards local in the static React app for zero-latency hits. Add a separate Cloudflare Worker API with D1-backed whitelist, private/public card caches, and generation job logs; the Worker orchestrates structured generation, rule validation, review, retries, and admin promotion. The frontend gains anonymous browser identity, remote search states, remote card loading, generated-card progress metadata, and a minimal token-protected admin page.

**Tech Stack:** Vite, React, TypeScript, React Router, Vitest, Cloudflare Workers, Cloudflare D1, Wrangler, OpenAI Structured Outputs via the REST API.

---

## File Structure

- Modify: `.gitignore` - ignore Cloudflare local artifacts
- Modify: `.github/workflows/deploy.yml` - inject the generated-search API base URL into the Pages build
- Create: `.github/workflows/deploy-api.yml` - deploy the Worker and apply D1 migrations
- Create: `worker/package.json` - Worker scripts and dependencies
- Create: `worker/tsconfig.json` - Worker TypeScript config
- Create: `worker/wrangler.jsonc` - Worker name, vars, D1 binding, migration config
- Create: `worker/vitest.config.ts` - Workers Vitest integration
- Create: `worker/.dev.vars.example` - local env var template
- Create: `worker/migrations/0001_generated_search.sql` - D1 schema
- Create: `worker/data/high-frequency-whitelist.ts` - curated whitelist seed data
- Create: `worker/src/env.ts` - Worker env and dependency interfaces
- Create: `worker/src/index.ts` - Worker entrypoint and route registration
- Create: `worker/src/lib/http.ts` - JSON response and CORS helpers
- Create: `worker/src/lib/ids.ts` - card/job id creation
- Create: `worker/src/lib/whitelist.ts` - whitelist normalization helpers
- Create: `worker/src/lib/validation.ts` - runtime validation and rule checks for generated cards
- Create: `worker/src/lib/openai.ts` - OpenAI REST client wrapper
- Create: `worker/src/lib/generation.ts` - orchestration, retries, review, D1 writes
- Create: `worker/src/lib/repository.ts` - D1 reads/writes for whitelist, cards, jobs
- Create: `worker/src/lib/admin.ts` - bearer-token admin auth helper
- Create: `worker/test/helpers.ts` - Worker test helpers and D1 migration setup
- Create: `worker/test/health.test.ts`
- Create: `worker/test/resolve.test.ts`
- Create: `worker/test/generate.test.ts`
- Create: `worker/test/cards-admin.test.ts`
- Create: `worker/README.md` - local dev, deploy, and secret setup
- Create: `app/src/lib/browser-id.ts` - stable anonymous browser id storage
- Create: `app/src/lib/api/contracts.ts` - generated-search frontend contracts
- Create: `app/src/lib/api/client.ts` - fetch wrapper for resolve / generate / card / admin endpoints
- Create: `app/src/lib/cards/loadCardDocument.ts` - local-or-remote card loader
- Modify: `app/src/content/types.ts` - card document and progress metadata types
- Modify: `app/src/features/home/HomePage.tsx` - async generated search flow
- Modify: `app/src/features/home/HomePage.test.tsx`
- Modify: `app/src/features/card/CardPage.tsx` - remote card loading and missing states
- Modify: `app/src/features/card/CardPage.test.tsx`
- Modify: `app/src/lib/progress/store.ts` - progress keyed by cardId with metadata snapshots
- Modify: `app/src/lib/progress/store.test.ts`
- Modify: `app/src/features/profile/ProfilePage.tsx` - render generated cards from progress snapshots
- Modify: `app/src/features/profile/ProfilePage.test.tsx`
- Create: `app/src/features/admin/AdminPage.tsx` - minimal token-protected admin console
- Create: `app/src/features/admin/AdminPage.test.tsx`
- Modify: `app/src/app/App.tsx` - add admin route and rename `:slug` route param to `:cardId`
- Modify: `app/src/app/App.flow.test.tsx`

### Task 1: Bootstrap the Worker workspace and health endpoint

**Files:**
- Modify: `.gitignore`
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.jsonc`
- Create: `worker/vitest.config.ts`
- Create: `worker/.dev.vars.example`
- Create: `worker/src/env.ts`
- Create: `worker/src/lib/http.ts`
- Create: `worker/src/index.ts`
- Test: `worker/test/health.test.ts`

- [ ] **Step 1: Write the failing Worker health test**

```ts
// worker/test/health.test.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import worker from '../src/index'

describe('worker health endpoint', () => {
  it('returns ok json and CORS headers', async () => {
    const request = new Request('http://example.com/api/health', {
      headers: {
        origin: 'http://localhost:5173',
      },
    })

    const response = await worker.fetch(request, env, createExecutionContext())
    await waitOnExecutionContext()

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd worker && npm test -- health.test.ts`

Expected: FAIL because the `worker/` package and config do not exist yet.

- [ ] **Step 3: Create the Worker package, config, and minimal health route**

```json
// worker/package.json
{
  "name": "hanzi-generated-search-worker",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cloudflare/workers-types": "^4.20260417.0"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.8.31",
    "typescript": "~6.0.2",
    "vitest": "^4.1.5",
    "wrangler": "^4.14.4"
  }
}
```

```json
// worker/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"]
}
```

```jsonc
// worker/wrangler.jsonc
{
  "name": "family-generated-search-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-25",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "family-generated-search",
      "database_id": "REPLACE_IN_CLOUDFLARE_DASHBOARD"
    }
  ],
  "migrations_dir": "migrations",
  "vars": {
    "ALLOWED_ORIGIN": "http://localhost:5173",
    "OPENAI_API_BASE_URL": "https://api.openai.com/v1",
    "OPENAI_MODEL": "gpt-4o-mini"
  }
}
```

```ts
// worker/vitest.config.ts
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './wrangler.jsonc',
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.ts'],
  },
})
```

```ts
// worker/src/env.ts
export interface Env {
  DB: D1Database
  ALLOWED_ORIGIN: string
  OPENAI_API_BASE_URL: string
  OPENAI_API_KEY: string
  OPENAI_MODEL: string
  ADMIN_TOKEN: string
}
```

```ts
// worker/src/lib/http.ts
import type { Env } from '../env'

export function corsHeaders(origin: string | null, env: Env) {
  const allowedOrigin = origin === env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN : env.ALLOWED_ORIGIN

  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-headers': 'content-type, authorization, x-browser-id',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-credentials': 'false',
  }
}

export function json<T>(body: T, init: ResponseInit = {}, request: Request, env: Env) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request.headers.get('origin'), env),
      ...init.headers,
    },
  })
}
```

```ts
// worker/src/index.ts
import type { Env } from './env'
import { corsHeaders, json } from './lib/http'

const worker: ExportedHandler<Env> = {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get('origin'), env),
      })
    }

    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({ ok: true }, { status: 200 }, request, env)
    }

    return json({ error: 'Not found' }, { status: 404 }, request, env)
  },
}

export default worker
```

```gitignore
# .gitignore
.worktrees/
.superpowers/
.wrangler/
```

```env
# worker/.dev.vars.example
OPENAI_API_KEY=sk-your-key
ADMIN_TOKEN=replace-with-a-long-random-string
```

- [ ] **Step 4: Run the health test and typecheck**

Run:

```bash
cd worker
npm install
npm test -- health.test.ts
npm run typecheck
```

Expected:
- `health.test.ts` PASS
- `tsc --noEmit` exits `0`

- [ ] **Step 5: Commit**

```bash
git add .gitignore worker/package.json worker/tsconfig.json worker/wrangler.jsonc worker/vitest.config.ts worker/.dev.vars.example worker/src worker/test/health.test.ts
git commit -m "chore: bootstrap generated search worker"
```

### Task 2: Add D1 schema, whitelist seed, and search resolution

**Files:**
- Create: `worker/migrations/0001_generated_search.sql`
- Create: `worker/data/high-frequency-whitelist.ts`
- Create: `worker/src/lib/ids.ts`
- Create: `worker/src/lib/whitelist.ts`
- Create: `worker/src/lib/repository.ts`
- Create: `worker/test/helpers.ts`
- Test: `worker/test/resolve.test.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: Write the failing resolve-flow tests**

```ts
// worker/test/resolve.test.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../src/index'
import { applyMigrations, seedPrivateCard, seedPublicCard, seedWhitelist } from './helpers'

describe('search resolve endpoint', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB)
  })

  it('returns unsupported for a Hanzi outside the whitelist', async () => {
    await seedWhitelist(env.DB, ['木'])

    const response = await worker.fetch(
      new Request('http://example.com/api/search/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '火' }),
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'unsupported',
      query: '火',
    })
  })

  it('returns ready_public when a public card already exists', async () => {
    await seedWhitelist(env.DB, ['木'])
    await seedPublicCard(env.DB, {
      cardId: 'pub-mu-001',
      character: '木',
    })

    const response = await worker.fetch(
      new Request('http://example.com/api/search/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '木' }),
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    await expect(response.json()).resolves.toEqual({
      status: 'ready_public',
      query: '木',
      cardId: 'pub-mu-001',
    })
  })

  it('returns ready_private when the same browser already generated the card', async () => {
    await seedWhitelist(env.DB, ['木'])
    await seedPrivateCard(env.DB, {
      browserId: 'browser-alpha',
      cardId: 'priv-mu-001',
      character: '木',
    })

    const response = await worker.fetch(
      new Request('http://example.com/api/search/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '木' }),
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    await expect(response.json()).resolves.toEqual({
      status: 'ready_private',
      query: '木',
      cardId: 'priv-mu-001',
    })
  })
})
```

- [ ] **Step 2: Run the resolve tests to verify they fail**

Run: `cd worker && npm test -- resolve.test.ts`

Expected: FAIL with missing migrations, repository helpers, and `/api/search/resolve`.

- [ ] **Step 3: Create the D1 schema, seed data, and resolve implementation**

```sql
-- worker/migrations/0001_generated_search.sql
DROP TABLE IF EXISTS whitelist_chars;
DROP TABLE IF EXISTS public_cards;
DROP TABLE IF EXISTS private_cards;
DROP TABLE IF EXISTS generation_jobs;

CREATE TABLE whitelist_chars (
  character TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public_cards (
  card_id TEXT PRIMARY KEY,
  character TEXT NOT NULL UNIQUE,
  payload TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE private_cards (
  card_id TEXT PRIMARY KEY,
  browser_id TEXT NOT NULL,
  character TEXT NOT NULL,
  payload TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  job_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_private_cards_browser_character
  ON private_cards(browser_id, character);

CREATE TABLE generation_jobs (
  job_id TEXT PRIMARY KEY,
  browser_id TEXT NOT NULL,
  character TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  review_notes TEXT,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  card_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_generation_jobs_character
  ON generation_jobs(character, created_at DESC);
```

```ts
// worker/data/high-frequency-whitelist.ts
export const HIGH_FREQUENCY_WHITELIST = [
  '一', '二', '三', '十', '人', '口', '手', '足', '日', '月', '山', '水', '火', '木', '土',
  '上', '下', '大', '小', '中', '天', '地', '子', '女', '父', '母', '儿', '心', '目', '耳',
  '头', '门', '车', '马', '牛', '羊', '鸟', '鱼', '虫', '田', '米', '果', '衣', '书', '本',
  '北', '南', '东', '西', '前', '后', '左', '右', '里', '外', '早', '晚', '白', '黑', '红',
  '蓝', '青', '绿', '花', '草', '树', '林', '风', '雨', '云', '雪', '星', '光', '空', '海',
]
```

```ts
// worker/src/lib/whitelist.ts
const HANZI_PATTERN = /^[\u4e00-\u9fff]$/

export function normalizeQuery(query: unknown) {
  if (typeof query !== 'string') {
    return ''
  }

  return query.trim()
}

export function isSingleHanzi(query: string) {
  return HANZI_PATTERN.test(query)
}
```

```ts
// worker/src/lib/repository.ts
import type { Env } from '../env'

export async function isWhitelisted(db: D1Database, character: string) {
  const row = await db
    .prepare('SELECT character FROM whitelist_chars WHERE character = ? AND enabled = 1')
    .bind(character)
    .first<{ character: string }>()

  return Boolean(row)
}

export async function findPublicCardId(db: D1Database, character: string) {
  const row = await db
    .prepare('SELECT card_id FROM public_cards WHERE character = ?')
    .bind(character)
    .first<{ card_id: string }>()

  return row?.card_id ?? null
}

export async function findPrivateCardId(db: D1Database, browserId: string, character: string) {
  const row = await db
    .prepare('SELECT card_id FROM private_cards WHERE browser_id = ? AND character = ?')
    .bind(browserId, character)
    .first<{ card_id: string }>()

  return row?.card_id ?? null
}

export async function seedWhitelist(db: D1Database, characters: string[]) {
  for (const character of characters) {
    await db
      .prepare('INSERT OR REPLACE INTO whitelist_chars (character, enabled) VALUES (?, 1)')
      .bind(character)
      .run()
  }
}
```

```ts
// worker/test/helpers.ts
import { readD1Migrations } from '@cloudflare/vitest-pool-workers/config'

const migrations = readD1Migrations('./migrations')

export async function applyMigrations(db: D1Database) {
  for (const migration of migrations) {
    for (const query of migration.queries) {
      await db.prepare(query).run()
    }
  }
}

export async function seedWhitelist(db: D1Database, characters: string[]) {
  for (const character of characters) {
    await db
      .prepare('INSERT OR REPLACE INTO whitelist_chars (character, enabled) VALUES (?, 1)')
      .bind(character)
      .run()
  }
}

export async function seedPrivateCard(
  db: D1Database,
  input: { browserId: string; cardId: string; character: string },
) {
  await db
    .prepare(`
      INSERT INTO private_cards (card_id, browser_id, character, payload, prompt_version, model, job_id, created_at)
      VALUES (?, ?, ?, ?, 'generated-search-v1', 'test-model', ?, ?)
    `)
    .bind(
      input.cardId,
      input.browserId,
      input.character,
      JSON.stringify({
        slug: input.cardId,
        character: input.character,
        pinyin: 'mu',
        theme: '自然',
        estimatedMinutes: 5,
        heroLine: `今天用一个小故事认识“${input.character}”。`,
        storyScene: `一棵和“${input.character}”有关的小树站在阳光里。`,
        storyText: `孩子看见树，就容易记住“${input.character}”。`,
        parentPrompt: '先看画面，再慢慢说像不像一棵树。',
        words: [`${input.character}头`, `${input.character}门`, `树${input.character}`],
        sentences: [`${input.character}门开了。`, `树${input.character}长高了。`],
        activityPrompt: '伸开手臂站一站，像一棵小树。',
      }),
      `job-${input.cardId}`,
      '2026-04-25T09:00:00.000Z',
    )
    .run()
}

export async function seedPublicCard(
  db: D1Database,
  input: { cardId: string; character: string },
) {
  await db
    .prepare(`
      INSERT INTO public_cards (card_id, character, payload, prompt_version, model, created_at)
      VALUES (?, ?, ?, 'generated-search-v1', 'test-model', ?)
    `)
    .bind(
      input.cardId,
      input.character,
      JSON.stringify({
        slug: input.cardId,
        character: input.character,
        pinyin: 'mu',
        theme: '自然',
        estimatedMinutes: 5,
        heroLine: `今天用一个小故事认识“${input.character}”。`,
        storyScene: `一棵和“${input.character}”有关的小树站在阳光里。`,
        storyText: `孩子看见树，就容易记住“${input.character}”。`,
        parentPrompt: '先看画面，再慢慢说像不像一棵树。',
        words: [`${input.character}头`, `${input.character}门`, `树${input.character}`],
        sentences: [`${input.character}门开了。`, `树${input.character}长高了。`],
        activityPrompt: '伸开手臂站一站，像一棵小树。',
      }),
      '2026-04-25T09:00:00.000Z',
    )
    .run()
}
```

```ts
// worker/src/lib/ids.ts
export function createJobId(query: string) {
  return `job-${query}-${crypto.randomUUID()}`
}

export function createPrivateCardId(query: string) {
  return `priv-${query}-${crypto.randomUUID()}`
}
```

```ts
// worker/src/index.ts (add resolve route)
import { findPrivateCardId, findPublicCardId, isWhitelisted } from './lib/repository'
import { normalizeQuery, isSingleHanzi } from './lib/whitelist'

// inside fetch():
if (request.method === 'POST' && url.pathname === '/api/search/resolve') {
  const { query } = (await request.json()) as { query?: unknown }
  const normalized = normalizeQuery(query)
  const browserId = request.headers.get('x-browser-id') ?? ''

  if (!browserId || !isSingleHanzi(normalized)) {
    return json({ error: 'Invalid search payload' }, { status: 400 }, request, env)
  }

  if (!(await isWhitelisted(env.DB, normalized))) {
    return json({ status: 'unsupported', query: normalized }, { status: 200 }, request, env)
  }

  const publicCardId = await findPublicCardId(env.DB, normalized)
  if (publicCardId) {
    return json(
      { status: 'ready_public', query: normalized, cardId: publicCardId },
      { status: 200 },
      request,
      env,
    )
  }

  const privateCardId = await findPrivateCardId(env.DB, browserId, normalized)
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
```

- [ ] **Step 4: Run the resolve tests**

Run: `cd worker && npm test -- resolve.test.ts`

Expected: PASS with all search-resolution cases green.

- [ ] **Step 5: Commit**

```bash
git add worker/migrations/0001_generated_search.sql worker/data/high-frequency-whitelist.ts worker/src/lib/ids.ts worker/src/lib/repository.ts worker/src/lib/whitelist.ts worker/test/helpers.ts worker/test/resolve.test.ts worker/src/index.ts
git commit -m "feat: add generated search resolution storage"
```

### Task 3: Implement structured generation, review, retries, and private caching

**Files:**
- Create: `worker/src/lib/validation.ts`
- Create: `worker/src/lib/openai.ts`
- Create: `worker/src/lib/generation.ts`
- Test: `worker/test/generate.test.ts`
- Modify: `worker/src/env.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/src/lib/repository.ts`

- [ ] **Step 1: Write the failing generate-route tests**

```ts
// worker/test/generate.test.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyMigrations, seedWhitelist } from './helpers'
import { createWorker } from '../src/index'
import type { CardGenerator } from '../src/lib/generation'

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

describe('generate endpoint', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB)
    await seedWhitelist(env.DB, ['木'])
  })

  it('retries once and stores a private card when the repaired output passes', async () => {
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

    const worker = createWorker({ generator })
    const response = await worker.fetch(
      new Request('http://example.com/api/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '木' }),
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'ready_private',
      query: '木',
      cardId: expect.stringContaining('priv-'),
      attempts: 2,
    })
  })

  it('fails after three bad attempts', async () => {
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

    const worker = createWorker({ generator })
    const response = await worker.fetch(
      new Request('http://example.com/api/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-browser-id': 'browser-alpha',
        },
        body: JSON.stringify({ query: '木' }),
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'failed',
      query: '木',
      reason: 'quality_gate',
      attempts: 3,
    })
  })
})
```

- [ ] **Step 2: Run the generate tests to verify they fail**

Run: `cd worker && npm test -- generate.test.ts`

Expected: FAIL with missing `createWorker`, generator interface, validation, and `/api/generate`.

- [ ] **Step 3: Implement runtime validation, generator abstraction, and `/api/generate`**

```ts
// worker/src/lib/validation.ts
export interface HanziCardPayload {
  slug: string
  character: string
  pinyin: string
  theme: string
  estimatedMinutes: number
  heroLine: string
  storyScene: string
  storyText: string
  parentPrompt: string
  words: string[]
  sentences: string[]
  activityPrompt: string
}

export function validateGeneratedCard(card: HanziCardPayload, query: string) {
  const issues: string[] = []

  if (card.character !== query) issues.push('character mismatch')
  if (card.estimatedMinutes !== 5) issues.push('estimatedMinutes must be 5')
  if (card.words.length !== 3) issues.push('must return exactly 3 words')
  if (card.sentences.length !== 2) issues.push('must return exactly 2 sentences')
  if (!card.words.some((word) => word.includes(query))) issues.push('words must include the character')
  if (!card.sentences.some((sentence) => sentence.includes(query))) issues.push('sentences must include the character')
  if (/甲骨文|部首|象形字/.test(card.parentPrompt)) issues.push('parentPrompt sounds like a lecture')
  if (card.activityPrompt.length < 6) issues.push('activityPrompt too short')

  return issues
}
```

```ts
// worker/src/lib/generation.ts
import type { Env } from '../env'
import { createPrivateCardId, createJobId } from './ids'
import { insertGenerationJob, finishGenerationJob, savePrivateCard } from './repository'
import { validateGeneratedCard, type HanziCardPayload } from './validation'

export interface CardReviewResult {
  passed: boolean
  issues: string[]
}

export interface CardGenerator {
  generateCard(input: { query: string }): Promise<HanziCardPayload>
  repairCard(input: { query: string; previous: HanziCardPayload; issues: string[] }): Promise<HanziCardPayload>
  reviewCard(input: { query: string; card: HanziCardPayload }): Promise<CardReviewResult>
}

export async function generatePrivateCard(
  env: Env,
  browserId: string,
  query: string,
  generator: CardGenerator,
) {
  const jobId = createJobId(query)
  await insertGenerationJob(env.DB, {
    jobId,
    browserId,
    character: query,
    status: 'running',
  })

  let attempts = 0
  let issues: string[] = []
  let candidate = await generator.generateCard({ query })

  while (attempts < 3) {
    attempts += 1
    const ruleIssues = validateGeneratedCard(candidate, query)
    const review = ruleIssues.length
      ? { passed: false, issues: ruleIssues }
      : await generator.reviewCard({ query, card: candidate })

    if (review.passed) {
      const cardId = createPrivateCardId(query)
      await savePrivateCard(env.DB, {
        cardId,
        browserId,
        character: query,
        payload: candidate,
        jobId,
        model: env.OPENAI_MODEL,
        promptVersion: 'generated-search-v1',
      })
      await finishGenerationJob(env.DB, {
        jobId,
        status: 'ready_private',
        cardId,
        attempts,
      })

      return {
        status: 'ready_private' as const,
        query,
        cardId,
        attempts,
      }
    }

    issues = review.issues
    if (attempts === 1) {
      candidate = await generator.repairCard({ query, previous: candidate, issues })
      continue
    }

    if (attempts === 2) {
      candidate = await generator.generateCard({ query })
      continue
    }
  }

  await finishGenerationJob(env.DB, {
    jobId,
    status: 'failed',
    attempts,
    failureReason: 'quality_gate',
    reviewNotes: issues.join('; '),
  })

  return {
    status: 'failed' as const,
    query,
    reason: 'quality_gate' as const,
    attempts,
  }
}
```

```ts
// worker/src/lib/repository.ts (append write helpers)
export async function insertGenerationJob(
  db: D1Database,
  input: { jobId: string; browserId: string; character: string; status: string },
) {
  await db
    .prepare(`
      INSERT INTO generation_jobs (job_id, browser_id, character, status, prompt_version, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'generated-search-v1', 'pending-model', ?, ?)
    `)
    .bind(
      input.jobId,
      input.browserId,
      input.character,
      input.status,
      new Date().toISOString(),
      new Date().toISOString(),
    )
    .run()
}

export async function savePrivateCard(
  db: D1Database,
  input: {
    cardId: string
    browserId: string
    character: string
    payload: unknown
    jobId: string
    model: string
    promptVersion: string
  },
) {
  await db
    .prepare(`
      INSERT INTO private_cards (card_id, browser_id, character, payload, prompt_version, model, job_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      input.cardId,
      input.browserId,
      input.character,
      JSON.stringify(input.payload),
      input.promptVersion,
      input.model,
      input.jobId,
      new Date().toISOString(),
    )
    .run()
}

export async function finishGenerationJob(
  db: D1Database,
  input: {
    jobId: string
    status: string
    attempts: number
    cardId?: string
    failureReason?: string
    reviewNotes?: string
  },
) {
  await db
    .prepare(`
      UPDATE generation_jobs
      SET status = ?, attempt_count = ?, card_id = ?, failure_reason = ?, review_notes = ?, updated_at = ?
      WHERE job_id = ?
    `)
    .bind(
      input.status,
      input.attempts,
      input.cardId ?? null,
      input.failureReason ?? null,
      input.reviewNotes ?? null,
      new Date().toISOString(),
      input.jobId,
    )
    .run()
}
```

```ts
// worker/src/lib/openai.ts
import type { Env } from '../env'
import type { CardGenerator, CardReviewResult } from './generation'
import type { HanziCardPayload } from './validation'

const hanziCardSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'slug',
    'character',
    'pinyin',
    'theme',
    'estimatedMinutes',
    'heroLine',
    'storyScene',
    'storyText',
    'parentPrompt',
    'words',
    'sentences',
    'activityPrompt',
  ],
  properties: {
    slug: { type: 'string' },
    character: { type: 'string' },
    pinyin: { type: 'string' },
    theme: { type: 'string' },
    estimatedMinutes: { type: 'number' },
    heroLine: { type: 'string' },
    storyScene: { type: 'string' },
    storyText: { type: 'string' },
    parentPrompt: { type: 'string' },
    words: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
    sentences: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
    activityPrompt: { type: 'string' },
  },
} as const

async function openaiJson<T>(env: Env, body: unknown) {
  const response = await fetch(`${env.OPENAI_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`)
  }

  const data = await response.json<{
    choices: Array<{ message: { content: string } }>
  }>()

  return JSON.parse(data.choices[0]!.message.content) as T
}

export function createOpenAIGenerator(env: Env): CardGenerator {
  return {
    async generateCard({ query }) {
      return openaiJson<HanziCardPayload>(env, {
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'Return only JSON for a parent-led Hanzi card.' },
          { role: 'user', content: `Generate a 5-minute Hanzi card for "${query}".` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'hanzi_card',
            strict: true,
            schema: hanziCardSchema,
          },
        },
      })
    },
    async repairCard({ query, previous, issues }) {
      return openaiJson<HanziCardPayload>(env, {
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'Repair the JSON card without changing the target Hanzi.' },
          {
            role: 'user',
            content: JSON.stringify({ query, previous, issues }),
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'hanzi_card_repair',
            strict: true,
            schema: hanziCardSchema,
          },
        },
      })
    },
    async reviewCard({ query, card }) {
      return openaiJson<CardReviewResult>(env, {
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'Review whether this Hanzi card is safe and parent-friendly.' },
          {
            role: 'user',
            content: JSON.stringify({ query, card }),
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'hanzi_card_review',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['passed', 'issues'],
              properties: {
                passed: { type: 'boolean' },
                issues: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      })
    },
  }
}
```

```ts
// worker/src/index.ts (dependency injection)
import { createOpenAIGenerator } from './lib/openai'
import { generatePrivateCard, type CardGenerator } from './lib/generation'

export function createWorker(overrides: { generator?: CardGenerator } = {}): ExportedHandler<Env> {
  return {
    async fetch(request, env) {
      const generator = overrides.generator ?? createOpenAIGenerator(env)
      // keep existing routes...
      if (request.method === 'POST' && url.pathname === '/api/generate') {
        const { query } = (await request.json()) as { query?: unknown }
        const normalized = normalizeQuery(query)
        const browserId = request.headers.get('x-browser-id') ?? ''

        if (!browserId || !isSingleHanzi(normalized) || !(await isWhitelisted(env.DB, normalized))) {
          return json({ error: 'Invalid generation payload' }, { status: 400 }, request, env)
        }

        const result = await generatePrivateCard(env, browserId, normalized, generator)
        return json(result, { status: 200 }, request, env)
      }
    },
  }
}

export default createWorker()
```

- [ ] **Step 4: Run the generate tests**

Run: `cd worker && npm test -- generate.test.ts`

Expected: PASS with one repaired-success case and one quality-gate failure case.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/validation.ts worker/src/lib/openai.ts worker/src/lib/generation.ts worker/src/lib/repository.ts worker/src/index.ts worker/test/generate.test.ts
git commit -m "feat: add structured generation pipeline"
```

### Task 4: Add card fetch, admin list/promote endpoints, and Worker read paths

**Files:**
- Create: `worker/src/lib/admin.ts`
- Test: `worker/test/cards-admin.test.ts`
- Modify: `worker/src/lib/repository.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: Write the failing card-fetch and admin tests**

```ts
// worker/test/cards-admin.test.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../src/index'
import { applyMigrations, seedPrivateCard, seedPublicCard, seedWhitelist } from './helpers'

describe('cards and admin endpoints', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB)
    await seedWhitelist(env.DB, ['木'])
    await seedPrivateCard(env.DB, {
      browserId: 'browser-alpha',
      cardId: 'priv-mu-001',
      character: '木',
    })
    await seedPublicCard(env.DB, {
      cardId: 'pub-mu-001',
      character: '木',
    })
  })

  it('returns a private card only to the owning browser', async () => {
    const response = await worker.fetch(
      new Request('http://example.com/api/cards/priv-mu-001', {
        headers: {
          'x-browser-id': 'browser-alpha',
        },
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

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
    const response = await worker.fetch(
      new Request('http://example.com/api/cards/priv-mu-001', {
        headers: {
          'x-browser-id': 'browser-beta',
        },
      }),
      env,
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    expect(response.status).toBe(403)
  })

  it('lists recent private cards for an authenticated admin', async () => {
    const response = await worker.fetch(
      new Request('http://example.com/api/admin/private-cards', {
        headers: {
          authorization: 'Bearer test-admin-token',
        },
      }),
      {
        ...env,
        ADMIN_TOKEN: 'test-admin-token',
      },
      createExecutionContext(),
    )
    await waitOnExecutionContext()

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
    const response = await worker.fetch(
      new Request('http://example.com/api/admin/promote', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-admin-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ cardId: 'priv-mu-001' }),
      }),
      {
        ...env,
        ADMIN_TOKEN: 'test-admin-token',
      },
      createExecutionContext(),
    )
    await waitOnExecutionContext()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'ready_public',
      cardId: 'priv-mu-001',
      character: '木',
    })
  })
})
```

- [ ] **Step 2: Run the card/admin tests to verify they fail**

Run: `cd worker && npm test -- cards-admin.test.ts`

Expected: FAIL because `/api/cards/:cardId`, admin auth, and promote endpoints do not exist yet.

- [ ] **Step 3: Implement card lookup, admin auth, and promotion**

```ts
// worker/src/lib/admin.ts
import type { Env } from '../env'

export function assertAdmin(request: Request, env: Env) {
  const auth = request.headers.get('authorization')

  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
}
```

```ts
// worker/src/lib/repository.ts (add read/promote helpers)
export async function findCardForBrowser(db: D1Database, cardId: string, browserId: string) {
  const publicRow = await db
    .prepare('SELECT card_id, payload FROM public_cards WHERE card_id = ?')
    .bind(cardId)
    .first<{ card_id: string; payload: string }>()

  if (publicRow) {
    return {
      cardId: publicRow.card_id,
      access: 'ready_public' as const,
      card: JSON.parse(publicRow.payload),
    }
  }

  const privateRow = await db
    .prepare('SELECT card_id, payload FROM private_cards WHERE card_id = ? AND browser_id = ?')
    .bind(cardId, browserId)
    .first<{ card_id: string; payload: string }>()

  if (!privateRow) {
    return null
  }

  return {
    cardId: privateRow.card_id,
    access: 'ready_private' as const,
    card: JSON.parse(privateRow.payload),
  }
}

export async function promotePrivateCard(db: D1Database, cardId: string) {
  const privateRow = await db
    .prepare('SELECT character, payload, prompt_version, model FROM private_cards WHERE card_id = ?')
    .bind(cardId)
    .first<{ character: string; payload: string; prompt_version: string; model: string }>()

  if (!privateRow) {
    return null
  }

  await db
    .prepare(`
      INSERT OR REPLACE INTO public_cards (card_id, character, payload, prompt_version, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      cardId,
      privateRow.character,
      privateRow.payload,
      privateRow.prompt_version,
      privateRow.model,
      new Date().toISOString(),
    )
    .run()

  return {
    status: 'ready_public' as const,
    cardId,
    character: privateRow.character,
  }
}

export async function listRecentPrivateCards(db: D1Database) {
  const result = await db
    .prepare(`
      SELECT card_id, browser_id, character, created_at
      FROM private_cards
      ORDER BY created_at DESC
      LIMIT 20
    `)
    .all<{ card_id: string; browser_id: string; character: string; created_at: string }>()

  return result.results.map((row) => ({
    cardId: row.card_id,
    browserId: row.browser_id,
    character: row.character,
    createdAt: row.created_at,
  }))
}
```

```ts
// worker/src/index.ts (add card + admin routes)
import { assertAdmin } from './lib/admin'
import { findCardForBrowser, listRecentPrivateCards, promotePrivateCard } from './lib/repository'

if (request.method === 'GET' && url.pathname.startsWith('/api/cards/')) {
  const cardId = url.pathname.replace('/api/cards/', '')
  const browserId = request.headers.get('x-browser-id') ?? ''
  const document = await findCardForBrowser(env.DB, cardId, browserId)

  if (!document) {
    return json({ error: 'Card not found' }, { status: 403 }, request, env)
  }

  return json(document, { status: 200 }, request, env)
}

if (request.method === 'POST' && url.pathname === '/api/admin/promote') {
  assertAdmin(request, env)
  const { cardId } = (await request.json()) as { cardId: string }
  const result = await promotePrivateCard(env.DB, cardId)

  if (!result) {
    return json({ error: 'Card not found' }, { status: 404 }, request, env)
  }

  return json(result, { status: 200 }, request, env)
}

if (request.method === 'GET' && url.pathname === '/api/admin/private-cards') {
  assertAdmin(request, env)
  return json(await listRecentPrivateCards(env.DB), { status: 200 }, request, env)
}
```

- [ ] **Step 4: Run the card/admin tests**

Run: `cd worker && npm test -- cards-admin.test.ts`

Expected: PASS with private access control and admin promotion working.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/admin.ts worker/src/lib/repository.ts worker/src/index.ts worker/test/cards-admin.test.ts
git commit -m "feat: add generated card read and promote endpoints"
```

### Task 5: Connect homepage search to the generated-search API

**Files:**
- Create: `app/src/lib/browser-id.ts`
- Create: `app/src/lib/api/contracts.ts`
- Create: `app/src/lib/api/client.ts`
- Modify: `app/src/features/home/HomePage.tsx`
- Modify: `app/src/features/home/HomePage.test.tsx`

- [ ] **Step 1: Write the failing homepage generated-search tests**

```tsx
// app/src/features/home/HomePage.test.tsx (append cases)
it('shows an unsupported message when the API rejects the searched Hanzi', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ status: 'unsupported', query: '火' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '火')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(await screen.findByRole('status')).toHaveTextContent('首版暂不支持这个字')
})

it('generates a private card and navigates to the returned card id', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'needs_generation', query: '木' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ready_private', query: '木', cardId: 'priv-mu-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '木')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(await screen.findByTestId('location')).toHaveTextContent('/cards/priv-mu-001')
})
```

- [ ] **Step 2: Run the homepage tests to verify they fail**

Run: `cd app && npm test -- src/features/home/HomePage.test.tsx`

Expected: FAIL because there is no browser id, API client, or async search flow.

- [ ] **Step 3: Add browser identity, typed API client, and async homepage search**

```ts
// app/src/lib/browser-id.ts
const STORAGE_KEY = 'hanzi-h5-browser-id'

export function getBrowserId() {
  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) {
    return existing
  }

  const next = crypto.randomUUID()
  window.localStorage.setItem(STORAGE_KEY, next)
  return next
}
```

```ts
// app/src/lib/api/contracts.ts
export type ResolveSearchResponse =
  | { status: 'unsupported'; query: string }
  | { status: 'needs_generation'; query: string }
  | { status: 'ready_private'; query: string; cardId: string }
  | { status: 'ready_public'; query: string; cardId: string }

export type GenerateCardResponse =
  | { status: 'ready_private'; query: string; cardId: string; attempts: number }
  | { status: 'failed'; query: string; reason: 'quality_gate'; attempts: number }
```

```ts
// app/src/lib/api/client.ts
import { getBrowserId } from '../browser-id'
import type { GenerateCardResponse, ResolveSearchResponse } from './contracts'

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
  return request<GenerateCardResponse>('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export function fetchCardDocument(cardId: string) {
  return request<{
    cardId: string
    access: 'ready_private' | 'ready_public'
    card: {
      slug: string
      character: string
      pinyin: string
      theme: string
      estimatedMinutes: number
      heroLine: string
      storyScene: string
      storyText: string
      parentPrompt: string
      words: string[]
      sentences: string[]
      activityPrompt: string
    }
  }>(`/api/cards/${cardId}`)
}
```

```tsx
// app/src/features/home/HomePage.tsx
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { findCardByQuery, getDailyCard } from '../../content/cards'
import { generateCard, resolveSearch } from '../../lib/api/client'

export function HomePage() {
  const navigate = useNavigate()
  const dailyCard = getDailyCard()!
  const [query, setQuery] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const trimmedQuery = query.trim()

  async function openQuery(event: FormEvent) {
    event.preventDefault()
    if (!trimmedQuery || isSearching) {
      return
    }

    const card = findCardByQuery(trimmedQuery)
    if (card) {
      setStatusMessage('')
      navigate(`/cards/${card.slug}`)
      return
    }

    setIsSearching(true)

    try {
      const resolved = await resolveSearch(trimmedQuery)

      if (resolved.status === 'unsupported') {
        setStatusMessage('首版暂不支持这个字')
        return
      }

      if (resolved.status === 'ready_private' || resolved.status === 'ready_public') {
        setStatusMessage('')
        navigate(`/cards/${resolved.cardId}`)
        return
      }

      setStatusMessage('正在为你准备...')
      const generated = await generateCard(trimmedQuery)

      if (generated.status === 'ready_private') {
        setStatusMessage('')
        navigate(`/cards/${generated.cardId}`)
        return
      }

      setStatusMessage('这个字还没准备好')
    } catch {
      setStatusMessage('网络有点忙，请再试一次')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <section className="hero-stack">
      {/* keep existing curated hero */}
      <form className="panel-card" onSubmit={openQuery}>
        <label htmlFor="card-query">搜一个字</label>
        <input
          id="card-query"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (statusMessage) setStatusMessage('')
          }}
        />
        <button type="submit" disabled={!trimmedQuery || isSearching}>
          {isSearching ? '正在准备...' : '打开这个字卡'}
        </button>
        {statusMessage ? (
          <p className="field-hint" role="status" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </form>
    </section>
  )
}
```

- [ ] **Step 4: Run the homepage tests**

Run: `cd app && npm test -- src/features/home/HomePage.test.tsx`

Expected: PASS with local curated hits preserved and remote generated-search states green.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/browser-id.ts app/src/lib/api/contracts.ts app/src/lib/api/client.ts app/src/features/home/HomePage.tsx app/src/features/home/HomePage.test.tsx
git commit -m "feat: connect home search to generated card api"
```

### Task 6: Load remote card documents and support generated-card progress

**Files:**
- Create: `app/src/lib/cards/loadCardDocument.ts`
- Modify: `app/src/content/types.ts`
- Modify: `app/src/features/card/CardPage.tsx`
- Modify: `app/src/features/card/CardPage.test.tsx`
- Modify: `app/src/lib/progress/store.ts`
- Modify: `app/src/lib/progress/store.test.ts`
- Modify: `app/src/features/profile/ProfilePage.tsx`
- Modify: `app/src/features/profile/ProfilePage.test.tsx`
- Modify: `app/src/app/App.tsx`
- Modify: `app/src/app/App.flow.test.tsx`

- [ ] **Step 1: Write the failing remote-card and progress tests**

```tsx
// app/src/features/card/CardPage.test.tsx (append case)
it('loads a generated private card from the API and saves progress by card id', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        cardId: 'priv-mu-001',
        access: 'ready_private',
        card: {
          slug: 'generated-mu',
          character: '木',
          pinyin: 'mu',
          theme: '自然',
          estimatedMinutes: 5,
          heroLine: '今天用一个小故事认识“木”。',
          storyScene: '一棵小树站在阳光里。',
          storyText: '孩子看见树，就容易记住“木”。',
          parentPrompt: '先让孩子看画面，再问像不像树。',
          words: ['木头', '木门', '树木'],
          sentences: ['木门打开了。', '树木长高了。'],
          activityPrompt: '伸开手臂站一站，像一棵树。',
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    ),
  )

  renderApp('/cards/priv-mu-001')

  expect(await screen.findByRole('heading', { name: '木' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '今天这张读完了' }))

  expect(readProgress()['priv-mu-001']).toMatchObject({
    completed: true,
    character: '木',
    source: 'ready_private',
  })
})
```

```tsx
// app/src/features/profile/ProfilePage.test.tsx (replace local-only assumption)
it('shows generated-card snapshots from progress storage', () => {
  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify({
      'priv-mu-001': {
        cardId: 'priv-mu-001',
        character: '木',
        source: 'ready_private',
        completed: true,
        favorite: true,
        lastOpenedAt: '2026-04-25T09:00:00.000Z',
      },
    }),
  )

  render(
    <MemoryRouter initialEntries={['/me']}>
      <App />
    </MemoryRouter>,
  )

  expect(screen.getByText('学过 1 张')).toBeInTheDocument()
  expect(screen.getByText('收藏 1 张')).toBeInTheDocument()
  expect(screen.getByText('木')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the card/profile/progress tests to verify they fail**

Run:

```bash
cd app
npm test -- src/features/card/CardPage.test.tsx
npm test -- src/features/profile/ProfilePage.test.tsx
npm test -- src/lib/progress/store.test.ts
```

Expected: FAIL because card loading is still slug-only and progress entries do not store generated metadata.

- [ ] **Step 3: Add local-or-remote card loading and cardId-based progress snapshots**

```ts
// app/src/content/types.ts
export interface HanziCard {
  slug: string
  character: string
  pinyin: string
  theme: string
  estimatedMinutes: number
  heroLine: string
  storyScene: string
  storyText: string
  parentPrompt: string
  words: string[]
  sentences: string[]
  activityPrompt: string
}

export interface CardDocument {
  cardId: string
  access: 'curated' | 'ready_private' | 'ready_public'
  card: HanziCard
}

export interface ProgressSnapshot {
  cardId: string
  character: string
  source: 'curated' | 'ready_private' | 'ready_public'
}
```

```ts
// app/src/lib/cards/loadCardDocument.ts
import { getCardBySlug } from '../../content/cards'
import type { CardDocument } from '../../content/types'
import { fetchCardDocument } from '../api/client'

export async function loadCardDocument(cardId: string): Promise<CardDocument | null> {
  const curated = getCardBySlug(cardId)
  if (curated) {
    return {
      cardId: curated.slug,
      access: 'curated',
      card: curated,
    }
  }

  return fetchCardDocument(cardId)
}
```

```ts
// app/src/lib/progress/store.ts
const PROGRESS_STORAGE_KEY = 'hanzi-h5-progress'

export type CardProgress = {
  cardId: string
  character: string
  source: 'curated' | 'ready_private' | 'ready_public'
  completed: boolean
  favorite: boolean
  lastOpenedAt: string | null
}

export type ProgressMap = Record<string, CardProgress>

function createEmptyProgress(snapshot: { cardId: string; character: string; source: CardProgress['source'] }): CardProgress {
  return {
    ...snapshot,
    completed: false,
    favorite: false,
    lastOpenedAt: null,
  }
}

function updateProgress(
  snapshot: { cardId: string; character: string; source: CardProgress['source'] },
  updater: (entry: CardProgress) => CardProgress,
) {
  const progress = readStoredProgress()
  const nextEntry = updater(progress[snapshot.cardId] ?? createEmptyProgress(snapshot))

  writeProgress({
    ...progress,
    [snapshot.cardId]: nextEntry,
  })
}

export function markCompleted(snapshot: { cardId: string; character: string; source: CardProgress['source'] }) {
  updateProgress(snapshot, (entry) => ({
    ...entry,
    completed: true,
    lastOpenedAt: new Date().toISOString(),
  }))
}

export function toggleFavorite(snapshot: { cardId: string; character: string; source: CardProgress['source'] }) {
  updateProgress(snapshot, (entry) => ({
    ...entry,
    favorite: !entry.favorite,
    lastOpenedAt: new Date().toISOString(),
  }))
}
```

```tsx
// app/src/features/card/CardPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadCardDocument } from '../../lib/cards/loadCardDocument'
import { markCompleted, toggleFavorite, readProgress } from '../../lib/progress/store'

export function CardPage() {
  const navigate = useNavigate()
  const { cardId = '' } = useParams()
  const [document, setDocument] = useState<CardDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const readingFlowRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    loadCardDocument(cardId)
      .then((nextDocument) => {
        if (!cancelled) {
          setDocument(nextDocument)
          setIsFavorite(readProgress()[cardId]?.favorite ?? false)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cardId])

  if (isLoading) {
    return <section className="panel-card"><p>正在把这张字卡拿给你...</p></section>
  }

  if (!document) {
    return (
      <section className="panel-card card-missing">
        <h1>这张字卡暂时还看不了</h1>
        <p>先回首页，我们再换一个已经准备好的字。</p>
        <button type="button" onClick={() => navigate('/')}>回首页看看</button>
      </section>
    )
  }

  const { card, access } = document
  const snapshot = { cardId: document.cardId, character: card.character, source: access }
  // keep the existing rendering and switch markCompleted/toggleFavorite to snapshot-based calls
}
```

```tsx
// app/src/features/profile/ProfilePage.tsx
import { Link } from 'react-router-dom'
import { readProgress } from '../../lib/progress/store'

export function ProfilePage() {
  const progress = Object.values(readProgress()).filter((entry) => entry.completed || entry.favorite)
  const completedCount = progress.filter((entry) => entry.completed).length
  const favoriteCount = progress.filter((entry) => entry.favorite).length

  return (
    <section className="panel-card">
      <h1>我的</h1>
      <p>学过 {completedCount} 张</p>
      <p>收藏 {favoriteCount} 张</p>
      <ul className="card-list">
        {progress.map((entry) => (
          <li key={entry.cardId}>
            <Link to={`/cards/${entry.cardId}`}>{entry.character}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

```tsx
// app/src/app/App.tsx
<Route path="/cards/:cardId" element={<CardPage />} />
```

- [ ] **Step 4: Run the app flow, card, profile, and progress tests**

Run:

```bash
cd app
npm test -- src/features/card/CardPage.test.tsx
npm test -- src/features/profile/ProfilePage.test.tsx
npm test -- src/lib/progress/store.test.ts
npm test -- src/app/App.flow.test.tsx
```

Expected: PASS with curated cards still working and generated-card progress snapshots stored by `cardId`.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/cards/loadCardDocument.ts app/src/content/types.ts app/src/features/card/CardPage.tsx app/src/features/card/CardPage.test.tsx app/src/lib/progress/store.ts app/src/lib/progress/store.test.ts app/src/features/profile/ProfilePage.tsx app/src/features/profile/ProfilePage.test.tsx app/src/app/App.tsx app/src/app/App.flow.test.tsx
git commit -m "feat: load generated cards and track progress by card id"
```

### Task 7: Add the minimal admin console and deployment wiring

**Files:**
- Create: `app/src/features/admin/AdminPage.tsx`
- Create: `app/src/features/admin/AdminPage.test.tsx`
- Modify: `app/src/app/App.tsx`
- Modify: `.github/workflows/deploy.yml`
- Create: `.github/workflows/deploy-api.yml`
- Create: `worker/README.md`

- [ ] **Step 1: Write the failing admin-page test**

```tsx
// app/src/features/admin/AdminPage.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'

it('lets an operator paste a token, inspect private cards, and promote one', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { cardId: 'priv-mu-001', character: '木', browserId: 'browser-alpha', createdAt: '2026-04-25T09:00:00.000Z' },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ status: 'ready_public', cardId: 'priv-mu-001', character: '木' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  )

  await user.type(screen.getByLabelText(/管理员 token/i), 'test-admin-token')
  await user.click(screen.getByRole('button', { name: /加载生成记录/i }))
  await user.click(await screen.findByRole('button', { name: /提升为公共缓存/i }))

  expect(await screen.findByRole('status')).toHaveTextContent('已提升 木')
})
```

- [ ] **Step 2: Run the admin-page test to verify it fails**

Run: `cd app && npm test -- src/features/admin/AdminPage.test.tsx`

Expected: FAIL because there is no admin route or page.

- [ ] **Step 3: Add the admin page and deployment configuration**

```tsx
// app/src/features/admin/AdminPage.tsx
import { useState } from 'react'
import { listPrivateCards, promoteCard } from '../../lib/api/client'

export function AdminPage() {
  const [token, setToken] = useState(sessionStorage.getItem('hanzi-h5-admin-token') ?? '')
  const [items, setItems] = useState<Array<{ cardId: string; character: string; browserId: string; createdAt: string }>>([])
  const [statusMessage, setStatusMessage] = useState('')

  async function loadItems() {
    sessionStorage.setItem('hanzi-h5-admin-token', token)
    const nextItems = await listPrivateCards(token)
    setItems(nextItems)
    setStatusMessage('')
  }

  async function promote(cardId: string) {
    const result = await promoteCard(token, cardId)
    setStatusMessage(`已提升 ${result.character}`)
    setItems((current) => current.filter((item) => item.cardId !== cardId))
  }

  return (
    <section className="panel-card">
      <h1>生成管理</h1>
      <label htmlFor="admin-token">管理员 token</label>
      <input id="admin-token" value={token} onChange={(event) => setToken(event.target.value)} />
      <button type="button" onClick={loadItems}>加载生成记录</button>
      {statusMessage ? <p role="status">{statusMessage}</p> : null}
      <ul className="card-list">
        {items.map((item) => (
          <li key={item.cardId}>
            {item.character} · {item.browserId}
            <button type="button" onClick={() => promote(item.cardId)}>
              提升为公共缓存
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

```ts
// app/src/lib/api/client.ts (append admin helpers)
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
  return request<{ status: 'ready_public'; cardId: string; character: string }>('/api/admin/promote', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ cardId }),
  })
}
```

```tsx
// app/src/app/App.tsx
import { AdminPage } from '../features/admin/AdminPage'

<Route path="/admin" element={<AdminPage />} />
```

```yaml
# .github/workflows/deploy.yml
      - name: Build GitHub Pages bundle
        working-directory: app
        env:
          VITE_HANZI_API_BASE_URL: ${{ vars.HANZI_API_BASE_URL }}
        run: npm run build:pages
```

```yaml
# .github/workflows/deploy-api.yml
name: Deploy generated search API

on:
  push:
    branches: ["main"]
    paths:
      - "worker/**"
      - ".github/workflows/deploy-api.yml"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: worker/package-lock.json

      - name: Install Worker dependencies
        working-directory: worker
        run: npm ci

      - name: Apply D1 migrations
        working-directory: worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler d1 migrations apply family-generated-search --remote

      - name: Deploy Worker
        working-directory: worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ADMIN_TOKEN: ${{ secrets.GENERATED_SEARCH_ADMIN_TOKEN }}
        run: npx wrangler deploy
```

```md
<!-- worker/README.md -->
# Generated Search Worker

## Local development

1. `cd worker && npm install`
2. Copy `.dev.vars.example` to `.dev.vars`
3. Create the D1 database: `npx wrangler d1 create family-generated-search`
4. Put the returned `database_id` into `wrangler.jsonc`
5. Apply migrations locally: `npx wrangler d1 migrations apply family-generated-search --local`
6. Start the worker: `npm run dev`

## Required GitHub configuration

- Repository variable: `HANZI_API_BASE_URL`
- Repository secrets:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `OPENAI_API_KEY`
  - `GENERATED_SEARCH_ADMIN_TOKEN`
```

- [ ] **Step 4: Run the admin-page test and targeted app build**

Run:

```bash
cd app
npm test -- src/features/admin/AdminPage.test.tsx
npm run build
```

Expected:
- Admin page test PASS
- Frontend build PASS

- [ ] **Step 5: Run the Worker test suite and commit**

Run:

```bash
cd worker
npm test
```

Expected: PASS with `health`, `resolve`, `generate`, and `cards-admin` tests green.

Commit:

```bash
git add app/src/features/admin/AdminPage.tsx app/src/features/admin/AdminPage.test.tsx app/src/app/App.tsx app/src/lib/api/client.ts .github/workflows/deploy.yml .github/workflows/deploy-api.yml worker/README.md
git commit -m "feat: add generated search admin console and deploy wiring"
```

## Self-Review

- Spec coverage:
  - Whitelist-only support: Task 2
  - Private/public cache split: Tasks 2-4
  - Structured generation + retries + quality gates: Task 3
  - Anonymous browser identity: Task 5
  - Reuse existing learning page: Task 6
  - Minimal admin promote flow: Task 7
  - Deploy/config + metrics-ready job storage: Tasks 2, 3, 7
- Placeholder scan:
  - No `TODO` / `TBD` markers remain in the plan body.
  - `.dev.vars.example` and GitHub secrets are explicit configuration, not implementation placeholders.
- Type consistency:
  - Frontend progress is keyed by `cardId`, matching the route param and Worker read paths.
  - Worker search states use `unsupported / needs_generation / ready_private / ready_public / failed` consistently across tasks.
  - `HanziCard` remains the rendered payload shape across local and remote cards.
