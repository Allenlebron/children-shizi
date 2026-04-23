import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

export function AppShell() {
  return (
    <div className="page-shell">
      <main className="page-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
