'use client'

// Ported (visual scene only — the sandbox's header/footer/HUD control
// panel, theme switcher, claim-reward button, particle burst, and Web
// Audio chime are dev-tool chrome and interactive extras, not part of the
// motion graphic itself) from a standalone "Glass Wallet Sculpture" GSAP
// sandbox build. The sandbox constructed the wallet body itself from
// stacked CSS-3D-transformed glass panels (back/spine/front layers via
// preserve-3d + translate3d + rotateY) — per feedback that never produced
// the intended photoreal look, and an auto-traced SVG of the reference
// render turned out to be a flat, unstructured image trace with no
// separable front/back/spine layers either. The wallet body here is
// instead the provided static render (public/compensation-wallet.png);
// only the parts that were already separate objects in the original
// scene — coins, sparkles, ambient glow, floor shadow — are rebuilt in
// code and floated/parallaxed as flat layers around the fixed wallet
// image, the same flat-layers-faking-depth trick as TrendDashboardVisual's
// mouse-parallax feature cards. Reimplemented with framer-motion instead
// of GSAP.
import { useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'

const STAGE = 460
const WALLET_W = 400
const WALLET_H = 401 // native asset is 1176×1179, near-square

const GOLD = {
  glow: 'rgba(229, 169, 61, 0.4)',
  coinGrad: 'linear-gradient(135deg, #FFE6A8 0%, #D4AF37 45%, #AA7C11 85%, #E5A93D 100%)',
}

const SIDE_COINS = [
  { key: 'left', size: 62, style: { left: '-9%', top: '58%' }, parallax: 0.6, floatDelay: 2.3, entranceDelay: 1.5 },
  { key: 'topRight', size: 54, style: { right: '-4%', top: '-4%' }, parallax: 0.9, floatDelay: 2.6, entranceDelay: 1.7 },
  { key: 'bottomRight', size: 70, style: { right: '-14%', bottom: '6%' }, parallax: 1.2, floatDelay: 2.9, entranceDelay: 1.9 },
]

function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style}>
      <path fill="currentColor" d="M20,0 C20,9.5 29.5,20 40,20 C29.5,20 20,30.5 20,40 C20,30.5 9.5,20 0,20 C9.5,20 20,9.5 20,0 Z" />
    </svg>
  )
}

export default function CompensationVisual() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 })
  }
  const handleMouseLeave = () => setMouse({ x: 0, y: 0 })

  // Raw CSS transform (not a framer motion prop) on its own wrapper level,
  // kept separate from the motion.div doing the entrance/float animation
  // one level up — mixing manual transforms into a framer-animated
  // element's own style is what caused the transform-origin drift bug on
  // the donut chart earlier in this section.
  const walletTiltStyle: CSSProperties = {
    transform: `rotateX(${mouse.y * -10}deg) rotateY(${mouse.x * 10}deg)`,
    transition: 'transform 0.4s ease-out',
    transformStyle: 'preserve-3d',
  }

  return (
    <div className="compensation-wallet-scene relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Ambient glow, scoped down from the sandbox's full-page background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-70">
        <div
          className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[520px] h-[420px] rounded-full blur-[110px]"
          style={{ background: `radial-gradient(circle, ${GOLD.glow} 0%, rgba(0,0,0,0) 75%)` }}
        />
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative"
        style={{ width: STAGE, height: STAGE, perspective: 1200 }}
      >
        {/* Floor shadow, breathing in sync with the wallet's float */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-[6%] w-[62%] h-[22px] rounded-full bg-black/70 blur-md"
          style={{ boxShadow: `0 15px 40px ${GOLD.glow}` }}
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: [0.5, 0.3, 0.5], scaleX: [0.85, 1, 0.85] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.3 },
            scaleX: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 },
          }}
        />

        {/* Wallet body: static render, entrance fade/scale-in, then a slow
            continuous float */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: WALLET_W, height: WALLET_H }}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 1 },
            scale: { duration: 1, ease: 'easeOut' },
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
        >
          <div style={walletTiltStyle} className="w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/compensation-wallet.png"
              alt=""
              draggable={false}
              className="w-full h-full object-contain select-none"
              style={{ filter: `drop-shadow(0 25px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 30px ${GOLD.glow})` }}
            />
          </div>
        </motion.div>

        {/* Main reward coin, resting on the wallet's top face */}
        <div
          className="absolute"
          style={{
            left: '30%',
            top: '4%',
            width: 132,
            height: 132,
            zIndex: 20,
            transform: `translate3d(${mouse.x * 14}px, ${mouse.y * 14}px, 0)`,
            transition: 'transform 0.4s ease-out',
          }}
        >
          <motion.div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: GOLD.coinGrad, boxShadow: `0 0 40px ${GOLD.glow}, inset 0 2px 2px rgba(255,255,255,0.7), 0 12px 28px rgba(0,0,0,0.6)` }}
            initial={{ opacity: 0, scale: 0.7, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: [-10, -22, -10] }}
            transition={{
              opacity: { duration: 0.9, delay: 0.9 },
              scale: { duration: 0.9, delay: 0.9, ease: 'backOut' },
              y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 1.8 },
            }}
          >
            <div className="w-[86%] h-[86%] rounded-full border-[5px] border-amber-300/40 bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-inner relative">
              <span className="text-4xl font-black text-amber-950 drop-shadow-[0_2px_1.5px_rgba(255,255,255,0.45)] select-none">₩</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-full" />
            </div>
          </motion.div>
        </div>

        {/* Satellite coins, each at a different parallax multiplier so
            they read as floating at different depths around the wallet */}
        {SIDE_COINS.map((c) => (
          <div
            key={c.key}
            className="absolute rounded-full"
            style={{
              ...c.style,
              width: c.size,
              height: c.size,
              zIndex: 18,
              transform: `translate3d(${mouse.x * 14 * c.parallax}px, ${mouse.y * 14 * c.parallax}px, 0)`,
              transition: 'transform 0.4s ease-out',
            }}
          >
            <motion.div
              className="w-full h-full rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg"
              style={{ background: GOLD.coinGrad }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: c.entranceDelay },
                scale: { duration: 0.8, delay: c.entranceDelay, ease: 'backOut' },
                y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: c.floatDelay },
              }}
            >
              <div className="w-[82%] h-[82%] rounded-full border-2 border-amber-300/35 flex items-center justify-center">
                <span className="font-black text-amber-950" style={{ fontSize: c.size * 0.32 }}>₩</span>
              </div>
            </motion.div>
          </div>
        ))}

        {/* Sparkles */}
        <motion.div
          className="absolute pointer-events-none"
          style={{ left: '10%', top: '-6%', width: 40, height: 40, zIndex: 25 }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0.75, 1], scale: [0.6, 1.2, 1, 1.2] }}
          transition={{ duration: 2.2, delay: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
        >
          <Sparkle className="w-full h-full text-amber-200" style={{ filter: 'drop-shadow(0 0 12px rgba(255,230,168,0.9))' }} />
        </motion.div>
        <motion.div
          className="absolute pointer-events-none"
          style={{ right: '-8%', top: '26%', width: 28, height: 28, zIndex: 25 }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0.7, 1], scale: [0.6, 1.15, 1, 1.15] }}
          transition={{ duration: 2, delay: 2.6, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
        >
          <Sparkle className="w-full h-full text-amber-100" style={{ filter: 'drop-shadow(0 0 8px rgba(255,230,168,0.85))' }} />
        </motion.div>
      </div>
    </div>
  )
}
