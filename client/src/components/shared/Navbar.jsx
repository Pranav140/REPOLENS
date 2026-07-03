import { useAuth } from '../../hooks/useAuth'
import { LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) return null

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'RL'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '56px',
      background: 'rgba(10, 10, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', zIndex: 100,
      justifyContent: 'space-between'
    }}>
      {/* Logo */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#3b82f6',
          boxShadow: '0 0 8px rgba(59,130,246,0.8)'
        }}/>
        <span style={{ 
          fontWeight: '700', fontSize: '15px', letterSpacing: '-0.02em', color: 'white'
        }}>
          RepoLens
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-7 h-7 rounded-full border border-[#333]"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#333] flex items-center justify-center text-xs font-semibold text-white">
            {initials}
          </div>
        )}

        <span className="text-sm text-gray-300 hidden sm:block">
          {user?.username}
        </span>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </nav>
  )
}
