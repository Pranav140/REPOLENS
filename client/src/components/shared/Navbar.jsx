import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'
import { LogOut, Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  if (!isAuthenticated) return null

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'RL'

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: theme === 'dark' 
        ? 'rgba(13,17,23,0.8)' 
        : 'rgba(246,248,250,0.85)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      zIndex: 100,
      justifyContent: 'space-between',
      transition: 'background var(--transition-base)'
    }}>
      {/* Logo */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
          <circle cx="11" cy="11" r="2.5" fill="#3b82f6" />
          <line x1="5" y1="11" x2="8.5" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="13.5" y1="11" x2="17" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
        <span style={{ 
          fontWeight: '700',
          fontSize: '15px',
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)'
        }}>
          RepoLens
        </span>
      </div>

      {/* Right section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-active)'
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.background = 'var(--bg-overlay)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.background = 'var(--bg-elevated)'
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} style={{ transition: 'transform 400ms', transform: 'rotate(360deg)' }} />
          ) : (
            <Moon size={16} style={{ transition: 'transform 400ms', transform: 'rotate(360deg)' }} />
          )}
        </button>

        {/* User section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid transparent',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.borderColor = 'var(--border-default)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }}
        >
          {/* Avatar */}
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1.5px solid var(--border-default)',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1.5px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {initials}
            </div>
          )}

          <span style={{
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }} className="hidden sm:block">
            {user?.username}
          </span>

          <LogOut
            size={14}
            onClick={(e) => {
              e.stopPropagation()
              logout()
            }}
            style={{
              color: 'var(--text-muted)',
              marginLeft: '4px',
              cursor: 'pointer'
            }}
            title="Logout"
          />
        </div>
      </div>
    </nav>
  )
}
