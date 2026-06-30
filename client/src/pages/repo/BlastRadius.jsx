import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/api'

export default function BlastRadius() {
  const { owner, name } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)

  async function handleScan() {
    setIsLoading(true)
    setHasScanned(false)
    try {
      const res = await api.get(`/api/repos/${owner}/${name}/blast-radius`)
      setData(res.data.results || [])
      setHasScanned(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze blast radius')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasScanned && !isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-[#222] bg-[#111] p-8 text-center flex flex-col items-center">
          <Flame size={64} className="text-orange-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Blast Radius Analysis</h2>
          <p className="text-sm text-gray-400 mb-6">
            Find the files in your codebase that are riskiest to modify, based on dependency reach, complexity, and change frequency.
          </p>
          <button
            onClick={handleScan}
            className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors cursor-pointer"
          >
            Run Analysis
          </button>
          <p className="text-xs text-gray-500 mt-4">Note: Takes 15-20 seconds</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#333] border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Tracing dependency chains and commit history...</p>
      </div>
    )
  }

  if (hasScanned && data?.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <p className="text-sm text-gray-400">No dependency data available. Make sure this repository has been fully analyzed.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Riskiest Files to Modify</h2>
        <p className="text-sm text-gray-400 mt-1">Ranked by transitive impact, complexity, and change frequency</p>
      </div>

      <div className="space-y-3">
        {data?.map((file, idx) => {
          const isTop3 = idx < 3
          const borderClass = isTop3 ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-[#222]'
          const scoreColor = file.score >= 60 ? 'text-red-400' : file.score >= 30 ? 'text-yellow-400' : 'text-green-400'
          
          return (
            <div
              key={file.path}
              onClick={() => navigate(`../graph?highlight=${encodeURIComponent(file.path)}`)}
              className={`rounded-xl border ${borderClass} bg-[#111] p-5 flex items-center gap-4 cursor-pointer hover:bg-[#161616] transition-colors`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isTop3 ? 'bg-orange-500 text-white' : 'bg-[#333] text-gray-300'}`}>
                    #{idx + 1}
                  </span>
                  <span className="font-mono text-sm text-gray-200 truncate">{file.path}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3 truncate">{file.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#333] text-gray-400">
                    {file.dependentCount} dependents
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#333] text-gray-400">
                    {file.entryPointsAffected} entry points
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#333] text-gray-400">
                    {file.commitFrequency} recent commits
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-center justify-center w-24 border-l border-[#222] pl-4">
                <span className={`text-4xl font-bold ${scoreColor}`}>{file.score}</span>
                <span className="text-xs text-gray-500 uppercase mt-1 tracking-wider">{file.riskLevel} risk</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
