import { Handle, Position } from 'reactflow'

export default function FileNode({ data, selected }) {
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
    <div
      style={{
        border: `1px solid ${borderColor}`,
        background: data.isDead ? '#1c0a0a' : '#111111',
      }}
      className="px-3 py-2 rounded-lg min-w-[120px] max-w-[180px]"
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="text-xs font-medium text-white truncate">{data.label}</span>
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5 pl-3.5">{data.language}</div>
      {data.isDead && <div className="text-[10px] text-red-400 pl-3.5">dead</div>}
      {data.isEntry && <div className="text-[10px] text-blue-400 pl-3.5">entry</div>}
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  )
}
