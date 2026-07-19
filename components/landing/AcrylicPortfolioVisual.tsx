'use client'

// Ported (visual scene only — the sandbox's control sliders/header/footer
// are dev-tool chrome, not part of the motion graphic itself) from a
// standalone "3D Acrylic Physical Space Sandbox" reference build. Tuned past
// the reference's default state per feedback: float amplitude and layer gap
// pushed toward the sandbox's slider maximums, and the cylindrical pedestal
// base removed (purple palette, pitch 12°, yaw -14°).
import { motion } from 'framer-motion'

const acrylicStyles = `
  .acrylic-portfolio-viewport {
    perspective: 1800px;
    transform-style: preserve-3d;
  }

  .acrylic-portfolio-scene .thick-glass-3d {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(28px) saturate(145%);
    -webkit-backdrop-filter: blur(28px) saturate(145%);
    border: 2px solid rgba(255, 255, 255, 0.22);
    box-shadow:
      inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.55),
      inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.35),
      0 1px 1px rgba(255, 255, 255, 0.15),
      0 12px 30px rgba(0, 0, 0, 0.45);
    border-radius: 24px;
    transform-style: preserve-3d;
  }

  .acrylic-portfolio-scene .clay-extruded-purple {
    background: linear-gradient(135deg, #be93fc 0%, #7c3aed 100%);
    box-shadow:
      inset 0 4px 5px rgba(255, 255, 255, 0.65),
      inset 0 -5px 6px rgba(0, 0, 0, 0.4),
      0 8px 18px rgba(124, 58, 237, 0.35);
  }

  .acrylic-portfolio-scene .clay-extruded-light {
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
    box-shadow:
      inset 0 3px 4px rgba(255, 255, 255, 0.95),
      inset 0 -3px 4px rgba(0, 0, 0, 0.25),
      0 5px 12px rgba(0, 0, 0, 0.15);
  }

  .acrylic-portfolio-scene .glowing-connector {
    stroke-dasharray: 5, 5;
    animation: acrylic-portfolio-flow-dash 12s linear infinite;
  }
  @keyframes acrylic-portfolio-flow-dash {
    to { stroke-dashoffset: -120; }
  }

  .acrylic-portfolio-scene .ambient-purple-glow {
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 68%);
  }
  .acrylic-portfolio-scene .ambient-cyan-glow {
    background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 68%);
  }
`

// Pitch/yaw kept at the reference build's default state; float amplitude and
// layer gap pushed to roughly the sandbox's slider maximums per feedback.
const PITCH = 12
const YAW = -14
const LAYER_GAP = 80
const FLOAT_AMPLITUDE = 32
const STAR_COUNT = 5
const BUBBLE_MESSAGE = 'Nice work!'
const PALETTE = {
  primary: '#9333ea',
  gradient: 'linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)',
  clayClass: 'clay-extruded-purple',
  glow: 'rgba(147, 51, 234, 0.45)',
  accentLight: '#d8b4fe',
}

export default function AcrylicPortfolioVisual() {
  return (
    <div className="acrylic-portfolio-scene relative w-full h-full flex items-center justify-center overflow-hidden">
      <style>{acrylicStyles}</style>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45">
        <div className="absolute top-[10%] left-[55%] w-[300px] h-[300px] ambient-purple-glow rounded-full" />
        <div className="absolute bottom-[5%] left-[10%] w-[260px] h-[260px] ambient-cyan-glow rounded-full" />
      </div>

      <div className="acrylic-portfolio-viewport flex items-center justify-center w-full h-full relative" style={{ transform: 'scale(0.92)' }}>
        <motion.div
          className="relative w-[420px] h-[480px] flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d', transform: `rotateX(${PITCH}deg) rotateY(${YAW}deg)` }}
          animate={{ y: [0, -FLOAT_AMPLITUDE, 0] }}
          transition={{ y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
        >
          {/* Connector lines between the floating bubbles and the folder slot */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 420 480" style={{ transform: 'translateZ(15px)' }}>
            <defs>
              <linearGradient id="acrylic-portfolio-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.accentLight} stopOpacity="0.8" />
                <stop offset="100%" stopColor={PALETTE.primary} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path className="glowing-connector" d="M 125 155 C 150 155, 175 160, 195 210" fill="none" stroke="url(#acrylic-portfolio-glow-grad)" strokeWidth="2" />
            <path className="glowing-connector" d="M 145 240 C 170 240, 180 240, 195 245" fill="none" stroke="url(#acrylic-portfolio-glow-grad)" strokeWidth="2" />
            <path className="glowing-connector" d="M 125 315 C 160 315, 175 310, 195 280" fill="none" stroke="url(#acrylic-portfolio-glow-grad)" strokeWidth="2" />
          </svg>

          {/* Bubble 1: heart (top-left) */}
          <motion.div
            className="thick-glass-3d absolute left-[12px] top-[105px] w-[68px] h-[68px] flex items-center justify-center z-20 shadow-2xl"
            style={{ transform: `translateZ(${LAYER_GAP * 1.3}px)`, transformStyle: 'preserve-3d' }}
          >
            <div className={`w-[32px] h-[32px] relative flex items-center justify-center rounded-full ${PALETTE.clayClass}`} style={{ transform: 'translateZ(8px)' }}>
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] drop-shadow-md">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <div className="absolute bottom-[-6px] right-[18px] w-3 h-3 bg-white/10 rotate-45 border-r border-b border-white/20" style={{ backdropFilter: 'blur(10px)' }} />
          </motion.div>

          {/* Bubble 2: star rating (middle-left) */}
          <motion.div
            className="thick-glass-3d absolute left-[-15px] top-[195px] px-4 py-3.5 flex items-center justify-center z-20 min-w-[130px] shadow-2xl"
            style={{ transform: `translateZ(${LAYER_GAP * 1.5}px)`, transformStyle: 'preserve-3d' }}
          >
            <div className="flex gap-1" style={{ transform: 'translateZ(10px)' }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-lg font-bold leading-none ${idx < STAR_COUNT ? 'text-transparent bg-clip-text' : 'text-purple-950/60'}`}
                  style={{
                    backgroundImage: idx < STAR_COUNT ? PALETTE.gradient : 'none',
                    textShadow: idx < STAR_COUNT ? `0 2px 8px ${PALETTE.glow}` : 'none',
                    transform: 'translateZ(5px)',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="absolute bottom-[-6px] right-[24px] w-3 h-3 bg-white/10 rotate-45 border-r border-b border-white/20" />
          </motion.div>

          {/* Bubble 3: text note (bottom-left) */}
          <motion.div
            className="thick-glass-3d absolute left-[2px] top-[275px] px-5 py-4 flex flex-col justify-center gap-2 z-20 max-w-[160px] shadow-2xl"
            style={{ transform: `translateZ(${LAYER_GAP * 1.2}px)`, transformStyle: 'preserve-3d' }}
          >
            <div className="text-xs font-bold text-white tracking-wide truncate max-w-[125px]" style={{ transform: 'translateZ(12px)' }}>
              {BUBBLE_MESSAGE}
            </div>
            <div className="flex flex-col gap-1.5" style={{ transform: 'translateZ(10px)' }}>
              <div className="w-[70px] h-[6px] rounded-full clay-extruded-light" />
              <div className="w-[45px] h-[6px] rounded-full clay-extruded-light opacity-70" />
            </div>
            <div className="absolute bottom-[-6px] right-[20px] w-3 h-3 bg-white/10 rotate-45 border-r border-b border-white/20" />
          </motion.div>

          {/* Profile / activity-record card stack */}
          <div className="relative w-[220px] h-[260px] z-10" style={{ transform: 'translateX(65px) translateY(-15px)', transformStyle: 'preserve-3d' }}>
            {/* Layer 1: back sheet */}
            <motion.div
              className="absolute inset-0 bg-white/[0.02] border-2 border-white/10 rounded-[28px] origin-bottom shadow-lg"
              style={{ transform: `translateZ(${-LAYER_GAP}px) scale(0.95)`, backdropFilter: 'blur(10px)' }}
            >
              <div className="w-[12px] h-[12px] rounded-full bg-white/10 absolute top-5 left-5 shadow-inner" />
              <div className="w-[60px] h-[5px] rounded-full bg-white/5 absolute top-6 left-10" />
            </motion.div>

            {/* Layer 2: active profile card */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.01] border-2 border-white/20 rounded-[28px] py-6 px-5 flex flex-col justify-between shadow-2xl origin-bottom"
              style={{
                transform: 'translateZ(0px)',
                backdropFilter: 'blur(24px) saturate(130%)',
                boxShadow: 'inset 2px 2px 2px rgba(255,255,255,0.3), 0 20px 40px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex flex-col gap-6 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-full relative flex items-center justify-center">
                    <div className="absolute inset-[-3px] rounded-full border border-dashed border-purple-400/35" />
                    <div className={`w-full h-full rounded-full overflow-hidden relative flex flex-col items-center justify-center shadow-lg ${PALETTE.clayClass}`}>
                      <div className="absolute inset-[2.5px] rounded-full bg-white/15" />
                      <div className="w-[16px] h-[16px] rounded-full bg-white shadow-inner mt-1.5 z-10" />
                      <div className="w-[30px] h-[20px] rounded-t-xl bg-white/90 shadow-inner mt-0.5 z-10" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 flex-1">
                    <div className="h-[7px] rounded-full clay-extruded-light w-[90%]" />
                    <div className="h-[7px] rounded-full clay-extruded-light w-[65%]" />
                    <div className="h-[7px] rounded-full clay-extruded-light w-[75%]" />
                  </div>
                </div>
              </div>
              <div className="w-full flex justify-between items-center mb-1">
                <div className="w-[55px] h-[16px] rounded-md bg-white/5 border border-white/10" />
                <div className="w-[26px] h-[26px] rounded-full bg-white/5 border border-white/10" />
              </div>
            </motion.div>

            {/* Layer 3: front acrylic pocket lip */}
            <motion.div
              className="absolute inset-x-0 bottom-[-5px] h-[145px] rounded-[24px] rounded-t-[12px] flex items-end p-5 origin-bottom"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(28px) saturate(145%)',
                border: '2.5px solid rgba(255,255,255,0.25)',
                boxShadow: `inset 1.5px 1.5px 3.5px rgba(255,255,255,0.5), 0 15px 35px rgba(0,0,0,0.45), 0 0 20px ${PALETTE.glow}`,
                transform: `translateZ(${LAYER_GAP}px)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="w-full flex items-center justify-between" style={{ transform: 'translateZ(18px)' }}>
                <div className={`w-[66px] h-[28px] rounded-lg ${PALETTE.clayClass}`} />
                <div className="w-[50px] h-[50px] rounded-full bg-slate-950/85 border-2 border-white/20 flex items-center justify-center shadow-2xl relative" style={{ transformStyle: 'preserve-3d' }}>
                  <div className="absolute inset-[3px] rounded-full bg-gradient-to-tr from-[#3b0764]/50 to-transparent" />
                  <span
                    className="text-xl font-bold text-transparent bg-clip-text animate-pulse"
                    style={{ backgroundImage: PALETTE.gradient, textShadow: `0 3px 10px ${PALETTE.glow}`, transform: 'translateZ(8px)' }}
                  >
                    ★
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
