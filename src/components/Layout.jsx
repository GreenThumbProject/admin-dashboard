import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           label: 'Fleet',          icon: '🌐' },
  { to: '/devices',    label: 'Devices',        icon: '📡' },
  { to: '/species',    label: 'Plant Species',  icon: '🌿' },
  { to: '/cultivations', label: 'Cultivations', icon: '🌱' },
  { to: '/hardware',   label: 'Hardware',       icon: '🔩' },
  { to: '/data',       label: 'Data Explorer',  icon: '📊' },
  { to: '/photos',     label: 'Photos',         icon: '📷' },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-800">
          <h1 className="text-brand-500 font-bold text-lg tracking-tight">GreenThumb</h1>
          <p className="text-gray-500 text-xs mt-0.5">Cloud Admin</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-900/60 text-brand-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
