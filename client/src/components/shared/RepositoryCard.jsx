import { useNavigate } from 'react-router-dom'
import { Star, GitFork, Clock } from 'lucide-react'

const STATUS_STYLES = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  analyzing: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  completed: 'bg-green-500/10  text-green-400  border-green-500/20',
  failed:    'bg-red-500/10    text-red-400    border-red-500/20',
}

const LANG_COLORS = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python:     'bg-green-400',
  CSS:        'bg-pink-400',
  HTML:       'bg-orange-400',
}

export default function RepositoryCard({ repo }) {
  const navigate = useNavigate()

  const statusStyle = STATUS_STYLES[repo.status] || STATUS_STYLES.pending
  const langColor   = LANG_COLORS[repo.language] || 'bg-gray-400'

  const analyzedDate = repo.analyzedAt
    ? new Date(repo.analyzedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      onClick={() => navigate(`/repo/${repo.owner}/${repo.name}`)}
      className="group rounded-xl border border-[#222] bg-[#111] p-5 cursor-pointer
                 hover:border-[#333] hover:bg-[#161616] transition-all duration-200"
    >
      {/* Name + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white text-sm truncate group-hover:text-gray-100">
          {repo.owner}/{repo.name}
        </h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${statusStyle}`}>
          {repo.status}
        </span>
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
    </div>
  )
}
