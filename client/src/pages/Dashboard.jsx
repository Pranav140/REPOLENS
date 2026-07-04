import { useState, useEffect } from 'react'
import Navbar from '../components/shared/Navbar'
import RepositoryCard from '../components/shared/RepositoryCard'
import ImportRepoModal from '../components/shared/ImportRepoModal'
import { Alert } from '../components/ui/alert'
import { Plus, GitBranch, TrendingUp, Users, Activity } from 'lucide-react'
import api from '../api/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

function useCountUp(target, duration = 600) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) return
    let start = null
    const animate = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return count
}

const mockActivityData = [
  { name: 'Jan', activity: 4000, users: 2400 },
  { name: 'Feb', activity: 3000, users: 1398 },
  { name: 'Mar', activity: 2000, users: 9800 },
  { name: 'Apr', activity: 2780, users: 3908 },
  { name: 'May', activity: 1890, users: 4800 },
  { name: 'Jun', activity: 2390, users: 3800 },
  { name: 'Jul', activity: 3490, users: 4300 },
]

export default function Dashboard() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  async function fetchRepos() {
    try {
      setError(null)
      const res = await api.get('/api/repos')
      setRepos(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRepos() }, [])
  const repoCount = useCountUp(repos.length, 600)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      <main style={{
        paddingTop: '56px',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '80px 40px 40px'
      }}>
        {/* Top Analytics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
          animation: 'fadeSlideUp 400ms ease forwards'
        }}>
          {/* Main KPI Card */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--accent-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Repositories</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{repoCount}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
              <TrendingUp size={16} /> +12% from last month
            </div>
          </div>

          {/* Area Chart Card */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
            gridColumn: 'span 2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Platform Activity</div>
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockActivityData}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                  <YAxis hide />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Area type="monotone" dataKey="activity" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Repositories Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          animation: 'fadeSlideUp 400ms ease forwards',
          animationDelay: '100ms',
          opacity: 0
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Active Projects
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Manage and monitor your imported repositories
            </p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              height: '44px',
              padding: '0 20px',
              background: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={16} />
            Import Repository
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                height: '200px',
                animation: 'shimmer 1.5s infinite',
                backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-overlay) 50%, var(--bg-elevated) 100%)',
                backgroundSize: '800px 100%'
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert style={{
            border: '1px solid var(--danger)', background: 'var(--danger-bg)', color: 'var(--danger)',
            padding: '16px', borderRadius: 'var(--radius-xl)', animation: 'fadeSlideUp 300ms ease forwards'
          }}>
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && repos.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '100px 40px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border-active)', animation: 'fadeIn 400ms ease forwards'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: 'var(--radius-full)', background: 'var(--accent-blue-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
            }}>
              <GitBranch size={36} color="var(--accent-blue)" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
              No repositories yet
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '380px', marginBottom: '32px' }}>
              Import a GitHub repository to start analyzing its structure, dependencies, and health in real-time.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                height: '44px', padding: '0 24px', background: 'var(--accent-blue)', color: '#ffffff',
                border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-md)'
              }}
            >
              <Plus size={16} /> Import your first repository
            </button>
          </div>
        )}

        {/* Repo grid */}
        {!loading && !error && repos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {repos.map((repo, index) => (
              <RepositoryCard key={repo._id} repo={repo} index={index} />
            ))}
          </div>
        )}
      </main>

      {/* Import modal */}
      <ImportRepoModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => { setShowImportModal(false); fetchRepos() }}
      />
    </div>
  )
}
