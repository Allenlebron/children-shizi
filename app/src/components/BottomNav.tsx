import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      <NavLink to="/">首页</NavLink>
      <NavLink to="/cards">字卡</NavLink>
      <NavLink to="/me">我的</NavLink>
    </nav>
  )
}
