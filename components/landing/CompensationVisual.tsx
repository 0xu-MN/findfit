'use client'

// Faithful port of the "Gold Glassmorphism Pro" reference build — the
// line-drawn clipboard+checkmark icon and a gold coin stack with a
// clickable 3D front coin. Left out: the mouse-tilt 3D interactivity, the
// HUD control panel (tilt/float/wisp sliders), the background canvas "light
// wisp" trails — those are dev-tool chrome and continuous per-frame canvas
// repaint, exactly the kind of cost this section's earlier perf pass
// eliminated (see ReviewerLanding notes). The click-to-sparkle burst IS kept
// (as a small framer-motion particle set, not a canvas loop), now triggered
// by clicking the coin itself rather than a separate demo button.
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const draw = (delay: number) => ({
  strokeDasharray: 1,
  strokeDashoffset: 1,
  animation: `compDraw 1.4s cubic-bezier(0.25,1,0.5,1) ${delay}s forwards`,
})

type Sparkle = { id: number; angle: number; dist: number }

function CoinSparkle({ angle, dist }: { angle: number; dist: number }) {
  const x = Math.cos(angle) * dist
  const y = Math.sin(angle) * dist
  return (
    <motion.span
      className="absolute rounded-full pointer-events-none"
      style={{ left: '50%', top: '50%', width: 6, height: 6, background: '#FFE9A8', boxShadow: '0 0 8px 2px rgba(255,220,140,0.9)' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0.3 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}

export default function CompensationVisual() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [jingling, setJingling] = useState(false)

  const jingle = () => {
    const burst = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      angle: (Math.PI * 2 * i) / 10 + Math.random() * 0.4,
      dist: 46 + Math.random() * 22,
    }))
    setSparkles(burst)
    setJingling(true)
    window.setTimeout(() => setSparkles([]), 700)
    window.setTimeout(() => setJingling(false), 500)
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes compDraw { to { stroke-dashoffset: 0; } }
        @keyframes compFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes compGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(255,180,50,0.45)) drop-shadow(0 0 12px rgba(255,150,30,0.25)); }
          50% { filter: drop-shadow(0 0 8px rgba(255,200,80,0.75)) drop-shadow(0 0 24px rgba(255,150,30,0.45)); }
        }
        @keyframes compSheen { 0% { transform: translateX(-150%) skewX(-25deg); } 100% { transform: translateX(150%) skewX(-25deg); } }
        @keyframes compJingle {
          0%, 100% { transform: rotateY(-18deg) rotateX(6deg) rotate(0deg) scale(1); }
          20% { transform: rotateY(-18deg) rotateX(6deg) rotate(-10deg) scale(1.08); }
          45% { transform: rotateY(-18deg) rotateX(6deg) rotate(8deg) scale(1.05); }
          70% { transform: rotateY(-18deg) rotateX(6deg) rotate(-4deg) scale(1.02); }
        }
        .comp-float { animation: compFloat 7s ease-in-out infinite; }
        .comp-neon { animation: compGlow 4.5s ease-in-out infinite; }
        .comp-jingle { animation: compJingle 0.5s ease-in-out; }
        .comp-sheen::after {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.05) 75%, transparent 100%);
          transform: translateX(-150%) skewX(-25deg);
          animation: compSheen 6s infinite cubic-bezier(0.4,0,0.2,1);
          pointer-events: none;
        }
      `}</style>

      {/* Ambient glow only — no boxed badge background behind the icon */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: '65%', height: '65%', background: 'radial-gradient(circle, rgba(229,169,61,0.28) 0%, transparent 72%)', filter: 'blur(45px)' }}
      />

      <div className="comp-float relative" style={{ width: 'min(80%, 340px)', aspectRatio: '1 / 1' }}>
        {/* Clipboard + checkmark line art */}
        <svg
          className="comp-neon absolute"
          viewBox="0 0 200 200"
          style={{ left: '8%', top: '13%', width: '68%', height: '68%' }}
          fill="none"
        >
          <defs>
            <linearGradient id="compGlassEdge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#d97706" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="compCoreLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffedd5" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Layer 1 — soft background glow strokes */}
          <rect pathLength={1} x="40" y="45" width="105" height="125" rx="18" stroke="#d97706" strokeWidth="16" strokeOpacity="0.15" strokeLinecap="round" filter="blur(6px)" style={draw(0)} />
          <path pathLength={1} d="M78 45 C78 30, 112 30, 112 45 Z" stroke="#d97706" strokeWidth="14" strokeOpacity="0.15" filter="blur(5px)" style={draw(0)} />
          <path pathLength={1} d="M65 94 L87 118 L131 70" stroke="#d97706" strokeWidth="24" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" filter="blur(6px)" style={draw(0)} />

          {/* Layer 2 — mid gold gradient body */}
          <rect pathLength={1} x="40" y="45" width="105" height="125" rx="18" stroke="url(#compGlassEdge)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" style={draw(0)} />
          <path pathLength={1} d="M78 45 C78 30, 112 30, 112 45 Z" stroke="url(#compGlassEdge)" strokeWidth="7" style={draw(0)} />
          <path pathLength={1} d="M65 94 L87 118 L131 70" stroke="url(#compGlassEdge)" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" style={draw(0)} />
          <rect pathLength={1} x="55" y="132" width="48" height="6" rx="3" stroke="url(#compGlassEdge)" strokeWidth="4.5" style={draw(0)} />
          <rect pathLength={1} x="55" y="146" width="48" height="6" rx="3" stroke="url(#compGlassEdge)" strokeWidth="4.5" style={draw(0)} />

          {/* Layer 3 — bright core light + checkmark highlight */}
          <rect pathLength={1} x="40" y="45" width="105" height="125" rx="18" stroke="url(#compCoreLight)" strokeWidth="2.2" strokeOpacity="0.9" style={draw(0.3)} />
          <path pathLength={1} d="M78 45 C78 30, 112 30, 112 45 Z" stroke="url(#compCoreLight)" strokeWidth="2.2" style={draw(0.3)} />
          <path pathLength={1} d="M65 94 L87 118 L131 70" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95" style={draw(0.5)} />
          <path pathLength={1} d="M65 94 L87 118 L131 70" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={draw(0.6)} />
          <rect pathLength={1} x="55" y="132" width="48" height="6" rx="3" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" style={draw(0.7)} />
          <rect pathLength={1} x="55" y="146" width="48" height="6" rx="3" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" style={draw(0.8)} />
        </svg>

        {/* Gold coin stack — distinct stacked coins, each with its own rim
            highlight, so it reads as coins and not a solid bar */}
        <div className="absolute" style={{ right: '4%', bottom: '10%', width: '52%', height: '52%' }}>
          <div className="absolute" style={{ width: 100, height: 132, right: 2, bottom: 10 }}>
            {[96, 74, 52, 30].map((top, i) => (
              <div
                key={top}
                className="absolute left-0 right-0 rounded-full"
                style={{
                  top,
                  height: 26,
                  background: 'linear-gradient(180deg, #E7A93B 0%, #B9791C 55%, #7A4A10 100%)',
                  border: '1px solid rgba(255,231,154,0.35)',
                  boxShadow: `0 ${6 - i}px 6px rgba(0,0,0,0.3)`,
                }}
              >
                <div className="absolute inset-x-[10%] top-[3px] h-[8px] rounded-full" style={{ background: 'rgba(255,240,200,0.4)' }} />
              </div>
            ))}
            {/* Top coin — brightest, flat-on view */}
            <div
              className="absolute left-0 right-0 rounded-full"
              style={{
                top: 0,
                height: 34,
                background: 'radial-gradient(ellipse at 35% 30%, #FFFAE6 0%, #FFDE7A 45%, #D99A2B 88%)',
                border: '1px solid rgba(255,246,214,0.6)',
                boxShadow: 'inset 0 -4px 6px rgba(110,62,12,0.3), 0 3px 5px rgba(0,0,0,0.25)',
              }}
            />
          </div>

          {/* Front 3D coin with ₩ — click for a coin-jingle sparkle burst */}
          <button
            type="button"
            onClick={jingle}
            className={`comp-sheen absolute rounded-full ${jingling ? 'comp-jingle' : ''}`}
            style={{
              width: '108px', height: '108px', left: 0, bottom: 8,
              transform: jingling ? undefined : 'rotateY(-18deg) rotateX(6deg)',
              filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.7))',
              cursor: 'pointer',
            }}
            aria-label="사례금 코인"
          >
            <div className="absolute inset-0 rounded-full p-[3.5px] shadow-2xl" style={{ background: 'linear-gradient(45deg, #78350f, #fde68a, #fcd34d, #78350f)' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center relative shadow-inner" style={{ background: 'linear-gradient(45deg, #b45309, #facc15, #d97706)' }}>
                <div className="absolute inset-[5px] rounded-full" style={{ border: '2px solid rgba(253,230,138,0.4)' }} />
                <span
                  className="relative font-black select-none"
                  style={{
                    fontSize: 40,
                    fontFamily: 'serif',
                    color: '#fffbeb',
                    textShadow: '0 4px 0 #92400e, 0 6px 1px #78350f, 0 8px 10px rgba(0,0,0,0.85)',
                  }}
                >
                  ₩
                </span>
              </div>
            </div>
            <AnimatePresence>
              {sparkles.map((s) => (
                <CoinSparkle key={s.id} angle={s.angle} dist={s.dist} />
              ))}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  )
}
