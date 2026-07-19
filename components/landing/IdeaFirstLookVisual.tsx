'use client'

// Port of the "Neon Idea 3D" reference build — a glass-panelled neon light
// bulb (the not-yet-public idea) with a silhouette figure standing beside it
// (the reviewer, first to see it glow). Kept: the layered 3D glass frame,
// the hand-drawn bulb+filament line art, the ambient floor glow, the gentle
// hover bob, the neon pulse/flicker loops. Dropped: the document-wide
// mousemove listener from the original standalone page — that fought this
// section's own scroll-driven motion and reached outside the card's bounds.
// Replaced with a scoped pointer-parallax that only reacts while the cursor
// is over this visual, applied via direct style mutation (no React state/
// re-render per move) to keep it compositor-only, same reasoning as the
// blob perf notes elsewhere in this file.
import { useRef } from 'react'

export default function IdeaFirstLookVisual() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = sceneRef.current
    const bounds = e.currentTarget.getBoundingClientRect()
    if (!el) return
    const px = (e.clientX - bounds.left) / bounds.width - 0.5
    const py = (e.clientY - bounds.top) / bounds.height - 0.5
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const rotX = -10 + py * -10
      const rotY = 25 + px * 10
      el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
    })
  }

  const handlePointerLeave = () => {
    const el = sceneRef.current
    if (!el) return
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    el.style.transform = 'rotateX(-10deg) rotateY(25deg)'
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ perspective: 1400 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <style>{`
        @keyframes idea3dHover { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes idea3dPulseBlue {
          0%, 100% { filter: drop-shadow(0 0 10px #0077ff) drop-shadow(0 0 20px #0077ff); }
          50% { filter: drop-shadow(0 0 15px #0077ff) drop-shadow(0 0 32px #44aaff); }
        }
        @keyframes idea3dFlickerOrange {
          0%, 100% { filter: drop-shadow(0 0 8px #ff9900); opacity: 1; }
          50% { filter: drop-shadow(0 0 15px #ffcc77); opacity: 0.9; }
          55% { opacity: 0.7; filter: drop-shadow(0 0 5px #ff9900); }
          60% { opacity: 1; }
        }
        .idea3d-scene { transform-style: preserve-3d; animation: idea3dHover 6s ease-in-out infinite; transition: transform 0.15s ease-out; }
        .idea3d-bulb-line { stroke: rgba(150,210,255,0.85); stroke-width: 3; fill: none; stroke-linecap: round; animation: idea3dPulseBlue 4s ease-in-out infinite; }
        .idea3d-filament { stroke: #ffcc77; stroke-width: 3.5; fill: none; stroke-linecap: round; stroke-linejoin: round; animation: idea3dFlickerOrange 3s infinite; }
      `}</style>

      {/* Ambient floor glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: '70%', height: '40%', bottom: '6%', background: 'radial-gradient(circle, rgba(0,119,255,0.35) 0%, transparent 72%)', filter: 'blur(50px)' }}
      />

      <div
        ref={sceneRef}
        className="idea3d-scene relative"
        style={{ width: 'min(70%, 340px)', height: 'min(60%, 340px)', transform: 'rotateX(-10deg) rotateY(25deg)' }}
      >
        {/* Floor base — a translucent glass plinth grounding the bulb in 3D */}
        <div
          className="absolute rounded-[40px]"
          style={{
            width: '92%', height: '30%', left: '4%', bottom: '-6%',
            transform: 'rotateX(90deg) translateZ(-10px)',
            background: 'rgba(10,20,35,0.4)',
            border: '1px solid rgba(150,210,255,0.5)',
            boxShadow: 'inset 0 0 20px rgba(0,119,255,0.25), 0 0 30px rgba(0,0,0,0.6)',
          }}
        />

        {/* Glass panel frame housing the bulb */}
        <div
          className="absolute inset-0 rounded-[40px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(20,40,80,0.18) 0%, rgba(0,0,0,0) 100%)',
            border: '3px solid rgba(150,210,255,0.75)',
            boxShadow: '0 0 25px rgba(0,119,255,0.5), inset 0 0 25px rgba(0,119,255,0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Inner frame line — a subtle nested border */}
          <div
            className="absolute rounded-[26px] pointer-events-none"
            style={{ inset: 14, border: '2px solid rgba(100,180,255,0.35)' }}
          />
          {/* Top specular sheen */}
          <div
            className="absolute rounded-full"
            style={{ top: -2, left: '20%', width: '60%', height: 6, background: 'linear-gradient(90deg, transparent, #ffffff, transparent)', filter: 'blur(3px)', opacity: 0.75 }}
          />

          {/* Idea bulb — line-drawn glass bulb + glowing filament */}
          <svg viewBox="0 0 200 320" style={{ width: '46%', height: '78%', overflow: 'visible' }}>
            <path
              className="idea3d-bulb-line"
              d="M 100 15 C 50 15 20 50 20 100 C 20 145 45 175 65 205 C 75 220 75 235 75 250 L 125 250
                 C 125 235 125 220 135 205 C 155 175 180 145 180 100 C 180 50 150 15 100 15 Z"
            />
            <path className="idea3d-bulb-line" d="M 75 250 L 125 250" />
            <path className="idea3d-bulb-line" d="M 73 262 C 90 268 110 268 127 262" />
            <path className="idea3d-bulb-line" d="M 74 276 C 90 282 110 282 126 276" />
            <path className="idea3d-bulb-line" d="M 77 290 C 95 296 105 296 123 290" />
            <path className="idea3d-bulb-line" d="M 85 290 L 85 300 C 90 308 110 308 115 300 L 115 290" />
            <path className="idea3d-bulb-line" strokeWidth={2} style={{ opacity: 0.4 }} d="M 92 250 L 92 180 C 92 170 108 170 108 180 L 108 250" />
            <path className="idea3d-bulb-line" strokeWidth={1.5} style={{ opacity: 0.7 }} d="M 96 175 L 65 105" />
            <path className="idea3d-bulb-line" strokeWidth={1.5} style={{ opacity: 0.7 }} d="M 104 175 L 135 105" />
            <path className="idea3d-filament" style={{ strokeWidth: 6, filter: 'blur(4px)', opacity: 0.5 }} d="M 65 105 C 80 115 100 125 135 105" />
            <path className="idea3d-filament" d="M 65 105 C 80 115 100 125 135 105" />
          </svg>
        </div>

        {/* The reviewer — a small silhouette watching, pulled forward in Z
            so it reads as standing in front of the glass, catching the
            glow first. */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: '-14%', bottom: '4%', transform: 'translateZ(70px)' }}
        >
          <div
            className="rounded-full mb-1"
            style={{
              width: 40, height: 40,
              border: '3px solid rgba(150,210,255,0.85)',
              background: 'rgba(10,20,30,0.25)',
              boxShadow: '0 0 16px rgba(0,119,255,0.5), inset 0 0 12px rgba(0,119,255,0.4)',
            }}
          />
          <div
            style={{
              width: 62, height: 46,
              borderRadius: '26px 26px 10px 10px',
              border: '3px solid rgba(150,210,255,0.85)',
              background: 'rgba(10,20,30,0.25)',
              boxShadow: '0 0 16px rgba(0,119,255,0.5), inset 0 0 12px rgba(0,119,255,0.4)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
