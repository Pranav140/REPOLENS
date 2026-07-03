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
  const [barsVisible, setBarsVisible] = useState(false)

  useEffect(() => {
    if (estimate) setTimeout(() => setBarsVisible(true), 400)
  }, [estimate])

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
      <style>{`
        @keyframes daysCount {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes barGrow {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
      `}</style>

      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ 
          fontSize: '11px', letterSpacing: '0.2em', 
          color: '#555', marginBottom: '12px',
          textTransform: 'uppercase'
        }}>
          estimated ramp-up time
        </div>
        <div style={{
          fontSize: '80px', fontWeight: '800',
          fontFamily: 'monospace', lineHeight: 1,
          color: estimate.totalDays > 7 ? '#ef4444' :
                 estimate.totalDays > 4 ? '#f59e0b' : '#22c55e',
          animation: 'daysCount 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}>
          {estimate.totalDays}
        </div>
        <div style={{ 
          color: '#555', fontSize: '14px', marginTop: '4px'
        }}>
          days for a mid-level developer
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
            {estimate.breakdown.map((item, index) => {
              return (
                <div key={index} style={{ 
                  display: 'flex', alignItems: 'center', 
                  gap: '12px', marginBottom: '10px' 
                }}>
                  <span style={{ 
                    width: '100px', fontSize: '12px', 
                    color: '#888', textAlign: 'right', flexShrink: 0 
                  }}>
                    {item.folder}
                  </span>
                  <div style={{ 
                    flex: 1, height: '28px', 
                    background: '#0d0d0d', borderRadius: '4px', 
                    overflow: 'hidden', position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      width: barsVisible 
                        ? `${(item.days / estimate.breakdown[0].days) * 100}%` 
                        : '0%',
                      background: item.days > 3 
                        ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                        item.days > 1.5 
                        ? 'linear-gradient(90deg, #f59e0b, #eab308)' :
                        'linear-gradient(90deg, #22c55e, #16a34a)',
                      borderRadius: '4px',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      transitionDelay: `${index * 100}ms`,
                      display: 'flex', alignItems: 'center',
                      paddingLeft: '10px'
                    }}>
                      <span style={{ 
                        color: 'white', fontSize: '11px', 
                        fontWeight: '600', whiteSpace: 'nowrap',
                        fontFamily: 'monospace'
                      }}>
                        {item.days}d
                      </span>
                    </div>
                  </div>
                  <span style={{ 
                    width: '80px', fontSize: '11px', 
                    color: '#444', flexShrink: 0 
                  }}>
                    {item.reason}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
