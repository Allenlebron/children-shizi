import { readFileSync } from 'node:fs'

const stylesheet = readFileSync(`${process.cwd()}/src/styles/global.css`, 'utf8')

function ruleFor(selector: string) {
  const start = stylesheet.indexOf(`${selector} {`)
  if (start === -1) {
    throw new Error(`Missing CSS rule for ${selector}`)
  }

  const end = stylesheet.indexOf('\n}', start)
  if (end === -1) {
    throw new Error(`Unclosed CSS rule for ${selector}`)
  }

  return stylesheet.slice(start, end)
}

function keyframesFor(name: string) {
  const start = stylesheet.indexOf(`@keyframes ${name} {`)
  if (start === -1) {
    throw new Error(`Missing keyframes for ${name}`)
  }

  const nextKeyframes = stylesheet.indexOf('\n@keyframes ', start + 1)

  return stylesheet.slice(start, nextKeyframes === -1 ? undefined : nextKeyframes)
}

it('keeps the reading card page vertically scrollable instead of clipping it', () => {
  expect(ruleFor('.page-shell')).not.toMatch(/overflow\s*:\s*hidden/)
  expect(ruleFor('.reading-page-card')).not.toMatch(/overflow\s*:\s*hidden/)
})

it('uses dynamic viewport height for mobile browser chrome changes', () => {
  expect(ruleFor('#root')).toMatch(/min-height\s*:\s*100dvh/)
  expect(ruleFor('.page-shell')).toMatch(/min-height\s*:\s*100dvh/)
  expect(ruleFor('.paged-reading')).toMatch(/100dvh/)
})

it('keeps keyboard focus visible on primary interactive elements', () => {
  expect(ruleFor(':where(button, a, input):focus-visible')).toMatch(/outline\s*:/)
})

it('keeps a skip link available for keyboard users', () => {
  expect(ruleFor('.skip-link')).toMatch(/position\s*:\s*fixed/)
  expect(ruleFor('.skip-link:focus')).toMatch(/translateY\(0\)/)
})

it('keeps the fixed bottom navigation safe on mobile browsers', () => {
  const bottomNav = ruleFor('.bottom-nav')

  expect(bottomNav).toMatch(/env\(safe-area-inset-bottom,\s*0px\)/)
  expect(bottomNav).toMatch(/-webkit-backdrop-filter\s*:\s*blur/)
  expect(bottomNav).toMatch(/backdrop-filter\s*:\s*blur/)
})

it('keeps SVG tree leaf positions controlled by their transform attributes', () => {
  expect(keyframesFor('profile-leaf-grow')).not.toMatch(/transform\s*:/)
})
