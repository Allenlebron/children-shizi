import type { HanziCard } from '../types'

export const beiCard: HanziCard = {
  slug: 'bei',
  character: '北',
  pinyin: 'bei',
  theme: '方向',
  estimatedMinutes: 5,
  heroLine: '今天用一个小故事认识“北”。',
  storyScene: '一个小朋友转过身，背朝前面站着。',
  storyText:
    '大家慢慢就把这种“转过身、背朝前面”的感觉和“北”连在了一起，所以后来一说北，很多人就会想到方向。',
  parentPrompt:
    '先和孩子一起看画面，再说“像不像一个人转过去了”，不要一上来解释术语。',
  words: ['北边', '北风', '北极熊'],
  sentences: ['北风吹来了。', '北极熊住在北边很冷的地方。'],
  activityPrompt: '我们站起来转一转，找一找哪边是北。',
}
