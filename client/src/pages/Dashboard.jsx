import { useState, useEffect } from 'react'
import Navbar from '../components/shared/Navbar'
import RepositoryCard from '../components/shared/RepositoryCard'
import ImportRepoModal from '../components/shared/ImportRepoModal'
import { Alert } from '../components/ui/alert'
import { Plus, GitBranch, TrendingUp, Users, Activity, ShieldCheck, GitCommit } from 'lucide-react'
import api from '../api/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

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
  { name: 'Jan', commits: 120, prs: 15 },
  { name: 'Feb', commits: 250, prs: 30 },
  { name: 'Mar', commits: 180, prs: 22 },
  { name: 'Apr', commits: 390, prs: 45 },
  { name: 'May', commits: 280, prs: 32 },
  { name: 'Jun', commits: 450, prs: 60 },
  { name: 'Jul', commits: 600, prs: 85 },
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
      console.error('Fetch Repos Error:', err)
      setError(err.response?.data?.message || 'Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRepos() }, [])
  const repoCount = useCountUp(repos.length, 600)
  const commitsCount = useCountUp(1420, 800)
  const healthScore = useCountUp(94, 1000)

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121620] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 text-sm">{entry.name}</span>
              </div>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-base)]">
      {/* Modern CSS Grid background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      <div className="relative z-10">
        <Navbar />

        <main className="pt-20 pb-12 px-6 max-w-[1400px] mx-auto w-full">
          {/* Top Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 animate-[fadeSlideUp_400ms_ease_forwards]">
            
            {/* KPI Column */}
            <div className="flex flex-col gap-6">
              {/* Card 1 */}
              <div className="group relative overflow-hidden rounded-3xl bg-[#131822] border border-white/5 p-6 shadow-xl hover:border-white/10 transition-all duration-300">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-blue)]/10 flex items-center justify-center border border-[var(--accent-blue)]/20 text-[var(--accent-blue)]">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">+12%</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Total Repositories</h3>
                <div className="text-4xl font-extrabold text-white tracking-tight">{repoCount}</div>
              </div>

              {/* Card 2 */}
              <div className="group relative overflow-hidden rounded-3xl bg-[#131822] border border-white/5 p-6 shadow-xl hover:border-white/10 transition-all duration-300">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">+5%</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Avg Health Score</h3>
                <div className="text-4xl font-extrabold text-white tracking-tight">{healthScore}<span className="text-xl text-gray-500">/100</span></div>
              </div>
            </div>

            {/* Main Area Chart */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-[#131822] border border-white/5 p-6 shadow-xl hover:border-white/10 transition-all duration-300 flex flex-col">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Platform Activity</h3>
                  <p className="text-sm text-gray-400 mt-1">Total commits and pull requests over time</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--accent-blue)]" />
                    <span className="text-sm text-gray-300 font-medium">Commits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-300 font-medium">PRs</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPrs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="commits" name="Commits" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorCommits)" />
                    <Area type="monotone" dataKey="prs" name="Pull Requests" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorPrs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Repositories Header */}
          <div className="flex items-center justify-between mb-8 opacity-0 animate-[fadeSlideUp_400ms_ease_forwards]" style={{ animationDelay: '150ms' }}>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">Active Projects</h2>
              <p className="text-sm mt-1 text-[var(--text-secondary)]">Manage and monitor your imported repositories</p>
            </div>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="group relative overflow-hidden rounded-xl px-5 py-2.5 font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={18} className="transition-transform group-hover:rotate-90" />
              <span>Import Repo</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[200px] rounded-3xl bg-[#131822] border border-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded-2xl">
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && repos.length === 0 && (
            <div className="w-full rounded-3xl border border-dashed border-gray-300 dark:border-white/10 bg-[#131822] p-16 flex flex-col items-center justify-center text-center animate-[fadeIn_400ms_ease_forwards]">
              <div className="w-20 h-20 rounded-[20px] bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 flex items-center justify-center mb-6">
                <GitBranch size={36} className="text-[var(--accent-blue)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">No repositories yet</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
                Import a GitHub repository to start analyzing its structure, dependencies, and health in real-time.
              </p>
              <button
                onClick={() => setShowImportModal(true)}
                className="rounded-xl px-6 py-3 bg-[var(--accent-blue)] text-white font-bold transition-all hover:bg-blue-600 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(67,24,255,0.3)]"
              >
                <Plus size={18} /> Import your first repository
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && repos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo, index) => (
                <RepositoryCard key={repo._id} repo={repo} index={index} />
              ))}
            </div>
          )}
        </main>

        <ImportRepoModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { setShowImportModal(false); fetchRepos() }}
        />
      </div>
    </div>
  )
}
