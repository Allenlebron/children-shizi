import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { readReviewSummary } from '../../lib/progress/store'

function renderApp(path = '/review') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('lets a child complete a three-question leaf review quest', async () => {
  renderApp()

  expect(screen.getByRole('heading', { name: '小树叶闯关' })).toBeInTheDocument()
  expect(screen.getByText('第 1 / 3 题')).toBeInTheDocument()
  expect(screen.getByText('看看画面和词语，选出正确的字。')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '水' }))
  expect(screen.getByRole('status')).toHaveTextContent('再看看画面，找找线索。')
  expect(screen.getByText('第 1 / 3 题')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '北' }))
  expect(screen.getByRole('status')).toHaveTextContent('答对啦，收集 1 片小树叶！')
  expect(screen.getByText('第 2 / 3 题')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '水' }))
  expect(screen.getByText('第 3 / 3 题')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '火' }))

  expect(screen.getByRole('heading', { name: '今天收集了 3 片小树叶' })).toBeInTheDocument()
  expect(screen.getByText('3 / 3 题答对')).toBeInTheDocument()
  expect(readReviewSummary()).toMatchObject({
    todayAttempts: 1,
    todayLeaves: 3,
    totalLeaves: 3,
  })
})
