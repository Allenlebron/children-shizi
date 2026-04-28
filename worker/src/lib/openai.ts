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
          { role: 'user', content: JSON.stringify({ query, previous, issues }) },
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
          { role: 'user', content: JSON.stringify({ query, card }) },
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
