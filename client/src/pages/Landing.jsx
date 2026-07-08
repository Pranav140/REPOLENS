import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Landing.css'

/* ─────────────────────────────────────────────
   Particle constellation canvas
───────────────────────────────────────────── */
function ConstellationCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const PARTICLE_COUNT = 80
    const MAX_DIST = 140
    const particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.015,
      })
    }

    const mouse = { x: -9999, y: -9999 }
    const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // draw edges
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0, 255, 38, ${alpha})`
            ctx.lineWidth = 0.6
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // mouse proximity boost
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const mdx = p.x - mouse.x
        const mdy = p.y - mouse.y
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mdist < 200) {
          const alpha = (1 - mdist / 200) * 0.55
          ctx.beginPath()
          ctx.strokeStyle = `rgba(0, 255, 38, ${alpha})`
          ctx.lineWidth = 0.8
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
      }

      // draw nodes
      for (const p of particles) {
        p.pulse += p.pulseSpeed
        const glow = 0.55 + Math.sin(p.pulse) * 0.35

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        grad.addColorStop(0, `rgba(0,255,38,${glow})`)
        grad.addColorStop(1, 'rgba(0,255,38,0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,38,${glow})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="landing-canvas" />
}

/* ─────────────────────────────────────────────
   Cipher-decode text hook
───────────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@!%&'

function useCipherReveal(text, delay = 0) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let frame = 0
    let timeout
    timeout = setTimeout(() => {
      const total = text.length * 5
      const tick = () => {
        frame++
        const progress = Math.min(frame / total, 1)
        const revealed = Math.floor(progress * text.length)
        let out = ''
        for (let i = 0; i < text.length; i++) {
          if (i < revealed) {
            out += text[i]
          } else if (i < revealed + 4) {
            out += CHARS[Math.floor(Math.random() * CHARS.length)]
          } else {
            out += ' '
          }
        }
        setDisplayed(out)
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])
  return displayed
}

/* ─────────────────────────────────────────────
   Glitch title component
───────────────────────────────────────────── */
function GlitchTitle({ text }) {
  return (
    <h1 className="landing-title glitch" data-text={text}>
      {text}
    </h1>
  )
}

/* ─────────────────────────────────────────────
   Shared tilt behaviour hook
───────────────────────────────────────────── */
function useTilt() {
  const ref = useRef(null)
  const onMove = e => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const rx = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -10
    const ry = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  10
    el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width)  * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top)  / r.height) * 100}%`)
  }
  const onLeave = () => {
    const el = ref.current; if (!el) return
    el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }
  return { ref, onMove, onLeave }
}

/* ─────────────────────────────────────────────
   Card 1 — File-tree scanner
───────────────────────────────────────────── */
const TREE_FILES = [
  { indent: 0, name: 'src/', color: '#6ad2ff' },
  { indent: 1, name: 'index.js',    color: '#00ff26', ext: true },
  { indent: 1, name: 'parser/',     color: '#6ad2ff' },
  { indent: 2, name: 'ast.js',      color: '#00ff26', ext: true },
  { indent: 2, name: 'resolve.js',  color: '#00ff26', ext: true },
  { indent: 1, name: 'utils/',      color: '#6ad2ff' },
  { indent: 2, name: 'graph.js',    color: '#00ff26', ext: true },
]

function FileTreeCard({ index }) {
  const { ref, onMove, onLeave } = useTilt()
  const [active, setActive] = useState(-1)
  const [progress, setProgress] = useState({})

  useEffect(() => {
    let row = 0
    const next = () => {
      setActive(row)
      let p = 0
      const bar = setInterval(() => {
        p += 6 + Math.random() * 8
        setProgress(prev => ({ ...prev, [row]: Math.min(p, 100) }))
        if (p >= 100) {
          clearInterval(bar)
          row++
          if (row < TREE_FILES.length) setTimeout(next, 180)
          else setTimeout(() => { setActive(-1); setProgress({}); row = 0; setTimeout(next, 600) }, 400)
        }
      }, 28)
    }
    const t = setTimeout(next, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      ref={ref}
      className="feature-card fc-analysis"
      style={{ animationDelay: `${0.8 + index * 0.15}s` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="feature-card-glow" />
      <div className="fc-preview">
        <div className="fc-preview-bar">
          <span className="fc-dot" style={{background:'#ff5f57'}} />
          <span className="fc-dot" style={{background:'#febc2e'}} />
          <span className="fc-dot" style={{background:'#28c840'}} />
          <span className="fc-bar-label">parser · analyzing</span>
        </div>
        <div className="fc-tree">
          {TREE_FILES.map((f, i) => (
            <div key={i} className={`fc-row ${active === i ? 'active' : ''} ${(progress[i] ?? 0) >= 100 ? 'done' : ''}`}
              style={{ paddingLeft: `${f.indent * 12 + 6}px` }}>
              <span className="fc-row-icon">{f.ext ? '◆' : '▸'}</span>
              <span className="fc-row-name" style={{ color: (progress[i] ?? 0) >= 100 ? f.color : 'rgba(255,255,255,0.45)' }}>
                {f.name}
              </span>
              {active === i && (
                <div className="fc-progress-wrap">
                  <div className="fc-progress-bar" style={{ width: `${progress[i] ?? 0}%` }} />
                </div>
              )}
              {(progress[i] ?? 0) >= 100 && <span className="fc-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
      <p className="feature-title">Deep Analysis</p>
      <p className="feature-desc">Parse every file, map every dependency</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 2 — Live SVG dependency graph
───────────────────────────────────────────── */
const NODES = [
  { id: 0, x: 50,  y: 28, label: 'app' },
  { id: 1, x: 20,  y: 62, label: 'api' },
  { id: 2, x: 50,  y: 72, label: 'db'  },
  { id: 3, x: 80,  y: 62, label: 'ui'  },
  { id: 4, x: 20,  y: 38, label: 'auth'},
  { id: 5, x: 80,  y: 38, label: 'cfg' },
]
const EDGES = [[0,1],[0,3],[0,5],[1,2],[1,4],[3,5],[4,2]]

function GraphCard({ index }) {
  const { ref, onMove, onLeave } = useTilt()
  const [drawnEdges, setDrawnEdges] = useState([])
  const [pulse, setPulse] = useState(null)

  useEffect(() => {
    let i = 0
    setDrawnEdges([])
    const draw = () => {
      setDrawnEdges(prev => [...prev, EDGES[i]])
      setPulse(EDGES[i])
      i++
      if (i < EDGES.length) setTimeout(draw, 380)
      else setTimeout(() => { setDrawnEdges([]); setPulse(null); i = 0; setTimeout(draw, 500) }, 2200)
    }
    const t = setTimeout(draw, 700)
    return () => clearTimeout(t)
  }, [])

  const W = 200, H = 100
  const px = (p, max) => (p / 100) * max

  return (
    <div
      ref={ref}
      className="feature-card fc-graph"
      style={{ animationDelay: `${0.8 + index * 0.15}s` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="feature-card-glow" />
      <div className="fc-preview">
        <div className="fc-preview-bar">
          <span className="fc-dot" style={{background:'#ff5f57'}} />
          <span className="fc-dot" style={{background:'#febc2e'}} />
          <span className="fc-dot" style={{background:'#28c840'}} />
          <span className="fc-bar-label">dependency · graph</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="fc-svg">
          <defs>
            <filter id="glow-node">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <marker id="arr" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4" fill="none" stroke="rgba(0,255,38,0.6)" strokeWidth="0.8"/>
            </marker>
          </defs>
          {EDGES.map(([a, b], ei) => {
            const drawn = drawnEdges.some(([da,db]) => da===a && db===b)
            const isPulse = pulse && pulse[0]===a && pulse[1]===b
            if (!drawn) return null
            return (
              <line key={ei}
                x1={px(NODES[a].x, W)} y1={px(NODES[a].y, H)}
                x2={px(NODES[b].x, W)} y2={px(NODES[b].y, H)}
                stroke={isPulse ? 'rgba(0,255,38,0.9)' : 'rgba(0,255,38,0.3)'}
                strokeWidth={isPulse ? 1.2 : 0.8}
                strokeDasharray={isPulse ? '3 2' : 'none'}
                className={isPulse ? 'edge-pulse' : ''}
                markerEnd="url(#arr)"
              />
            )
          })}
          {NODES.map(n => {
            const isActive = drawnEdges.some(([a,b]) => a===n.id || b===n.id)
            return (
              <g key={n.id} filter="url(#glow-node)">
                <circle
                  cx={px(n.x, W)} cy={px(n.y, H)} r={isActive ? 5 : 3.5}
                  fill={isActive ? 'rgba(0,255,38,0.9)' : 'rgba(255,255,255,0.15)'}
                  stroke={isActive ? '#00ff26' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={0.8}
                  className={isActive ? 'node-active' : ''}
                />
                <text
                  x={px(n.x, W)} y={px(n.y, H) - 7}
                  textAnchor="middle"
                  fontSize="5"
                  fill={isActive ? 'rgba(0,255,38,0.9)' : 'rgba(255,255,255,0.25)'}
                  fontFamily="monospace"
                >{n.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <p className="feature-title">Visual Graph</p>
      <p className="feature-desc">Interactive dependency &amp; call graph</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 3 — AI token streamer
───────────────────────────────────────────── */
const AI_LINES = [
  { role: 'sys',  text: '> Scanning utils/graph.js …' },
  { role: 'ai',   text: 'Found 2 circular deps.' },
  { role: 'sys',  text: '> Checking auth/token.js …' },
  { role: 'ai',   text: 'No issues detected.' },
  { role: 'sys',  text: '> Summarising architecture …' },
  { role: 'ai',   text: 'Layered MVC, 94% coverage.' },
]

function AICard({ index }) {
  const { ref, onMove, onLeave } = useTilt()
  const [lines, setLines] = useState([])
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    // blink cursor
    const blink = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(blink)
  }, [])

  useEffect(() => {
    let li = 0, ci = 0
    setLines([])
    const typeChar = () => {
      const line = AI_LINES[li]
      ci++
      setLines(prev => {
        const next = [...prev]
        next[li] = { ...line, partial: line.text.slice(0, ci) }
        return next
      })
      if (ci < line.text.length) {
        setTimeout(typeChar, 28 + Math.random() * 22)
      } else {
        li++; ci = 0
        if (li < AI_LINES.length) setTimeout(typeChar, 320)
        else setTimeout(() => { setLines([]); li = 0; ci = 0; setTimeout(typeChar, 800) }, 2000)
      }
    }
    const t = setTimeout(typeChar, 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      ref={ref}
      className="feature-card fc-ai"
      style={{ animationDelay: `${0.8 + index * 0.15}s` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="feature-card-glow" />
      <div className="fc-preview">
        <div className="fc-preview-bar">
          <span className="fc-dot" style={{background:'#ff5f57'}} />
          <span className="fc-dot" style={{background:'#febc2e'}} />
          <span className="fc-dot" style={{background:'#28c840'}} />
          <span className="fc-bar-label">gemini · insight</span>
        </div>
        <div className="fc-ai-body">
          {lines.map((l, i) => (
            <div key={i} className={`fc-ai-line fc-ai-${l.role}`}>
              {l.role === 'ai' && <span className="fc-ai-gem">◈</span>}
              <span>{l.partial ?? l.text}</span>
              {i === lines.length - 1 && cursor && <span className="fc-ai-cur">▋</span>}
            </div>
          ))}
        </div>
      </div>
      <p className="feature-title">AI Insights</p>
      <p className="feature-desc">Gemini-powered explanations &amp; guides</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Magnetic CTA button
───────────────────────────────────────────── */
function MagneticButton({ onClick }) {
  const btnRef = useRef(null)
  const innerRef = useRef(null)

  const handleMove = e => {
    const btn = btnRef.current
    const inner = innerRef.current
    if (!btn || !inner) return
    const rect = btn.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.35
    const dy = (e.clientY - cy) * 0.35
    btn.style.transform = `translate(${dx}px, ${dy}px)`
    inner.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`
  }

  const handleLeave = () => {
    const btn = btnRef.current
    const inner = innerRef.current
    if (btn) btn.style.transform = 'translate(0,0)'
    if (inner) inner.style.transform = 'translate(0,0)'
  }

  return (
    <div
      ref={btnRef}
      className="cta-wrapper"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <button
        ref={innerRef}
        className="cta-btn"
        onClick={onClick}
        id="landing-get-started"
      >
        <span className="cta-btn-text">Get Started</span>
        <span className="cta-btn-arrow">→</span>
        <span className="cta-btn-ripple" />
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Landing page
───────────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const tagline = useCipherReveal('Understand repositories, not just code.', 900)

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/dashboard')
  }, [navigate, isAuthenticated, loading])

  return (
    <div className="landing-root">
      <ConstellationCanvas />

      {/* ambient glow blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="landing-content">
        {/* badge */}
        <span className="landing-badge">
          <span className="badge-dot" />
          Open Source · GitHub Native
        </span>

        {/* title */}
        <GlitchTitle text="RepoLens" />

        {/* tagline */}
        <p className="landing-tagline">
          <span className="tagline-cursor">{tagline}</span>
        </p>

        {/* feature cards */}
        <div className="features-grid">
          <FileTreeCard index={0} />
          <GraphCard    index={1} />
          <AICard       index={2} />
        </div>

        {/* CTA */}
        <MagneticButton onClick={() => navigate('/login')} />
      </div>
    </div>
  )
}
