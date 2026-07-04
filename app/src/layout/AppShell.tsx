import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

export function AppShell() {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        跳到内容
      </a>
      <main className="page-main" id="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
