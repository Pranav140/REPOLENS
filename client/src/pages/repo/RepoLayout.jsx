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
      bgColor: '#00FF26',
      textColor: '#0A0C10',
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
      bgColor: theme === 'dark' ? '#12161E' : '#F1F5F9',
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
        <circle cx="11" cy="11" r="2.5" fill="#3b82f6" />
        <line x1="5" y1="11" x2="8.5" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="13.5" y1="11" x2="17" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
      <span className="logo-text" style={{ color: '#ffffff' }}>RepoLens</span>
    </div>
  )

  const CenterContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        {owner} / {name}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(), animation: status === 'analyzing' ? 'pulseGlow 1.5s infinite' : 'none', '--glow-color': getStatusColor() }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{status}</span>
      </div>
    </div>
  )

  const RightContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      
      {/* Stats & Actions Pill */}
      <div style={{ 
        display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', 
        borderRadius: 'var(--radius-full)', padding: '4px 6px', gap: '4px', 
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }} className="hidden md:flex">
        
        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', color: '#9CA3AF' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}><Star size={14} />{repo?.stars ?? 0}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}><GitFork size={14} />{repo?.forks ?? 0}</span>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />

        {/* Actions */}
        <button 
          onClick={handleReanalyze} disabled={reanalyzing} 
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', border: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <RefreshCw size={13} className={reanalyzing ? 'animate-spin' : ''} /> 
          <span className="hidden lg:inline">Reanalyze</span>
        </button>
        <button 
          onClick={() => setDeleteDialog(true)} 
          style={{ padding: '6px', borderRadius: '50%', background: 'rgba(238, 93, 80, 0.15)', color: '#EE5D50', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', border: 'none', marginLeft: '2px' }} 
          title="Delete"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(238, 93, 80, 0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(238, 93, 80, 0.15)'}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          width: '34px', height: '34px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)', marginLeft: '8px'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      >
        {theme === 'dark' ? <Sun size={15} style={{ transition: 'transform 400ms', transform: 'rotate(360deg)' }} /> : <Moon size={15} style={{ transition: 'transform 400ms', transform: 'rotate(360deg)' }} />}
      </button>

      {/* User Avatar */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', borderRadius: '50%', cursor: 'pointer', transition: 'all var(--transition-fast)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} 
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} 
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#ffffff' }}>{initials}</div>
        )}
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); logout() }} 
        style={{ color: '#6B7280', cursor: 'pointer', background: 'transparent', border: 'none', padding: '4px' }} 
        title="Logout"
        onMouseEnter={e => e.currentTarget.style.color = '#EE5D50'}
        onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
      >
        <LogOut size={16} />
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Combined Top Navbar via CardNav */}
      <div style={{ padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100, background: theme === 'dark' ? 'rgba(10,12,16,0.92)' : 'rgba(244, 247, 252, 0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)' }}>
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
