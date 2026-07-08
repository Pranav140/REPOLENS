import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/api'
import './AuthCallback.css'

/* ─── Auth steps shown sequentially ─── */
const STEPS = [
  { id: 'handshake', label: 'Establishing secure handshake',  icon: '⟳' },
  { id: 'token',     label: 'Verifying OAuth token',          icon: '⬡' },
  { id: 'profile',   label: 'Loading your GitHub profile',    icon: '◈' },
  { id: 'workspace', label: 'Preparing your workspace',       icon: '▣' },
]

/* ─── Orbital particle canvas ─── */
function OrbitalCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 280, H = 280
    canvas.width = W; canvas.height = H
    const cx = W / 2, cy = H / 2

    // Orbiting particles
    const ORBITS = [
      { r: 90, count: 9,  speed: 0.008,  size: 2.5, color: '#3b82f6' },
      { r: 65, count: 6,  speed: -0.013, size: 2,   color: '#00ff26' },
      { r: 42, count: 4,  speed: 0.022,  size: 1.5, color: '#6ad2ff' },
    ]
    const orbits = ORBITS.map(o => ({
      ...o,
      particles: Array.from({ length: o.count }, (_, i) => ({
        angle: (i / o.count) * Math.PI * 2,
        trailLen: 0.35 + Math.random() * 0.25,
      }))
    }))

    // Pulse ring
    let pulseR = 30, pulseAlpha = 0.8

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Faint orbit tracks
      orbits.forEach(o => {
        ctx.beginPath()
        ctx.arc(cx, cy, o.r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Pulse ring
      pulseR += 0.7
      pulseAlpha -= 0.008
      if (pulseR > 110 || pulseAlpha <= 0) { pulseR = 30; pulseAlpha = 0.8 }
      ctx.beginPath()
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(59,130,246,${pulseAlpha * 0.3})`
      ctx.lineWidth = 2
      ctx.stroke()

      // Centre glow
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20)
      cg.addColorStop(0, 'rgba(59,130,246,0.6)')
      cg.addColorStop(1, 'rgba(59,130,246,0)')
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fillStyle = cg; ctx.fill()

      // Centre dot
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()

      // Orbiting particles + trails
      orbits.forEach(o => {
        o.particles.forEach(p => {
          p.angle += o.speed
          const x = cx + Math.cos(p.angle) * o.r
          const y = cy + Math.sin(p.angle) * o.r

          // Trail
          const steps = 18
          for (let s = 0; s < steps; s++) {
            const ta = p.angle - o.speed * s * 2
            const tx = cx + Math.cos(ta) * o.r
            const ty = cy + Math.sin(ta) * o.r
            const alpha = (1 - s / steps) * 0.5
            ctx.beginPath(); ctx.arc(tx, ty, o.size * 0.6, 0, Math.PI * 2)
            ctx.fillStyle = o.color.replace(')', `,${alpha})`).replace('rgb', 'rgba')
            // parse hex to rgba
            const hex = o.color
            const r2 = parseInt(hex.slice(1,3),16)
            const g2 = parseInt(hex.slice(3,5),16)
            const b2 = parseInt(hex.slice(5,7),16)
            ctx.fillStyle = `rgba(${r2},${g2},${b2},${alpha})`
            ctx.fill()
          }

          // Particle dot
          const grd = ctx.createRadialGradient(x, y, 0, x, y, o.size * 2)
          grd.addColorStop(0, o.color)
          grd.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(x, y, o.size * 2, 0, Math.PI * 2)
          ctx.fillStyle = grd; ctx.fill()
          ctx.beginPath(); ctx.arc(x, y, o.size, 0, Math.PI * 2)
          ctx.fillStyle = o.color; ctx.fill()
        })
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} className="ac-orbital-canvas" />
}

/* ─── Grid pulse background ─── */
function GridBackground() {
  return (
    <div className="ac-grid-bg">
      <div className="ac-grid-lines" />
      <div className="ac-grid-pulse" />
    </div>
  )
}

/* ─── Main AuthCallback ─── */
export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError]   = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [done, setDone]     = useState(false)

  // Advance steps every 800ms so all 4 fill in ~3.2 s
  useEffect(() => {
    const iv = setInterval(() => {
      setStepIdx(i => (i < STEPS.length - 1 ? i + 1 : i))
    }, 800)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No authorization code received from GitHub.')
      return
    }
    api.post('/api/auth/github', { code })
      .then(res => {
        const { token, user } = res.data
        localStorage.setItem('repolens_token', token)
        localStorage.setItem('repolens_user', JSON.stringify(user))
        // Show all steps as done, flash success, then redirect after 3.5 s total
        setStepIdx(STEPS.length - 1)
        setDone(true)
        setTimeout(() => navigate('/dashboard'), 3500)
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Authentication failed. Please try again.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Error state ── */
  if (error) {
    return (
      <div className="ac-root">
        <GridBackground />
        <div className="ac-error-card">
          <div className="ac-error-icon">✕</div>
          <h2 className="ac-error-title">Authentication Failed</h2>
          <p className="ac-error-msg">{error}</p>
          <button className="ac-retry-btn" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  /* ── Loading state ── */
  return (
    <div className="ac-root">
      <GridBackground />

      <div className="ac-content">
        {/* Orbital loader */}
        <div className="ac-orbital-wrap">
          <OrbitalCanvas />
          {/* Spinning ring overlays */}
          <div className="ac-ring ac-ring-1" />
          <div className="ac-ring ac-ring-2" />
        </div>

        {/* Text block */}
        <div className="ac-text-block">
          <h2 className={`ac-title ${done ? 'ac-title-done' : ''}`}>
            {done ? 'Connected!' : 'Authenticating'}
          </h2>
          <p className="ac-subtitle">
            {done ? 'Redirecting to your dashboard…' : 'GitHub OAuth · Secure handshake in progress'}
          </p>
          {done && <div className="ac-redirect-bar"><div className="ac-redirect-fill" /></div>}
        </div>

        {/* Step progress */}
        <div className="ac-steps">
          {STEPS.map((s, i) => {
            const isDone   = done || i < stepIdx
            const isActive = !done && i === stepIdx
            return (
              <div
                key={s.id}
                className={`ac-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              >
                <span className="ac-step-icon">{isDone ? '✓' : s.icon}</span>
                <span className="ac-step-label">{s.label}</span>
                {isActive && <span className="ac-step-spinner" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
