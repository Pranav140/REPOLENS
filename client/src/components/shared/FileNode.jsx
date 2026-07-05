import { Handle, Position } from 'reactflow'
import { useEffect, useState } from 'react'

export default function FileNode({ data, selected }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const borderColor = data.isEntry
    ? '#3b82f6'
    : data.isDead
      ? '#7f1d1d'
      : selected ? '#ffffff' : '#333333'

  const dotColor = data.complexity < 10
    ? 'bg-[#05CD99]'
    : data.complexity < 20
      ? 'bg-[#F59E0B]'
      : 'bg-[#EE5D50]'

  return (
    <>
      <style>{`
        @keyframes nodeEntrance {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nodeFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div
        style={{
          border: `1px solid ${borderColor}`,
          background: data.isDead ? 'rgba(40, 15, 15, 0.9)' : 'rgba(20, 22, 28, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: selected ? `0 0 0 1px ${borderColor}, 0 8px 24px rgba(0,0,0,0.6)` : '0 4px 12px rgba(0,0,0,0.4)',
          animation: mounted 
            ? 'nodeEntrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, nodeFlicker 4s ease-in-out infinite'
            : 'none',
          opacity: mounted ? 1 : 0
        }}
        className="px-3 py-2.5 rounded-xl min-w-[140px] max-w-[200px] transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
      >
        <Handle type="target" position={Position.Left} style={{ background: '#666', width: 4, height: 16, borderRadius: 2, border: 'none', left: -2 }} />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor} ${selected ? 'animate-pulse shadow-[0_0_8px_currentColor]' : ''}`} />
          <span className="text-[13px] font-semibold text-white truncate font-mono tracking-tight">{data.label}</span>
        </div>
        
        <div className="flex items-center gap-1.5 mt-2 pl-4">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-[#ffffff10] text-gray-400 border border-[#ffffff15]">
            {data.language || 'txt'}
          </span>
          {data.isDead && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              dead
            </span>
          )}
          {data.isEntry && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              entry
            </span>
          )}
        </div>
        <Handle type="source" position={Position.Right} style={{ background: '#666', width: 4, height: 16, borderRadius: 2, border: 'none', right: -2 }} />
      </div>
    </>
  )
}
