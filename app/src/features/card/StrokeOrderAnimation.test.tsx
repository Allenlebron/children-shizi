import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrokeOrderAnimation } from './StrokeOrderAnimation'

it('renders animated stroke order data for a supported character', () => {
  const { container } = render(<StrokeOrderAnimation character="北" />)

  expect(screen.getByText('笔顺动画')).toBeInTheDocument()
  expect(screen.getByText('北 · 5 笔')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '北 的笔顺动画' })).toBeInTheDocument()
  expect(container.querySelectorAll('.stroke-order-stroke')).toHaveLength(5)
})

it('lets families replay the stroke animation', async () => {
  const user = userEvent.setup()
  const { container } = render(<StrokeOrderAnimation character="北" />)
  const initialSvg = container.querySelector('.stroke-order-svg')

  await user.click(screen.getByRole('button', { name: '重新播放笔顺' }))

  expect(container.querySelector('.stroke-order-svg')).not.toBe(initialSvg)
})

it('shows a gentle fallback when stroke data is not available yet', () => {
  render(<StrokeOrderAnimation character="木" />)

  expect(screen.getByText('笔顺动画')).toBeInTheDocument()
  expect(screen.getByText('这个字的笔顺动画还在准备中。')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '重新播放笔顺' })).not.toBeInTheDocument()
})
