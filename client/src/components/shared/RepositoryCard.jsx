import { useNavigate } from 'react-router-dom'
import { Star, GitFork, Clock } from 'lucide-react'
import { useState } from 'react'

const LANG_COLORS = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python:     'bg-green-400',
  CSS:        'bg-pink-400',
  HTML:       'bg-orange-400',
}

export default function RepositoryCard({ repo }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const langColor   = LANG_COLORS[repo.language] || 'bg-gray-400'

  const analyzedDate = repo.analyzedAt
    ? new Date(repo.analyzedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const cardStyle = {
    background: '#111',
    border: `1px solid ${
      repo.status === 'failed' ? 'rgba(239,68,68,0.3)' :
      repo.status === 'analyzing' ? 'rgba(59,130,246,0.3)' :
      repo.status === 'completed' ? 'rgba(34,197,94,0.1)' :
      '#222'
    }`,
    borderRadius: '10px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.2s ease',
  }

  return (
    <>
      <style>{`
        @keyframes analyzingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes cardHover {
          from { transform: translateY(0); }
          to { transform: translateY(-2px); }
        }
      `}</style>
      <div 
        style={{
          ...cardStyle,
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered 
            ? '0 8px 24px rgba(0,0,0,0.4)' 
            : '0 2px 8px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/repo/${repo.owner}/${repo.name}`)}
        className="group relative"
      >
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-gray-100">
            {repo.owner}/{repo.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: 
                repo.status === 'completed' ? '#22c55e' :
                repo.status === 'analyzing' ? '#3b82f6' :
                repo.status === 'failed' ? '#ef4444' : '#f59e0b',
              animation: repo.status === 'analyzing' 
                ? 'analyzingPulse 1.5s ease-in-out infinite' : 'none',
              boxShadow: repo.status === 'completed'
                ? '0 0 6px rgba(34,197,94,0.5)' : 'none'
            }}/>
            <span style={{ 
              fontSize: '11px', fontWeight: '500', letterSpacing: '0.05em',
              color: 
                repo.status === 'completed' ? '#22c55e' :
                repo.status === 'analyzing' ? '#3b82f6' :
                repo.status === 'failed' ? '#ef4444' : '#f59e0b',
              textTransform: 'uppercase'
            }}>
              {repo.status}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
          {repo.description || 'No description available.'}
        </p>

        {/* Language + stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${langColor}`} />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star size={11} />
            {repo.stars ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <GitFork size={11} />
            {repo.forks ?? 0}
          </span>
          {analyzedDate && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock size={11} />
              {analyzedDate}
            </span>
          )}
        </div>

        {/* Health score mini-badge */}
        {repo.status === 'completed' && repo.metrics && (
          <div style={{
            marginTop: '12px',
            background: '#0a0a0a',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#555', fontSize: '11px' }}>
              health score
            </span>
            <span style={{
              fontWeight: '700', fontSize: '14px',
              fontFamily: 'monospace',
              color: repo.metrics.healthScore >= 70 ? '#22c55e' :
                     repo.metrics.healthScore >= 40 ? '#f59e0b' : '#ef4444'
            }}>
              {repo.metrics.healthScore}/100
            </span>
          </div>
        )}
      </div>
    </>
  )
}
