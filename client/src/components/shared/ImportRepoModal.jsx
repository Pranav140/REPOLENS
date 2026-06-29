import { useState } from 'react'
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

  function validate(v) {
    const parts = v.trim().split('/')
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null
    return { owner: parts[0], name: parts[1] }
  }

  async function handleImport() {
    setError(null)
    const parsed = validate(value)
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
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">
              Repository (owner/name)
            </label>
            <Input
              placeholder="e.g. vercel/next.js"
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
              onClick={handleImport}
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
