import { useNavigate } from 'react-router-dom'
import { Star, GitFork, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

const LANG_COLORS = {
  TypeScript: '#3178C6',
  JavaScript: '#B8A800',
  Python: '#3776AB',
  'Jupyter Notebook': '#F37626',
  CSS: '#563D7C',
  JSON: '#8B949E',
  default: '#8B949E'
}

export default function RepositoryCard({ repo, index = 0 }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const langColor = LANG_COLORS[repo.language] || LANG_COLORS.default

  const analyzedDate = repo.analyzedAt
    ? new Date(repo.analyzedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const healthScore = repo.metrics?.healthScore ?? 0

  const getStatusStyle = () => {
    switch (repo.status) {
      case 'completed':
        return {
          bg: 'var(--success-bg)',
          color: 'var(--success)',
          border: 'rgba(63,185,80,0.25)',
          dotBg: 'var(--success)'
        }
      case 'analyzing':
        return {
          bg: 'var(--accent-blue-bg)',
          color: 'var(--accent-blue)',
          border: 'rgba(47,129,247,0.25)',
          dotBg: 'var(--accent-blue)'
        }
      case 'pending':
        return {
          bg: 'var(--warning-bg)',
          color: 'var(--warning)',
          border: 'rgba(210,153,34,0.25)',
          dotBg: 'var(--warning)'
        }
      case 'failed':
        return {
          bg: 'var(--danger-bg)',
          color: 'var(--danger)',
          border: 'rgba(248,81,73,0.25)',
          dotBg: 'var(--danger)'
        }
      default:
        return {
          bg: 'var(--neutral-bg)',
          color: 'var(--neutral)',
          border: 'rgba(139,148,158,0.25)',
          dotBg: 'var(--neutral)'
        }
    }
  }

  const statusStyle = getStatusStyle()

  const getHealthBarGradient = () => {
    if (healthScore >= 70) return 'linear-gradient(90deg, #3FB950, #2EA043)'
    if (healthScore >= 40) return 'linear-gradient(90deg, #D29922, #B08800)'
    return 'linear-gradient(90deg, #F85149, #E03E37)'
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'fadeSlideUp 400ms ease forwards',
        animationDelay: `${index * 80}ms`,
        opacity: 0
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/repo/${repo.owner}/${repo.name}`)}
    >
      {/* Accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, var(--accent-blue) 0%, transparent 60%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity var(--transition-base)'
      }} />

      {/* Row 1 — Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
              {repo.owner}
            </span>
            <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>
            <span>{repo.name}</span>
          </span>
        </div>
        
        {/* Status pill */}
        <div style={{
          height: '22px',
          padding: '0 8px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          background: statusStyle.bg,
          color: statusStyle.color,
          border: `1px solid ${statusStyle.border}`,
          flexShrink: 0
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: statusStyle.dotBg,
            animation: repo.status === 'analyzing' ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
            '--glow-color': statusStyle.dotBg
          }} />
          {repo.status}
        </div>
      </div>

      {/* Row 2 — Description */}
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '18px',
        marginBottom: '16px',
        minHeight: '18px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {repo.description || <span style={{ color: 'var(--text-muted)' }}>No description</span>}
      </p>

      {/* Row 3 — Health Score Bar (only if completed) */}
      {repo.status === 'completed' && healthScore > 0 && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Health Score
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: healthScore >= 70 ? 'var(--success)' : healthScore >= 40 ? 'var(--warning)' : 'var(--danger)'
            }}>
              {healthScore}
            </span>
          </div>
          <div style={{
            height: '4px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              height: '100%',
              borderRadius: 'var(--radius-full)',
              background: getHealthBarGradient(),
              animation: 'progressFill 800ms cubic-bezier(0.4,0,0.2,1) forwards',
              animationDelay: `${index * 80 + 200}ms`,
              '--target-width': `${healthScore}%`
            }} />
          </div>
        </>
      )}

      {/* Row 4 — Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {/* Left — Language + Stars + Forks */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {repo.language && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: langColor,
                flexShrink: 0
              }} />
              <span style={{
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                {repo.language}
              </span>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <Star size={12} style={{ color: 'var(--text-muted)' }} />
            {repo.stars ?? 0}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <GitFork size={12} style={{ color: 'var(--text-muted)' }} />
            {repo.forks ?? 0}
          </div>
        </div>

        {/* Right — Date */}
        {analyzedDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            <Clock size={11} />
            {analyzedDate}
          </div>
        )}
      </div>
    </div>
  )
}
