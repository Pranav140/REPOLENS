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
    ? 'bg-green-500'
    : data.complexity < 20
      ? 'bg-yellow-500'
      : 'bg-red-500'

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
          background: data.isDead ? '#1c0a0a' : '#111111',
          animation: mounted 
            ? 'nodeEntrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, nodeFlicker 4s ease-in-out infinite'
            : 'none',
          opacity: mounted ? 1 : 0
        }}
        className="px-3 py-2 rounded-lg min-w-[120px] max-w-[180px] transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
      >
        <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor} ${selected ? 'animate-pulse shadow-[0_0_8px_currentColor]' : ''}`} />
          <span className="text-xs font-medium text-white truncate">{data.label}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5 pl-3.5">{data.language}</div>
        {data.isDead && <div className="text-[10px] text-red-400 pl-3.5">dead</div>}
        {data.isEntry && <div className="text-[10px] text-blue-400 pl-3.5">entry</div>}
        <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      </div>
    </>
  )
}
