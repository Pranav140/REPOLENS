import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Star, GitFork, RefreshCw, Trash2, Sun, Moon, LogOut } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import api from '../../api/api'
import CardNav from '../../components/shared/CardNav/CardNav'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'

export default function RepoLayout() {
  const { owner, name } = useParams()
  const navigate = useNavigate()
  
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [repo, setRepo] = useState(null)
  const [status, setStatus] = useState('pending')
  const [loadingRepo, setLoadingRepo] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const pollRef = useRef(null)

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
      } catch { /* ignore */ }
    }, 3000)
  }

  useEffect(() => {
    fetchRepo()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [owner, name])

  useEffect(() => {
    if (status === 'pending' || status === 'analyzing') startPolling()
  }, [status])

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

  const getStatusColor = () => {
    if (status === 'completed') return 'var(--success)'
    if (status === 'failed') return 'var(--danger)'
    if (status === 'analyzing') return 'var(--accent-blue)'
    return 'var(--warning)'
  }

  const navItems = useMemo(() => [
    {
      label: "Insights",
      bgColor: theme === 'dark' ? 'rgba(0, 255, 38, 0.12)' : '#00FF26',
      textColor: theme === 'dark' ? '#00FF26' : '#0A0C10',
      links: [
        { label: "Overview", href: `/repo/${owner}/${name}/overview` },
        { label: "Graph", href: `/repo/${owner}/${name}/graph` },
        { label: "Search", href: `/repo/${owner}/${name}/search` }
      ]
    },
    {
      label: "Health",
      bgColor: theme === 'dark' ? '#12161E' : '#F1F5F9',
      textColor: theme === 'dark' ? '#ffffff' : '#0F172A',
      links: [
        { label: "Health", href: `/repo/${owner}/${name}/health` },
        { label: "Security", href: `/repo/${owner}/${name}/security` },
        { label: "Dependencies", href: `/repo/${owner}/${name}/dependencies` }
      ]
    },
    {
      label: "Analysis",
      bgColor: theme === 'dark' ? '#161B22' : '#E2E8F0',
      textColor: theme === 'dark' ? '#ffffff' : '#0F172A',
      links: [
        { label: "AI Tools", href: `/repo/${owner}/${name}/ai` },
        { label: "Blast Radius", href: `/repo/${owner}/${name}/blast-radius` },
        { label: "Onboarding Time", href: `/repo/${owner}/${name}/onboarding-estimate` }
      ]
    }
  ], [owner, name, theme]);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'RL'

  if (loadingRepo) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  const LeftContent = (
    <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
      <div className="logo-dot" />
      <span className="logo-text">RepoLens</span>
    </div>
  )

  const CenterContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        {owner} / {name}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(), animation: status === 'analyzing' ? 'pulseGlow 1.5s infinite' : 'none', '--glow-color': getStatusColor() }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{status}</span>
      </div>
    </div>
  )

  const RightContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      
      {/* Stats & Actions Pill */}
      <div style={{ 
        display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', 
        borderRadius: 'var(--radius-full)', padding: '4px 6px', gap: '4px', 
        border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)'
      }} className="hidden md:flex">
        
        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}><Star size={14} />{repo?.stars ?? 0}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}><GitFork size={14} />{repo?.forks ?? 0}</span>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-active)' }} />

        {/* Actions */}
        <button 
          onClick={handleReanalyze} disabled={reanalyzing} 
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <RefreshCw size={13} className={reanalyzing ? 'animate-spin' : ''} /> 
          <span className="hidden lg:inline">Reanalyze</span>
        </button>
        <button 
          onClick={() => setDeleteDialog(true)} 
          style={{ padding: '6px', borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', border: 'none', marginLeft: '2px' }} 
          title="Delete"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(238, 93, 80, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-bg)'}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          width: '34px', height: '34px', borderRadius: '50%', border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)', marginLeft: '8px'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-overlay)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
      >
        {theme === 'dark' ? <Sun size={15} style={{ transition: 'transform 400ms', transform: 'rotate(360deg)' }} /> : <Moon size={15} style={{ transition: 'transform 400ms', transform: 'rotate(360deg)' }} />}
      </button>

      {/* User Avatar */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', borderRadius: '50%', cursor: 'pointer', transition: 'all var(--transition-fast)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }} 
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-overlay)' }} 
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>{initials}</div>
        )}
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); logout() }} 
        style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none', padding: '4px' }} 
        title="Logout"
        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <LogOut size={16} />
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Combined Top Navbar via CardNav */}
      <div style={{ padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100, background: theme === 'dark' ? 'rgba(10,12,16,0.92)' : 'rgba(13,15,20,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.15)' }}>
        <CardNav 
          items={navItems}
          leftContent={LeftContent}
          centerContent={CenterContent}
          rightContent={RightContent}
          baseColor={theme === 'dark' ? '#12161E' : '#0D0F14'}
          menuColor="#ffffff"
        />
      </div>

      {/* Main content body */}
      <main style={{ flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px 40px 40px 40px' }}>
        <Outlet />
      </main>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>Delete Repository?</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              This will permanently delete <strong>{owner}/{name}</strong> and all its analysis data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setDeleteDialog(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--danger)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Deleting...' : 'Delete'}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
