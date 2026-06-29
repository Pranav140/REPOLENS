import { useState, useEffect } from 'react'
import Navbar from '../components/shared/Navbar'
import RepositoryCard from '../components/shared/RepositoryCard'
import ImportRepoModal from '../components/shared/ImportRepoModal'
import { Skeleton } from '../components/ui/skeleton'
import { Alert } from '../components/ui/alert'
import { Plus, PackageSearch } from 'lucide-react'
import api from '../api/api'

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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="pt-14 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Repositories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {repos.length} {repos.length === 1 ? 'repository' : 'repositories'} imported
            </p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Import Repository
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3">
                <Skeleton className="h-4 w-3/4 bg-[#1e1e1e]" />
                <Skeleton className="h-3 w-full bg-[#1e1e1e]" />
                <Skeleton className="h-3 w-2/3 bg-[#1e1e1e]" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full bg-[#1e1e1e]" />
                  <Skeleton className="h-5 w-20 rounded-full bg-[#1e1e1e]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert className="border-red-500/30 bg-red-500/10 text-red-400">
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center mb-5">
              <PackageSearch size={28} className="text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No repositories yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Import a GitHub repository to start analyzing its structure, dependencies, and health.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Import your first repository
            </button>
          </div>
        )}

        {/* Repo grid */}
        {!loading && !error && repos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <RepositoryCard key={repo._id} repo={repo} />
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
