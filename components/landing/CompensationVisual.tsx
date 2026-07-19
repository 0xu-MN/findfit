'use client'

// Ported (visual scene only — the reference sandbox's HUD control panel
// [tilt/float/wisp sliders], mouse-tilt 3D interactivity, background canvas
// "light wisp" trails, and click-to-sparkle-burst are dev-tool chrome, not
// part of the motion graphic itself, and the wisp/sparkle canvases in
// particular are exactly the kind of continuous per-frame repaint this
// section's earlier perf pass eliminated) from a "Gold Glassmorphism Pro"
// HTML/CSS/canvas sandbox: a gold-glass rounded badge with a line-art
// clipboard+checkmark (line-draw entrance) and a stacked gold coin cylinder,
// floating gently with a diagonal sheen sweep and a slow glow pulse.
// Rebuilt with framer-motion + plain SVG/CSS gradients — no backdrop-filter
// (the badge's "glass" edge is faked with layered box-shadows + a gradient
// border instead, same self-blur-only rule as the rest of this section).
import { motion } from 'framer-motion'

const GOLD_EDGE = 'linear-gradient(135deg, #FFF3C4 0%, #F5B93F 35%, #A9720E 70%, #FFE79A 100%)'
const GOLD_GLOW = 'rgba(245, 185, 63, 0.35)'

function CoinLayer({ n, total }: { n: number; total: number }) {
  // n=0 is the top (front-most, brightest) coin of the stack.
  const y = -n * 12
  const isTop = n === 0
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 rounded-full"
      style={{
        bottom: 0,
        width: 108,
        height: 22,
        transform: `translate(-50%, ${y}px)`,
        zIndex: total - n,
        background: isTop
          ? 'linear-gradient(180deg, #FFE9A8 0%, #F3B93E 45%, #B87F14 100%)'
          : 'linear-gradient(180deg, #E9B94F 0%, #C4901E 55%, #8A5F0D 100%)',
        border: '1px solid rgba(255,235,180,0.5)',
        boxShadow: isTop
          ? '0 3px 8px rgba(0,0,0,0.45), inset 0 2px 2px rgba(255,255,255,0.55)'
          : '0 2px 4px rgba(0,0,0,0.4)',
      }}
    />
  )
}

export default function CompensationVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Ambient glow, static position, self-blur only */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: '70%', height: '70%', background: `radial-gradient(circle, ${GOLD_GLOW} 0%, transparent 72%)`, filter: 'blur(40px)' }}
      />

      {/* The badge — floats gently, never stops while its card is on stage */}
      <motion.div
        className="relative overflow-hidden"
        style={{
          width: 'min(78%, 320px)',
          aspectRatio: '1 / 1',
          borderRadius: 56,
          background: 'linear-gradient(160deg, rgba(40,28,10,0.55), rgba(10,7,2,0.7))',
          border: '1.5px solid rgba(255,215,120,0.28)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.6), inset 0 0 40px rgba(255,190,50,0.08), inset 0 2px 4px rgba(255,255,255,0.25)',
        }}
        initial={{ opacity: 0, scale: 0.85, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.6 },
          scale: { duration: 0.6, ease: 'easeOut' },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
        }}
      >
        {/* Diagonal sheen sweep */}
        <motion.div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            width: '60%',
            background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.28) 45%, transparent 90%)',
          }}
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut', delay: 1 }}
        />

        {/* Clipboard + checkmark line art */}
        <svg viewBox="0 0 200 200" className="absolute" style={{ left: '10%', top: '14%', width: '58%', height: '58%' }}>
          <defs>
            <linearGradient id="compGoldEdge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#F5B93F" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8A5F0D" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          {[
            { d: 'M40 45h105a18 18 0 0 1 18 18v87a18 18 0 0 1-18 18H40a18 18 0 0 1-18-18V63a18 18 0 0 1 18-18Z', w: 7 },
          ].map((p, i) => (
            <motion.path
              key={i}
              d={p.d}
              fill="none"
              stroke="url(#compGoldEdge)"
              strokeWidth={p.w}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          ))}
          <motion.path
            d="M78 45c0-15 34-15 34 0Z"
            fill="none" stroke="url(#compGoldEdge)" strokeWidth={7} strokeLinejoin="round"
            pathLength={1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          <motion.path
            d="M68 95l20 20 40-42"
            fill="none" stroke="#FFF7DE" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
            pathLength={1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,220,140,0.7))' }}
          />
          {[132, 146].map((y, i) => (
            <motion.rect
              key={y}
              x={55} y={y} width={48} height={6} rx={3}
              fill="none" stroke="url(#compGoldEdge)" strokeWidth={4.5}
              pathLength={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
            />
          ))}
        </svg>

        {/* Coin stack, bottom-right, overlapping the clipboard like the reference */}
        <motion.div
          className="absolute"
          style={{ right: '10%', bottom: '12%', width: 108, height: 90 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: 1 },
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 },
          }}
        >
          {[5, 4, 3, 2, 1, 0].map((n) => (
            <CoinLayer key={n} n={n} total={6} />
          ))}
          <div
            className="absolute inset-x-0 flex items-center justify-center font-black select-none"
            style={{ bottom: 46, fontSize: 30, color: '#3A2508', textShadow: '0 1px 0 rgba(255,240,200,0.5)' }}
          >
            $
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
