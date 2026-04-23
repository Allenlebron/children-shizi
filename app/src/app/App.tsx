import { Navigate, Route, Routes } from 'react-router-dom'
import { CardPage } from '../features/card/CardPage'
import { HomePage } from '../features/home/HomePage'
import { LibraryPage } from '../features/library/LibraryPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { AppShell } from '../layout/AppShell'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cards" element={<LibraryPage />} />
        <Route path="/cards/:slug" element={<CardPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
