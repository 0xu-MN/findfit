'use client'

// Faithful port of the "Gold Glassmorphism Pro" reference build — the glass
// badge, line-drawn clipboard+checkmark icon, and 6-layer gold coin cylinder
// with its 3D front coin, reproduced with the same markup/gradients/keyframe
// shapes as the original. Left out: the mouse-tilt 3D interactivity, the
// HUD control panel (tilt/float/wisp sliders), the background canvas "light
// wisp" trails, and the click-to-sparkle-burst canvas — those are dev-tool
// chrome and continuous per-frame canvas repaint, exactly the kind of cost
// this section's earlier perf pass eliminated (see ReviewerLanding notes).
// The float / line-draw / glow-pulse / sheen-sweep motion is kept, just as
// plain CSS keyframes (this component only ever has one instance on screen,
// so it doesn't carry the same multi-instance backdrop-filter cost the
// benefit blobs did).

// pathLength="1" (SVG2) normalizes every shape's length to 1 regardless of
// its actual geometry, so dasharray/dashoffset always land exactly on 0 —
// without it, a fixed dasharray (400) shorter than a shape's real perimeter
// (a rounded rect this size is ~429 units) leaves a permanent gap where the
// dash pattern runs out, which is what caused the visible break in the
// clipboard outline.
const draw = (delay: number) => ({
  strokeDasharray: 1,
  strokeDashoffset: 1,
  animation: `compDraw 1.4s cubic-bezier(0.25,1,0.5,1) ${delay}s forwards`,
})

export default function CompensationVisual() {
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
        .comp-float { animation: compFloat 7s ease-in-out infinite; }
        .comp-neon { animation: compGlow 4.5s ease-in-out infinite; }
        .comp-sheen::after {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.05) 75%, transparent 100%);
          transform: translateX(-150%) skewX(-25deg);
          animation: compSheen 6s infinite cubic-bezier(0.4,0,0.2,1);
          pointer-events: none;
        }
      `}</style>

      {/* Ambient glow behind the badge */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: '75%', height: '75%', background: 'radial-gradient(circle, rgba(229,169,61,0.35) 0%, transparent 72%)', filter: 'blur(45px)' }}
      />

      {/* Glass badge */}
      <div
        className="comp-float relative overflow-hidden"
        style={{
          width: 'min(80%, 340px)',
          aspectRatio: '1 / 1',
          borderRadius: 64,
          background: 'rgba(18,14,8,0.35)',
          border: '1.5px solid rgba(255,215,0,0.22)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.85), inset 0 0 45px rgba(255,190,50,0.08), inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -2px 8px rgba(0,0,0,0.7)',
        }}
      >
        <div className="relative w-full h-full">
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

          {/* Gold coin stack — smooth cylinder body with a bright flat top
              disc, not individually-ridged coins */}
          <div className="absolute" style={{ right: '4%', bottom: '10%', width: '52%', height: '52%' }}>
            <div className="absolute" style={{ width: 100, height: 132, right: 2, bottom: 10 }}>
              {/* Cylinder body */}
              <div
                className="absolute left-0 right-0 rounded-b-2xl"
                style={{
                  top: 24,
                  bottom: 0,
                  background: 'linear-gradient(90deg, #6E3E0C 0%, #C9821F 20%, #FFE79A 50%, #C9821F 80%, #6E3E0C 100%)',
                  boxShadow: 'inset 0 -10px 16px rgba(0,0,0,0.25)',
                }}
              />
              {/* A couple of subtle rim lines near the top, hinting a few stacked coins */}
              <div className="absolute left-0 right-0" style={{ top: 40, height: 2, background: 'rgba(110,62,12,0.4)' }} />
              <div className="absolute left-0 right-0" style={{ top: 54, height: 2, background: 'rgba(110,62,12,0.3)' }} />
              {/* Bright flat top disc */}
              <div
                className="absolute left-0 right-0 rounded-full"
                style={{
                  top: 0,
                  height: 48,
                  background: 'radial-gradient(ellipse at 35% 32%, #FFFAE6 0%, #FFDE7A 45%, #D99A2B 88%)',
                  boxShadow: 'inset 0 -5px 8px rgba(110,62,12,0.35), 0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>

            {/* Front 3D coin with ₩ */}
            <div
              className="comp-sheen absolute rounded-full"
              style={{
                width: '108px', height: '108px', left: 0, bottom: 8,
                transform: 'rotateY(-18deg) rotateX(6deg)',
                filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.7))',
              }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
