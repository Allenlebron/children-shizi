import type { Env } from '../env'
import { createJobId, createPrivateCardId } from './ids'
import type { GeneratedCardRepository } from './repository'
import { validateGeneratedCard, type HanziCardPayload } from './validation'

export interface CardReviewResult {
  passed: boolean
  issues: string[]
}

export interface CardGenerator {
  generateCard(input: { query: string }): Promise<HanziCardPayload>
  repairCard(input: {
    query: string
    previous: HanziCardPayload
    issues: string[]
  }): Promise<HanziCardPayload>
  reviewCard(input: { query: string; card: HanziCardPayload }): Promise<CardReviewResult>
}

export async function generatePrivateCard(
  env: Env,
  repository: GeneratedCardRepository,
  browserId: string,
  query: string,
  generator: CardGenerator,
) {
  const jobId = createJobId(query)
  await repository.insertGenerationJob({
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

      await repository.savePrivateCard({
        cardId,
        browserId,
        character: query,
        payload: candidate,
        jobId,
        model: env.OPENAI_MODEL,
        promptVersion: 'generated-search-v1',
      })

      await repository.finishGenerationJob({
        jobId,
        status: 'ready_private',
        attempts,
        cardId,
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

  await repository.finishGenerationJob({
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
