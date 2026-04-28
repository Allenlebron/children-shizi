import { describe, expect, it } from 'vitest'
import { validateGeneratedCard, type HanziCardPayload } from '../src/lib/validation'

function card(overrides: Partial<HanziCardPayload> = {}): HanziCardPayload {
  return {
    slug: 'generated-shui',
    character: '水',
    pinyin: 'shuǐ',
    theme: '自然',
    estimatedMinutes: 5,
    heroLine: '今天一起认识水。',
    storyScene: '小杯子里有清清的水。',
    storyText: '宝宝看见水，轻轻碰一碰。',
    parentPrompt: '请指一指水在哪里，再问孩子想不想摸一摸。',
    words: ['喝水', '水杯', '清水'],
    sentences: ['宝宝喝水。', '水在杯子里。'],
    activityPrompt: '一起摸摸杯子，感觉水是凉凉的。',
    ...overrides,
  }
}

describe('validateGeneratedCard', () => {
  it('rejects English in user-facing card copy', () => {
    const issues = validateGeneratedCard(
      card({
        heroLine: "Let's learn about water!",
        storyScene: 'a sunny day at the beach',
        storyText: "We're at the beach on a sunny day.",
        parentPrompt: 'Point to a picture of water and ask: 你喜欢水吗?',
        activityPrompt: "Let's go get a glass of water.",
      }),
      '水',
    )

    expect(issues).toContain('user-facing copy must be Chinese')
  })

  it('requires every word and sentence to include the target character', () => {
    const issues = validateGeneratedCard(
      card({
        words: ['喝水', '杯子', '清水'],
        sentences: ['宝宝喝水。', '杯子在桌上。'],
      }),
      '水',
    )

    expect(issues).toContain('all words must include the character')
    expect(issues).toContain('all sentences must include the character')
  })
})
