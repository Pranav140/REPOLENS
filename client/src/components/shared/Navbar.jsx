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
        <div 
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'var(--accent-blue)',
            boxShadow: theme === 'dark' 
              ? '0 0 10px rgba(47,129,247,0.6)' 
              : '0 0 10px rgba(9,105,218,0.4)',
            animation: 'pulseGlow 2.5s ease-in-out infinite',
            '--glow-color': theme === 'dark'
              ? 'rgba(47,129,247,0.4)'
              : 'rgba(9,105,218,0.3)'
          }}
        />
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
