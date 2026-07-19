'use client'

// Ported (visual scene only — the sandbox's top nav, 3D-toggle/reload
// buttons, and footer status deck are dev-tool chrome, not part of the
// motion graphic itself) from a standalone "Glassmorphism Premium Hero"
// GSAP sandbox build. Reimplemented with framer-motion (already the
// codebase's animation library everywhere else) instead of loading GSAP
// from a CDN script tag, which would be an SSR-unsafe, per-mount network
// fetch for a single self-contained decorative scene:
//   - the GSAP timeline's staggered entrance (dashboard slide-up, side
//     cards sliding in, magnifier scaling in, label dropping in, then the
//     line/bar charts drawing in) is reproduced as per-element
//     initial/animate delays
//   - the line chart's stroke-draw uses framer's built-in `pathLength`
//     motion value instead of the source's manual
//     `getTotalLength`/`strokeDasharray` ref trick — same visual result
//   - the continuous loops (dashboard float, donut spin, label pulse,
//     magnifier sweep) run as infinite framer transitions
//   - the mouse-parallax side cards + 3D dashboard tilt are kept, scoped
//     to this component's own bounding box instead of the full-page
//     `<main>` the sandbox used; the "3D ANGLE ON/OFF" toggle was a demo
//     control, so the tilt is simply always on
import { useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const STAGE_W = 840
const STAGE_H = 504
const DASH_W = 620
const DASH_H = 400

const LINE_POINTS: [number, number][] = [
  [60, 90],
  [90, 105],
  [130, 60],
  [170, 85],
  [210, 35],
  [250, 55],
  [290, 10],
]
const BARS = [
  { x: 10, h: 45 },
  { x: 45, h: 70 },
  { x: 80, h: 55 },
  { x: 115, h: 80 },
  { x: 150, h: 90 },
]

export default function TrendDashboardVisual() {
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`

  const containerRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 })
  }
  const handleMouseLeave = () => setMouse({ x: 0, y: 0 })

  const cardLeftStyle = { transform: `translate3d(${mouse.x * -15}px, ${mouse.y * -15}px, 0)`, transition: 'transform 0.4s ease-out' }
  const cardRightStyle = { transform: `translate3d(${mouse.x * 15}px, ${mouse.y * 15}px, 0)`, transition: 'transform 0.4s ease-out' }
  const dashboardTilt = {
    transform: `rotateX(${20 + mouse.y * -12}deg) rotateY(${-12 + mouse.x * 12}deg)`,
    transition: 'transform 0.5s ease-out',
    transformStyle: 'preserve-3d' as const,
  }

  return (
    <div className="trend-dashboard-scene relative w-full h-full flex items-center justify-center overflow-hidden">
      <style>{`
        .trend-dashboard-scene .glass-card {
          width: 150px;
          height: 180px;
          backdrop-filter: blur(25px);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 1.25rem;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }
        .trend-dashboard-scene .glass-card .icon {
          margin-bottom: 0.75rem;
          padding: 0.65rem;
          border-radius: 16px;
          background: rgba(9, 34, 38, 0.85);
          border: 1px solid rgba(111, 231, 214, 0.2);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .trend-dashboard-scene .glass-card .title {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.15rem;
        }
        .trend-dashboard-scene .glass-card .subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          color: #94a3b8;
        }
        .trend-dashboard-scene .glass-card .trend-badge {
          font-size: 11px;
          font-family: monospace;
          font-weight: 700;
          color: #6FE7D6;
          margin-top: 0.1rem;
        }
      `}</style>

      {/* Ambient glow, scoped down from the sandbox's full-page background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[420px] h-[280px] bg-[#6FE7D6]/5 rounded-full blur-[90px]" />
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative"
        style={{ width: STAGE_W, height: STAGE_H, transform: 'scale(0.78)', perspective: 1500 }}
      >
        {/* Floating "검증 중인 아이디어" label, dropping in above the dashboard */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-30"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 1.65 }}
        >
          <motion.div
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-white/20 bg-gradient-to-r from-teal-950/60 to-slate-900/70 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2.45 }}
          >
            <span className="w-2 h-2 rounded-full bg-[#6FE7D6] animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-white whitespace-nowrap">검증 중인 아이디어</span>
          </motion.div>
        </motion.div>

        {/* Dashboard: entrance slide-up, then a continuous slow float */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 64, width: DASH_W, height: DASH_H }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="relative w-full h-full"
            style={dashboardTilt}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Glass panel backplate */}
            <div className="absolute inset-0 w-full h-full rounded-[40px] overflow-hidden pointer-events-none z-10">
              <svg width={DASH_W} height={DASH_H} viewBox={`0 0 ${DASH_W} ${DASH_H}`} className="w-full h-full">
                <defs>
                  <linearGradient id={id('glass')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,.12)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,.02)" />
                  </linearGradient>
                  <linearGradient id={id('borderGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,.05)" />
                  </linearGradient>
                  <linearGradient id={id('reflectionGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  <filter id={id('dashboardGlow')} x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComponentTransfer in="blur" result="boost">
                      <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="boost" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect
                  x="2" y="2" width={DASH_W - 4} height={DASH_H - 4} rx="40"
                  fill={`url(#${id('glass')})`}
                  stroke={`url(#${id('borderGrad')})`}
                  strokeWidth="2.5"
                  filter={`url(#${id('dashboardGlow')})`}
                />
                <path d="M 2 120 L 240 2 L 290 2 L 2 145 Z" fill={`url(#${id('reflectionGrad')})`} opacity="0.15" />
                <path d="M 2 40 L 85 2 L 120 2 L 2 59 Z" fill={`url(#${id('reflectionGrad')})`} opacity="0.2" />

                <g opacity="0.07" stroke="#ffffff" strokeWidth="1">
                  <line x1="30" y1="40" x2="30" y2="360" />
                  <line x1="100" y1="40" x2="100" y2="360" />
                  <line x1="170" y1="40" x2="170" y2="360" />
                  <line x1="240" y1="40" x2="240" y2="360" />
                  <line x1="310" y1="40" x2="310" y2="360" strokeDasharray="4 4" />
                  <line x1="30" y1="100" x2="590" y2="100" />
                  <line x1="30" y1="180" x2="590" y2="180" />
                  <line x1="30" y1="260" x2="590" y2="260" />
                </g>

                <g transform="translate(45, 290)" opacity="0.4" fill="#ffffff">
                  <rect x="0" y="0" width="110" height="6" rx="3" />
                  <rect x="0" y="16" width="140" height="6" rx="3" />
                  <rect x="0" y="32" width="80" height="6" rx="3" />
                </g>
              </svg>
            </div>

            {/* Line chart, top-left */}
            <div className="absolute top-[18%] left-[10%] w-[320px] h-[180px] pointer-events-none z-[15]">
              <svg width="320" height="180" viewBox="0 0 320 180">
                <defs>
                  <linearGradient id={id('chartGradient')} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9FF3E8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#9FF3E8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M20 140 L60 90 L90 105 L130 60 L170 85 L210 35 L250 55 L290 10 L290 180 L20 180 Z"
                  fill={`url(#${id('chartGradient')})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.6, delay: 2.15 }}
                />
                <motion.path
                  d="M20 140 L60 90 L90 105 L130 60 L170 85 L210 35 L250 55 L290 10"
                  fill="none"
                  stroke="#9FF3E8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.8, ease: 'easeOut', delay: 2.15 }}
                />
                {LINE_POINTS.map(([x, y], i) => (
                  <motion.circle
                    key={i}
                    cx={x} cy={y} r="5"
                    fill="#B9FFF5" stroke="#020708" strokeWidth="1.5"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.15 + (i / LINE_POINTS.length) * 1.8, duration: 0.3 }}
                  />
                ))}
              </svg>
            </div>

            {/* Donut chart — aligned directly above the bar chart's column,
                right next to the line chart, per feedback that it read as
                floating disconnected from the bars below it */}
            <div className="absolute top-[18%] right-[13%] w-[160px] h-[160px] pointer-events-none z-[15] overflow-visible">
              <svg width="100%" height="100%" viewBox="0 0 260 260" style={{ overflow: 'visible' }} className="w-full h-full">
                <defs>
                  <filter id={id('donutGlow')} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <motion.g
                  transform="translate(130 130)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <circle r="75" fill="none" stroke="#7B3FF2" strokeWidth="32" strokeDasharray="250 470" strokeLinecap="round" filter={`url(#${id('donutGlow')})`} opacity="0.85" />
                  <circle r="75" fill="none" stroke="#6FE7D6" strokeWidth="32" strokeDasharray="150 470" strokeDashoffset="-260" strokeLinecap="round" filter={`url(#${id('donutGlow')})`} opacity="0.9" />
                  <circle r="34" fill="#06181b" />
                </motion.g>
              </svg>
            </div>

            {/* Bar chart, bottom-right */}
            <div className="absolute bottom-[14%] right-[10%] w-[200px] h-[100px] pointer-events-none z-[15]">
              <svg width="200" height="100" viewBox="0 0 200 100" className="w-full h-full">
                <defs>
                  <linearGradient id={id('barGrad')} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6FE7D6" />
                    <stop offset="100%" stopColor="#0a2a2f" />
                  </linearGradient>
                </defs>
                {BARS.map((bar, i) => (
                  <motion.rect
                    key={i}
                    x={bar.x} width={22} rx={5}
                    fill={`url(#${id('barGrad')})`}
                    opacity={0.8}
                    initial={{ y: 100, height: 0 }}
                    animate={{ y: 100 - bar.h, height: bar.h }}
                    transition={{ duration: 1.4, ease: 'backOut', delay: 2.15 + i * 0.1 }}
                  />
                ))}
              </svg>
            </div>

            {/* Left feature card — slides in, then drifts opposite the mouse */}
            <motion.div
              className="absolute left-[-110px] top-[30%] z-20"
              style={cardLeftStyle}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'backOut', delay: 0.6 }}
            >
              <div className="glass-card">
                <div className="icon">
                  <svg className="w-6 h-6 text-[#6FE7D6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="title">문제 해결</div>
                <div className="subtitle">트렌드</div>
              </div>
            </motion.div>

            {/* Right feature card — slides in, then drifts with the mouse */}
            <motion.div
              className="absolute right-[-110px] top-[30%] z-20"
              style={cardRightStyle}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'backOut', delay: 0.75 }}
            >
              <div className="glass-card">
                <div className="icon">
                  <svg className="w-6 h-6 text-[#6FE7D6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="title">시장 반응</div>
                <div className="trend-badge">+18.4%</div>
              </div>
            </motion.div>

            {/* Magnifier — scales in over the line chart, then sweeps across it */}
            <motion.div
              className="absolute left-[20%] bottom-[-10%] z-40 w-[250px] h-[250px] pointer-events-none"
              style={{ filter: 'drop-shadow(0 25px 45px rgba(0,0,0,0.8))' }}
              initial={{ scale: 0.6, rotate: -25, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 1.05 }}
            >
              <motion.svg
                width="100%" height="100%" viewBox="0 0 220 220" className="w-full h-full"
                animate={{ x: [0, 70, 0], y: [0, -45, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut', delay: 2.05 }}
              >
                <defs>
                  <linearGradient id={id('magnifierGlass')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
                    <stop offset="40%" stopColor="rgba(255, 255, 255, 0.05)" />
                    <stop offset="100%" stopColor="rgba(111, 231, 214, 0.1)" />
                  </linearGradient>
                </defs>
                <circle cx="90" cy="90" r="60" fill={`url(#${id('magnifierGlass')})`} stroke="#ffffff" strokeWidth="10" />
                <path d="M 42,62 A 50,50 0 0 1 138,62 A 50,20 0 0 0 42,62 Z" fill="#ffffff" opacity="0.25" />
                <circle cx="90" cy="90" r="53" fill="none" stroke="#6FE7D6" strokeWidth="1" opacity="0.4" />
                <line x1="135" y1="135" x2="190" y2="190" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
                <line x1="142" y1="142" x2="182" y2="182" stroke="rgba(4, 15, 17, 0.5)" strokeWidth="4" strokeLinecap="round" />
              </motion.svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
