import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { listCards } from '../../content/cards'
import { LibraryPage } from './LibraryPage'

function renderLibrary() {
  return render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  )
}

it('presents the card library as a storybook shelf', () => {
  const { container } = renderLibrary()

  expect(screen.getByRole('heading', { name: '森林小书架' })).toBeInTheDocument()
  expect(screen.getByText('挑一本喜欢的小字卡，像翻绘本一样慢慢读。')).toBeInTheDocument()
  expect(container.querySelector('.library-shelf')).toBeInTheDocument()
  expect(container.querySelectorAll('.library-cover')).toHaveLength(listCards().length)
  expect(screen.getByRole('link', { name: '北 · 方向' })).toHaveAttribute('href', '/cards/bei')
  expect(screen.getAllByText('翻开故事')).toHaveLength(listCards().length)
})
