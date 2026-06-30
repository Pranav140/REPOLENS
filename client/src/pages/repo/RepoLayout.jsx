import { useEffect, useState, useRef } from 'react'
import { useParams, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Star, GitFork, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../../components/ui/dialog'
import api from '../../api/api'

const NAV_LINKS = [
  { to: 'overview',     label: 'Overview'      },
  { to: 'graph',        label: 'Graph'         },
  { to: 'health',       label: 'Health'        },
  { to: 'search',       label: 'Search'        },
  { to: 'security',     label: 'Security'      },
  { to: 'ai',           label: 'AI Tools'      },
  { to: 'dependencies', label: 'Dependencies'  },
]

const STATUS_STYLES = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  analyzing: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  completed: 'bg-green-500/10  text-green-400  border-green-500/20',
  failed:    'bg-red-500/10    text-red-400    border-red-500/20',
}

export default function RepoLayout() {
  const { owner, name } = useParams()
  const navigate = useNavigate()

  const [repo,        setRepo]        = useState(null)
  const [status,      setStatus]      = useState('pending')
  const [loadingRepo, setLoadingRepo] = useState(true)
  const [deleteDialog,setDeleteDialog]= useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const pollRef = useRef(null)

  /* ── Fetch repo ─────────────────────────────────────────────────── */
  async function fetchRepo() {
    try {
      const res = await api.get(`/api/repos/${owner}/${name}`)
      setRepo(res.data.repository)
      setStatus(res.data.repository.status)
    } catch {
      toast.error('Repository not found')
      navigate('/dashboard')
    } finally {
      setLoadingRepo(false)
    }
  }

  /* ── Status polling ──────────────────────────────────────────────── */
  function startPolling() {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/repos/${owner}/${name}/status`)
        const s = res.data.status
        setStatus(s)
        if (s === 'completed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          fetchRepo()
          toast.success('Analysis complete!')
        } else if (s === 'failed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          toast.error('Analysis failed')
        }
      } catch { /* network blip — keep polling */ }
    }, 3000)
  }

  useEffect(() => {
    fetchRepo()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [owner, name]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'pending' || status === 'analyzing') startPolling()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Reanalyze ───────────────────────────────────────────────────── */
  async function handleReanalyze() {
    setReanalyzing(true)
    try {
      await api.post(`/api/repos/${owner}/${name}/reanalyze`)
      setStatus('pending')
      toast.success('Reanalysis started')
    } catch {
      toast.error('Failed to start reanalysis')
    } finally {
      setReanalyzing(false)
    }
  }

  /* ── Delete ──────────────────────────────────────────────────────── */
  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/api/repos/${owner}/${name}`)
      toast.success('Repository deleted')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to delete repository')
      setDeleting(false)
      setDeleteDialog(false)
    }
  }

  /* ── Loading spinner ─────────────────────────────────────────────── */
  if (loadingRepo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#333] border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  /* ── Analyzing overlay ───────────────────────────────────────────── */
  if (status === 'pending' || status === 'analyzing') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="w-12 h-12 border-2 border-[#333] border-t-blue-400 rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-1">Analyzing repository…</h2>
            <p className="text-sm text-gray-500">This usually takes 30–60 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Failed state ────────────────────────────────────────────────── */
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Analysis Failed</h2>
            <p className="text-sm text-gray-500 mt-1">
              Something went wrong while analyzing this repository.
            </p>
          </div>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold
                       hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
          >
            {reanalyzing ? 'Starting…' : 'Retry Analysis'}
          </button>
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.completed

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />

      {/* ── Repo header strip ─────────────────────────────────────── */}
      <div className="pt-14 border-b border-[#222] bg-[#0a0a0a]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-semibold text-white truncate">{owner}/{name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle}`}>
                {status}
              </span>
            </div>
            {repo?.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{repo.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
            <span className="flex items-center gap-1"><Star size={11} />{repo?.stars ?? 0}</span>
            <span className="flex items-center gap-1"><GitFork size={11} />{repo?.forks ?? 0}</span>
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#333]
                         text-gray-400 hover:text-white hover:border-[#444] transition-colors
                         cursor-pointer disabled:opacity-40"
            >
              <RefreshCw size={11} className={reanalyzing ? 'animate-spin' : ''} />
              Reanalyze
            </button>
            <button
              onClick={() => setDeleteDialog(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#333]
                         text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Layout body ───────────────────────────────────────────── */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full min-h-0">

        {/* Desktop sidebar — hidden on mobile */}
        <nav className="hidden md:flex flex-col w-56 shrink-0 border-r border-[#222] py-4 px-3 gap-0.5">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#222] text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile horizontal scrollable tab bar — hidden on desktop */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-[#222]">
          <div className="flex overflow-x-auto scrollbar-hide px-2 py-1 gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `shrink-0 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#222] text-white font-medium'
                      : 'text-gray-500 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Delete confirm dialog ─────────────────────────────────── */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-[#111] border-[#222] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Repository?</DialogTitle>
            <DialogDescription className="text-gray-500">
              This will permanently delete{' '}
              <strong className="text-white">{owner}/{name}</strong> and all its
              analysis data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteDialog(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white
                         hover:bg-[#1e1e1e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold
                         hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
