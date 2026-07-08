import { useEffect, useState } from 'react'
import CardSwap, { Card } from '../components/shared/CardSwap'
import DotGrid from '../components/shared/DotGrid'
import { Hexagon } from 'lucide-react'

export default function Login() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  function handleGitHubLogin() {
    const scope = 'repo,read:user'
    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex w-full" style={{ background: 'var(--bg-base)' }}>
      {/* Interactive DotGrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <DotGrid
          dotSize={6}
          gap={32}
          baseColor="#1e293b" // subtle dark slategray for normal dots
          activeColor="#4318ff" // repolens accent blue for hovered/active dots
          proximity={150}
          shockRadius={200}
          shockStrength={6}
          resistance={750}
          returnDuration={1.2}
        />
      </div>

      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 relative z-10" style={{ animation: 'fadeSlideUp 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        {/* Glassmorphism Card */}
        <div 
          className="w-full max-w-[420px] rounded-3xl p-12 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 24, 34, 0.7) 0%, rgba(10, 14, 20, 0.9) 100%)',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 20px rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {/* Top Edge Glow */}
          <div className="absolute top-0 inset-x-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          {/* Ambient Glow behind logo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[var(--accent-blue)] rounded-full blur-[80px] opacity-20 pointer-events-none" />

          {/* Logo Illustration */}
          <div className="relative mb-8 group">
            {/* Ambient Backlight */}
            <div className="absolute inset-0 bg-[#3b82f6] opacity-20 blur-[30px] rounded-full scale-150 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
            
            <div 
              className="w-20 h-20 rounded-[22px] flex items-center justify-center relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-1"
              style={{
                background: 'linear-gradient(180deg, #111827 0%, #0D111A 100%)',
                boxShadow: '0 15px 35px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
                border: '1px solid #1E2A3A'
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {/* The Lens */}
                <circle cx="11" cy="11" r="8" className="stroke-slate-300 transition-all duration-300 group-hover:stroke-white" strokeWidth="2" />
                {/* The Handle */}
                <line x1="21" y1="21" x2="16.65" y2="16.65" className="stroke-slate-500 group-hover:stroke-slate-300 transition-colors duration-300" strokeWidth="2.5" />
                
                {/* Inner Code / Git Node */}
                <g className="transition-transform duration-500 origin-[11px_11px] group-hover:scale-110">
                  <circle cx="11" cy="11" r="2.5" fill="#3b82f6" stroke="none" />
                  <line x1="5" y1="11" x2="8.5" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                  <line x1="13.5" y1="11" x2="17" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-4 tracking-tight">RepoLens</h1>
          
          <p className="text-[15px] mb-10 leading-relaxed text-gray-400 font-medium">
            Sign in to start exploring deep analytics, <br/> health metrics, and architecture.
          </p>

          {/* GitHub Button */}
          <button 
            onClick={handleGitHubLogin}
            className="w-full relative group overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            {/* Button Border Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Button Body */}
            <div className="relative w-full bg-[#1A1F2B] group-hover:bg-[#232936] transition-colors duration-300 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current transition-transform duration-300 group-hover:scale-110"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg>
              Continue with GitHub
            </div>
          </button>
          
          <div className="mt-8 text-xs text-gray-500 font-medium">
            By continuing, you agree to our <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms</a> & <a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Feature Showcase (CardSwap) */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative z-10 p-12">
        <div style={{ height: '600px', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(-60px)' }}>
          <CardSwap
            cardDistance={100}
            verticalDistance={50}
            delay={4000}
            pauseOnHover={true}
            width={560}
            height={660}
          >
            <Card customClass="p-10 flex flex-col justify-between h-full w-full" style={{ background: 'linear-gradient(135deg, #1A1F2B 0%, #12161E 100%)' }}>
              <div>
                <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center" style={{ background: 'var(--accent-blue-bg)' }}>
                  <svg className="w-7 h-7 text-[#00FF26]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Deep Architecture Scans</h3>
                <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed text-base">
                  Automatically map your codebase, discover dependencies, and understand the core architecture of complex projects in seconds.
                </p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-2 w-12 rounded-full bg-[#00FF26]/50"></div>
                <div className="h-2 w-8 rounded-full bg-white/10"></div>
                <div className="h-2 w-8 rounded-full bg-white/10"></div>
              </div>
            </Card>
            
            <Card customClass="p-10 flex flex-col justify-between h-full w-full" style={{ background: 'linear-gradient(135deg, #12161E 0%, #1A1F2B 100%)' }}>
              <div>
                <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center" style={{ background: 'rgba(67, 24, 255, 0.15)' }}>
                  <svg className="w-7 h-7 text-[#4318FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Security Vulnerability Checks</h3>
                <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed text-base">
                  Identify and fix security flaws before they reach production. Our automated agents find hidden exploits in real-time.
                </p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-2 w-8 rounded-full bg-white/10"></div>
                <div className="h-2 w-12 rounded-full bg-[#4318FF]/50"></div>
                <div className="h-2 w-8 rounded-full bg-white/10"></div>
              </div>
            </Card>

            <Card customClass="p-10 flex flex-col justify-between h-full w-full" style={{ background: 'linear-gradient(135deg, #1A1F2B 0%, #12161E 100%)' }}>
              <div>
                <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center" style={{ background: 'rgba(255, 181, 71, 0.15)' }}>
                  <svg className="w-7 h-7 text-[#FFB547]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Health & Analytics Tracking</h3>
                <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed text-base">
                  Monitor the overall health of your repositories with advanced metrics, developer activity tracking, and code quality scoring.
                </p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-2 w-8 rounded-full bg-white/10"></div>
                <div className="h-2 w-8 rounded-full bg-white/10"></div>
                <div className="h-2 w-12 rounded-full bg-[#FFB547]/50"></div>
              </div>
            </Card>
          </CardSwap>
        </div>
      </div>
    </div>
  )
}
