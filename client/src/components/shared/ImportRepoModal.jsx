import { useState, useEffect } from 'react'
import { FolderGit2, Search, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../ui/dialog'
import { Input } from '../ui/input'
import api from '../../api/api'

export default function ImportRepoModal({ open, onClose, onSuccess }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [ghRepos, setGhRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setLoadingRepos(true)
      api.get('/api/repos/github-repos')
        .then(res => setGhRepos(res.data))
        .catch(err => console.error('Failed to load GitHub repos', err))
        .finally(() => setLoadingRepos(false))
    } else {
      setSearch('')
      setGhRepos([])
    }
  }, [open])

  function validate(v) {
    const parts = v.trim().split('/')
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null
    return { owner: parts[0], name: parts[1] }
  }

  async function handleImport(repoName = null) {
    setError(null)
    const target = repoName || value
    const parsed = validate(target)
    if (!parsed) {
      setError('Please enter in the format: owner/repo-name')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/repos/import', parsed)
      setValue('')
      toast.success(`${parsed.owner}/${parsed.name} import started!`)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import repository')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setValue('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-[#222] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Import Repository</DialogTitle>
          <DialogDescription className="text-gray-500">
            Enter a public GitHub repository to analyze
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* GitHub Repos List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search your repositories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {loadingRepos ? (
                <p className="text-xs text-gray-500 text-center py-4">Loading your repositories...</p>
              ) : ghRepos.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No repositories found.</p>
              ) : (
                ghRepos
                  .filter(r => r.fullName.toLowerCase().includes(search.toLowerCase()))
                  .map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => handleImport(repo.fullName)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:bg-[#1a1a1a] transition-colors group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FolderGit2 size={16} className="text-blue-400 shrink-0" />
                        <div className="text-left truncate">
                          <p className="text-sm font-medium text-gray-200 truncate">{repo.fullName}</p>
                          <p className="text-[10px] text-gray-500">{repo.private ? 'Private' : 'Public'} • {repo.language || 'Unknown'}</p>
                        </div>
                      </div>
                      <Plus size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))
              )}
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#333]"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-gray-500 font-medium uppercase tracking-wider">or enter manually</span>
            <div className="flex-grow border-t border-[#333]"></div>
          </div>

          <div className="space-y-1.5">
            <Input
              placeholder="e.g. facebook/react"
              value={value}
              onChange={e => { setValue(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-gray-600
                         focus-visible:ring-1 focus-visible:ring-[#444]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white
                         hover:bg-[#1e1e1e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleImport()}
              disabled={loading || !value.trim()}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold
                         hover:bg-gray-200 transition-colors cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
