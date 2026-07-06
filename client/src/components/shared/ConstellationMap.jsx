import { useState, useRef, useCallback, useEffect } from 'react'

const LC = { TypeScript:'#3178C6', JavaScript:'#F7DF1E', Python:'#3776AB', 'Jupyter Notebook':'#F37626', Rust:'#CE422B', Go:'#00ADD8' }
const W = 900, H = 280

function getInitialPositions(repos) {
  return repos.map((_, i) => {
    const angle = (i / repos.length) * 2 * Math.PI - Math.PI / 2
    return { x: W/2 + 290 * Math.cos(angle), y: H/2 + 95 * Math.sin(angle) }
  })
}

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 137 + 50) % W,
  y: (i * 97 + 30) % H,
  delay: (i * 0.19) % 2,
  dur: 2 + (i * 0.37) % 2.5,
}))

export default function ConstellationMap({ repos }) {
  const svgRef = useRef(null)
  const [positions, setPositions] = useState(() => getInitialPositions(repos))
  const [hovered, setHovered] = useState(null)
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 })
  const dragging = useRef(null)

  // Recalc positions when repos change
  useEffect(() => {
    setPositions(getInitialPositions(repos))
  }, [repos.length])

  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    }
  }, [])

  const onMouseDown = useCallback((e, i) => {
    e.preventDefault()
    dragging.current = i
  }, [])

  const onMouseMove = useCallback((e) => {
    if (dragging.current !== null) {
      const pt = getSVGPoint(e)
      setPositions(prev => {
        const next = [...prev]
        next[dragging.current] = {
          x: Math.max(30, Math.min(W - 30, pt.x)),
          y: Math.max(30, Math.min(H - 30, pt.y)),
        }
        return next
      })
    }
  }, [getSVGPoint])

  const onMouseUp = useCallback(() => { dragging.current = null }, [])

  const onNodeHover = (e, i) => {
    const pt = getSVGPoint(e)
    setHovered(i)
    setTooltip({ x: pt.x, y: pt.y })
  }

  const hoveredRepo = hovered !== null ? repos[hovered] : null

  return (
    <>
      <style>{`
        @keyframes nodePulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes ringExpand { 0%{r:14;opacity:0.7} 100%{r:36;opacity:0} }
        @keyframes starTwinkle { 0%,100%{opacity:0.12} 50%{opacity:0.45} }
        @keyframes lineFlow { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
        @keyframes hubPulse { 0%,100%{r:9} 50%{r:12} }
      `}</style>

      <div style={{ background:'#0D111A', border:'1px solid #1E2A3A', borderRadius:20, marginBottom:22, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px 0' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:3 }}>Codebase Map</p>
            <h3 style={{ fontSize:15, fontWeight:800, color:'#f8fafc', margin:0 }}>Repository Constellation</h3>
          </div>
          <p style={{ fontSize:11, color:'#334155' }}>Hover to inspect · Drag to rearrange</p>
        </div>

        {/* SVG canvas */}
        <svg
          ref={svgRef}
          width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display:'block', cursor: dragging.current !== null ? 'grabbing' : 'default', userSelect:'none' }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { onMouseUp(); setHovered(null) }}
        >
          <defs>
            <radialGradient id="cBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#111827"/>
              <stop offset="100%" stopColor="#0D111A"/>
            </radialGradient>
            <filter id="cGlow">
              <feGaussianBlur stdDeviation="3.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="cGlowSoft">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <rect width={W} height={H} fill="url(#cBg)"/>

          {/* Stars */}
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={1.1} fill="#94a3b8"
              style={{ animation:`starTwinkle ${s.dur}s ease-in-out infinite`, animationDelay:`${s.delay}s` }}/>
          ))}

          {/* Repo-to-repo lines */}
          {repos.length > 1 && repos.map((_, a) =>
            repos.slice(a + 1).map((__, b) => {
              const pa = positions[a], pb = positions[a + 1 + b]
              if (!pa || !pb) return null
              return (
                <line key={`${a}-${b}`}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke="#1a2535" strokeWidth={1} strokeDasharray="5 5"
                  style={{ animation:`lineFlow 4s linear infinite`, animationDelay:`${a*0.4}s` }}/>
              )
            })
          )}

          {/* Hub → repo lines */}
          {positions.map((p, i) => p && (
            <line key={i}
              x1={W/2} y1={H/2} x2={p.x} y2={p.y}
              stroke="#1E2A3A" strokeWidth={1.5} strokeDasharray="7 5"
              style={{ animation:`lineFlow 3.5s linear infinite`, animationDelay:`${i*0.25}s` }}/>
          ))}

          {/* Central hub */}
          <circle cx={W/2} cy={H/2} r={22} fill="#0A0E17" stroke="#1E2A3A" strokeWidth={1.5}/>
          <circle cx={W/2} cy={H/2} r={9} fill="#3b82f6" filter="url(#cGlow)"
            style={{ animation:'hubPulse 2.5s ease-in-out infinite' }}/>
          <text x={W/2} y={H/2+38} textAnchor="middle" fill="#475569" fontSize={9} fontWeight={700} letterSpacing={1.5}>WORKSPACE</text>

          {/* Repo nodes */}
          {repos.map((repo, i) => {
            const p = positions[i]
            if (!p) return null
            const health = repo.metrics?.healthScore ?? 0
            const nodeColor = repo.status === 'completed'
              ? (health >= 70 ? '#22c55e' : health >= 40 ? '#f59e0b' : health > 0 ? '#ef4444' : '#22c55e')
              : repo.status === 'analyzing' ? '#3b82f6' : '#f59e0b'
            const lc = LC[repo.language] || '#475569'
            const isHov = hovered === i

            return (
              <g key={repo._id}
                onMouseEnter={e => onNodeHover(e, i)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={e => onMouseDown(e, i)}
                style={{ cursor:'grab' }}>

                {/* Expand ring animation */}
                <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={nodeColor} strokeWidth={1.5}
                  style={{ animation:`ringExpand 2.8s ease-out infinite`, animationDelay:`${i*0.55}s` }}/>

                {/* Hover glow halo */}
                {isHov && <circle cx={p.x} cy={p.y} r={26} fill={`${nodeColor}15`}/>}

                {/* Language ring */}
                <circle cx={p.x} cy={p.y} r={16} fill="#0A0E17" stroke={lc} strokeWidth={isHov?3:2}
                  style={{ transition:'stroke-width 0.2s' }}/>

                {/* Core */}
                <circle cx={p.x} cy={p.y} r={isHov?11:8} fill={nodeColor} filter="url(#cGlow)"
                  style={{ animation:`nodePulse ${2+i*0.3}s ease-in-out infinite`, animationDelay:`${i*0.2}s`, transition:'r 0.2s' }}/>

                {/* Label */}
                <text x={p.x} y={p.y + (p.y > H/2 ? 34 : -22)} textAnchor="middle"
                  fill={isHov ? '#f8fafc' : '#94a3b8'} fontSize={11} fontWeight={isHov?800:600} fontFamily="monospace"
                  style={{ transition:'fill 0.2s' }}>
                  {repo.name}
                </text>
                {health > 0 && (
                  <text x={p.x} y={p.y + (p.y > H/2 ? 46 : -10)} textAnchor="middle"
                    fill={nodeColor} fontSize={9} fontWeight={600}>{health}/100</text>
                )}
              </g>
            )
          })}

          {/* Tooltip */}
          {hoveredRepo && (() => {
            const p = positions[hovered]
            const health = hoveredRepo.metrics?.healthScore ?? 0
            const hc = health >= 70 ? '#22c55e' : health >= 40 ? '#f59e0b' : health > 0 ? '#ef4444' : '#475569'
            const sc = hoveredRepo.status==='completed'?'#22c55e':hoveredRepo.status==='analyzing'?'#3b82f6':'#f59e0b'
            // Flip tooltip if close to right edge
            const tx = p.x > W - 180 ? p.x - 175 : p.x + 26
            const tipH = health > 0 ? 110 : 82
            const ty = Math.max(10, Math.min(H - tipH - 10, p.y - 45))
            return (
              <g>
                <rect x={tx} y={ty} width={160} height={tipH} rx={10} ry={10}
                  fill="#0D111A" stroke="#1E2A3A" strokeWidth={1} filter="url(#cGlowSoft)"/>
                {/* Repo name */}
                <text x={tx+12} y={ty+20} fill="#f8fafc" fontSize={12} fontWeight={800} fontFamily="monospace">{hoveredRepo.name}</text>
                <text x={tx+12} y={ty+34} fill="#475569" fontSize={10} fontFamily="monospace">{hoveredRepo.owner}</text>
                {/* Status */}
                <circle cx={tx+14} cy={ty+48} r={4} fill={sc}/>
                <text x={tx+24} y={ty+52} fill={sc} fontSize={10} fontWeight={700}>{hoveredRepo.status.toUpperCase()}</text>
                {/* Language */}
                <circle cx={tx+14} cy={ty+66} r={4} fill={LC[hoveredRepo.language]||'#475569'}/>
                <text x={tx+24} y={ty+70} fill="#94a3b8" fontSize={10}>{hoveredRepo.language || 'Unknown'}</text>
                {/* Health */}
                {health > 0 && (
                  <>
                    <text x={tx+12} y={ty+88} fill="#475569" fontSize={9} fontWeight={700} letterSpacing={0.5}>HEALTH SCORE</text>
                    <text x={tx+12} y={ty+103} fill={hc} fontSize={13} fontWeight={900} fontFamily="monospace">{health}/100</text>
                  </>
                )}
              </g>
            )
          })()}

          {/* Empty state */}
          {repos.length === 0 && (
            <>
              <circle cx={W/2} cy={H/2} r={45} fill="none" stroke="#1E2A3A" strokeWidth={1} strokeDasharray="5 5"/>
              <circle cx={W/2} cy={H/2} r={80} fill="none" stroke="#1E2A3A" strokeWidth={1} strokeDasharray="3 7" opacity={0.4}/>
              <text x={W/2} y={H/2-8} textAnchor="middle" fill="#334155" fontSize={13} fontWeight={600}>No repositories yet</text>
              <text x={W/2} y={H/2+10} textAnchor="middle" fill="#334155" fontSize={11}>Import one to populate the constellation</text>
            </>
          )}
        </svg>

        {/* Legend */}
        <div style={{ display:'flex', alignItems:'center', gap:20, padding:'10px 24px', borderTop:'1px solid #0F1520' }}>
          {[['#22c55e','Healthy (>70)'],['#f59e0b','Fair (40-70)'],['#ef4444','At Risk (<40)'],['#3b82f6','Analyzing']].map(([c,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}80` }}/>
              <span style={{ fontSize:11, color:'#475569' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
