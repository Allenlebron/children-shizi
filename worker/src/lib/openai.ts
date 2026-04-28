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
          {
            role: 'system',
            content:
              'Return only JSON for a parent-led Hanzi card. Make the card warm, concrete, and easy for a parent to read aloud to a 3-6 year old child. Never explain etymology, radicals, oracle bone script, or textbook knowledge.',
          },
          {
            role: 'user',
            content: [
              `Generate a 5-minute Hanzi card for "${query}".`,
              'Hard requirements:',
              `1. character must be exactly "${query}".`,
              '2. estimatedMinutes must be exactly 5.',
              `3. words must contain exactly 3 short items, and every word must include "${query}".`,
              `4. sentences must contain exactly 2 short child-friendly sentences, and every sentence must include "${query}".`,
              '5. parentPrompt must guide the parent to point, ask, or act, not lecture.',
              '6. activityPrompt must be a simple physical or observational activity for parent and child.',
              '7. Except slug and pinyin, every user-facing string must be simplified Chinese only.',
              '8. Do not use English words or ASCII letters in theme, heroLine, storyScene, storyText, parentPrompt, words, sentences, or activityPrompt.',
            ].join('\n'),
          },
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
          {
            role: 'system',
            content:
              'Repair the JSON card without changing the target Hanzi. Return only corrected JSON. Preserve the gentle parent-led tone and satisfy every structural rule exactly.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              query,
              previous,
              issues,
              rules: [
                `character must stay exactly "${query}"`,
                `all 3 words must include "${query}"`,
                `all 2 sentences must include "${query}"`,
                'estimatedMinutes must be 5',
                'parentPrompt must not sound like a lecture',
                'every user-facing field except slug and pinyin must be simplified Chinese only',
                'do not use English words or ASCII letters in any read-aloud copy',
              ],
            }),
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
          {
            role: 'system',
            content:
              'Review whether this Hanzi card is safe, parent-friendly, and structurally correct. Be strict about whether the target Hanzi appears where it must appear.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              query,
              card,
              checklist: [
                `character must equal "${query}"`,
                `all 3 words should include "${query}"`,
                `all 2 sentences should include "${query}"`,
                'user-facing copy should be simplified Chinese only, with no English words',
                'parentPrompt should feel like guidance, not explanation',
                'the overall tone should fit a 3-6 year old child and parent read-aloud flow',
              ],
            }),
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
