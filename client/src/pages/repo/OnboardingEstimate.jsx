import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import api from '../../api/api'

export default function OnboardingEstimate() {
  const { owner, name } = useParams()
  const [estimate, setEstimate] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [narration, setNarration] = useState(null)
  const [narrationLoading, setNarrationLoading] = useState(false)

  useEffect(() => {
    api.get(`/api/repos/${owner}/${name}/onboarding-estimate`)
      .then(res => setEstimate(res.data.estimate))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to load estimate'))
      .finally(() => setIsLoading(false))
  }, [owner, name])

  async function handleNarrate() {
    setNarrationLoading(true)
    try {
      const res = await api.post(`/api/ai/${owner}/${name}/narrate-onboarding`, { estimate })
      setNarration(res.data.narration)
    } catch (err) {
      toast.error('Failed to generate narration')
    } finally {
      setNarrationLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-[#333] border-t-blue-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!estimate) return <div className="text-gray-500">Failed to load estimate data.</div>

  const progressPercent = Math.min(estimate.totalDays * 8, 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-[#222] bg-[#111] p-8 text-center flex flex-col items-center">
        <div className="text-6xl font-bold text-white mb-2">{estimate.totalDays}</div>
        <div className="text-lg text-gray-300 font-medium">days to become productive</div>
        <div className="text-sm text-gray-500 mb-8">Estimated for a {estimate.level}</div>
        
        <div className="w-full max-w-md relative">
          <div className="w-full h-3 bg-[#222] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>1 day</span>
            <span>10+ days</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] p-6">
        {!narration ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Get a plain-English summary of what makes this repo challenging.</span>
            <button
              onClick={handleNarrate}
              disabled={narrationLoading}
              className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-sm text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {narrationLoading ? 'Gemini is summarizing...' : 'Generate Summary'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              <ReactMarkdown>{narration}</ReactMarkdown>
            </div>
            <p className="text-xs text-gray-600 mt-2">Powered by Gemini ✦</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] p-6">
        <h3 className="text-base font-semibold text-white mb-6">Time by Area</h3>
        
        {estimate.breakdown?.length === 0 ? (
          <p className="text-sm text-gray-500">Not enough folder structure detected for a breakdown</p>
        ) : (
          <div className="space-y-4">
            {estimate.breakdown.map((folder, i) => {
              const maxDays = estimate.breakdown[0].days || 1
              const pct = (folder.days / maxDays) * 100
              
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-300 font-mono truncate" title={folder.folder}>
                    {folder.folder}
                  </span>
                  <div className="flex-1 h-6 bg-[#1a1a1a] rounded overflow-hidden relative">
                    <div 
                      className="h-full bg-blue-500/70 rounded flex items-center px-2 min-w-[32px] transition-all"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{folder.days}d</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-32 truncate" title={folder.reason}>{folder.reason}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
