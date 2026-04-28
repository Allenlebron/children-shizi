import type { HanziCardPayload } from './validation'

export interface GeneratedCardDocument {
  cardId: string
  access: 'ready_public' | 'ready_private'
  card: HanziCardPayload
}

export interface RecentPrivateCard {
  cardId: string
  browserId: string
  character: string
  createdAt: string
}

export interface PromotePrivateCardResult {
  status: 'ready_public'
  cardId: string
  character: string
}

export interface GeneratedCardRepository {
  isWhitelisted(character: string): Promise<boolean>
  findPublicCardId(character: string): Promise<string | null>
  findPrivateCardId(browserId: string, character: string): Promise<string | null>
  findCardForBrowser(cardId: string, browserId: string): Promise<GeneratedCardDocument | null>
  listRecentPrivateCards(): Promise<RecentPrivateCard[]>
  promotePrivateCard(cardId: string): Promise<PromotePrivateCardResult | null>
  insertGenerationJob(input: {
    jobId: string
    browserId: string
    character: string
    status: string
  }): Promise<void>
  savePrivateCard(input: {
    cardId: string
    browserId: string
    character: string
    payload: unknown
    jobId: string
    model: string
    promptVersion: string
  }): Promise<void>
  finishGenerationJob(input: {
    jobId: string
    status: string
    attempts: number
    cardId?: string
    failureReason?: string
    reviewNotes?: string
  }): Promise<void>
}

export function createRepository(db: D1Database): GeneratedCardRepository {
  return {
    async isWhitelisted(character: string) {
      const row = await db
        .prepare('SELECT character FROM whitelist_chars WHERE character = ? AND enabled = 1')
        .bind(character)
        .first<{ character: string }>()

      return Boolean(row)
    },
    async findPublicCardId(character: string) {
      const row = await db
        .prepare('SELECT card_id FROM public_cards WHERE character = ?')
        .bind(character)
        .first<{ card_id: string }>()

      return row?.card_id ?? null
    },
    async findPrivateCardId(browserId: string, character: string) {
      const row = await db
        .prepare('SELECT card_id FROM private_cards WHERE browser_id = ? AND character = ?')
        .bind(browserId, character)
        .first<{ card_id: string }>()

      return row?.card_id ?? null
    },
    async findCardForBrowser(cardId: string, browserId: string) {
      const publicRow = await db
        .prepare('SELECT card_id, payload FROM public_cards WHERE card_id = ?')
        .bind(cardId)
        .first<{ card_id: string; payload: string }>()

      if (publicRow) {
        return {
          cardId: publicRow.card_id,
          access: 'ready_public' as const,
          card: JSON.parse(publicRow.payload) as HanziCardPayload,
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
        card: JSON.parse(privateRow.payload) as HanziCardPayload,
      }
    },
    async listRecentPrivateCards() {
      const rows = await db
        .prepare(`
          SELECT card_id, browser_id, character, created_at
          FROM private_cards
          ORDER BY created_at DESC
          LIMIT 20
        `)
        .all<{ card_id: string; browser_id: string; character: string; created_at: string }>()

      return rows.results.map((row) => ({
        cardId: row.card_id,
        browserId: row.browser_id,
        character: row.character,
        createdAt: row.created_at,
      }))
    },
    async promotePrivateCard(cardId: string) {
      const privateRow = await db
        .prepare(`
          SELECT character, payload, prompt_version, model
          FROM private_cards
          WHERE card_id = ?
        `)
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
    },
    async insertGenerationJob(input) {
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
    },
    async savePrivateCard(input) {
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
    },
    async finishGenerationJob(input) {
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
    },
  }
}
