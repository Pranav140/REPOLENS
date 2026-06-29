import { useAuth } from '../../hooks/useAuth'
import { LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) return null

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'RL'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0a] border-b border-[#222] flex items-center px-6">
      {/* Logo */}
      <span className="font-bold text-white text-lg tracking-tight select-none">
        RepoLens
      </span>

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
    </header>
  )
}
