'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const COLOR = {
  orange: 0xF77019,
  lightOrange: 0xFFB060,
  cream: 0xFFEBD6,
  softCream: 0xFFF6EA,
  white: 0xFFFFFF,
  dark: 0x363438,
  belt: 0xC8C5C0,
  rail: 0xE5E2DC,
  ground: 0xF2EEE7,
}

/* ── Timing ────────────────────────────────────────────── */
const CYCLE = 8                       // total loop seconds
const BELT_TRAVERSAL = 3              // seconds per piece on belt
const SPAWN_TIMES = [0, 1, 2, 3]      // when each of 4 belt pieces appears
const APPEAR_DELAY = 0.35             // factory processing delay
const SNAP_DURATION = 0.55            // "!" piece flight + snap
const HOLD_END = 7.5                  // when assembled "!" starts fading
const FADE_END = 8.0                  // end of fade
const BELT_PIECE_COUNT = 4

/* ── Belt geometry ─────────────────────────────────────── */
const BELT_LENGTH = 3.6
const BELT_WIDTH = 0.78
const BELT_TILT = Math.PI / 9        // 20° gentle downward slope

/* ── Easings ───────────────────────────────────────────── */
const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth
    const H = mount.clientHeight

    /* ── Scene / Camera / Renderer ───────────────────── */
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)
    camera.position.set(5.5, 4.0, 7.5)
    camera.lookAt(0, 0.3, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    /* ── Lights ─────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 1.15))

    const key = new THREE.DirectionalLight(0xfff5e6, 2.2)
    key.position.set(5, 9, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -6
    key.shadow.camera.right = 6
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -5
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 25
    key.shadow.bias = -0.0003
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xffeed8, 0.55)
    fill.position.set(-4, 3, 5)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0xff9450, 0.7)
    rim.position.set(-3, 2, -4)
    scene.add(rim)

    /* ── Materials ──────────────────────────────────── */
    const matPhysical = (hex: number, opts: THREE.MeshPhysicalMaterialParameters = {}) =>
      new THREE.MeshPhysicalMaterial({
        color: hex,
        roughness: 0.4,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
        ...opts,
      })

    const matOrange = matPhysical(COLOR.orange)
    const matLightOrange = matPhysical(COLOR.lightOrange)
    const matCream = matPhysical(COLOR.cream)
    const matWhite = matPhysical(COLOR.white, { clearcoat: 0.55 })
    const matDark = matPhysical(COLOR.dark, { roughness: 0.6, metalness: 0.15, clearcoat: 0.1 })
    const matBelt = matPhysical(COLOR.belt, { roughness: 0.7, metalness: 0.1, clearcoat: 0.0 })
    const matRail = matPhysical(COLOR.rail, { roughness: 0.55 })
    const matSoftCream = matPhysical(COLOR.softCream, { roughness: 0.55, clearcoat: 0.1 })

    const allMats = [matOrange, matLightOrange, matCream, matWhite, matDark, matBelt, matRail, matSoftCream]

    /* ── Ground ─────────────────────────────────────── */
    const groundGeo = new THREE.PlaneGeometry(60, 60)
    const groundMat = matPhysical(COLOR.ground, { roughness: 0.85, clearcoat: 0 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.0
    ground.receiveShadow = true
    scene.add(ground)
    allMats.push(groundMat)

    /* ── Factory (center, cute storefront style) ───── */
    const factoryGroup = new THREE.Group()
    factoryGroup.position.set(0, 0.3, 0)
    scene.add(factoryGroup)

    const factoryBaseGeo = new RoundedBoxGeometry(2.05, 0.16, 1.7, 4, 0.06)
    const factoryBase = new THREE.Mesh(factoryBaseGeo, matDark)
    factoryBase.position.y = -0.85
    factoryBase.castShadow = true
    factoryBase.receiveShadow = true
    factoryGroup.add(factoryBase)

    const factoryBodyGeo = new RoundedBoxGeometry(1.85, 1.55, 1.55, 5, 0.18)
    const factoryBody = new THREE.Mesh(factoryBodyGeo, matWhite)
    factoryBody.position.y = 0
    factoryBody.castShadow = true
    factoryBody.receiveShadow = true
    factoryGroup.add(factoryBody)

    const factoryRoofGeo = new RoundedBoxGeometry(1.95, 0.22, 1.65, 4, 0.08)
    const factoryRoof = new THREE.Mesh(factoryRoofGeo, matOrange)
    factoryRoof.position.y = 0.86
    factoryRoof.castShadow = true
    factoryGroup.add(factoryRoof)

    // Chimneys
    const chimGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 18)
    const chim1 = new THREE.Mesh(chimGeo, matDark)
    chim1.position.set(-0.45, 1.22, 0.35)
    chim1.castShadow = true
    factoryGroup.add(chim1)
    const chim2 = new THREE.Mesh(chimGeo, matDark)
    chim2.position.set(0.45, 1.22, 0.35)
    chim2.castShadow = true
    factoryGroup.add(chim2)

    const capGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.06, 18)
    const cap1 = new THREE.Mesh(capGeo, matOrange)
    cap1.position.set(-0.45, 1.50, 0.35)
    factoryGroup.add(cap1)
    const cap2 = new THREE.Mesh(capGeo, matOrange)
    cap2.position.set(0.45, 1.50, 0.35)
    factoryGroup.add(cap2)

    // FindFit sign (front of factory)
    const labelCanvas = document.createElement('canvas')
    labelCanvas.width = 1024
    labelCanvas.height = 256
    const ctx = labelCanvas.getContext('2d')!
    const drawLabel = () => {
      ctx.clearRect(0, 0, 1024, 256)
      const r = 40
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(1024 - r, 0)
      ctx.quadraticCurveTo(1024, 0, 1024, r)
      ctx.lineTo(1024, 256 - r)
      ctx.quadraticCurveTo(1024, 256, 1024 - r, 256)
      ctx.lineTo(r, 256)
      ctx.quadraticCurveTo(0, 256, 0, 256 - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#F77019'
      ctx.lineWidth = 10
      ctx.stroke()
      ctx.fillStyle = '#F77019'
      ctx.font = '900 138px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('FindFit', 512, 132)
    }
    drawLabel()
    const labelTex = new THREE.CanvasTexture(labelCanvas)
    labelTex.anisotropy = 8
    if ('fonts' in document) {
      document.fonts.ready.then(() => { drawLabel(); labelTex.needsUpdate = true })
    }
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
    const labelGeo = new THREE.PlaneGeometry(1.4, 0.36)
    const label = new THREE.Mesh(labelGeo, labelMat)
    label.position.set(0, 0.32, 0.79)
    factoryGroup.add(label)

    // Cute window below sign
    const windowGeo = new RoundedBoxGeometry(0.55, 0.5, 0.05, 4, 0.08)
    const windowMat = matPhysical(COLOR.cream, { roughness: 0.5, clearcoat: 0.5 })
    const windowMesh = new THREE.Mesh(windowGeo, windowMat)
    windowMesh.position.set(0, -0.3, 0.78)
    factoryGroup.add(windowMesh)
    allMats.push(windowMat)

    // Input port (left side, where belt meets factory)
    const portGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.20, 24)
    const inPort = new THREE.Mesh(portGeo, matDark)
    inPort.rotation.z = Math.PI / 2
    inPort.position.set(-0.93, -0.05, 0)
    factoryGroup.add(inPort)

    const inGlowMat = new THREE.MeshBasicMaterial({ color: COLOR.orange, transparent: true, opacity: 0.85 })
    const inGlowGeo = new THREE.CircleGeometry(0.16, 24)
    const inGlow = new THREE.Mesh(inGlowGeo, inGlowMat)
    inGlow.rotation.y = -Math.PI / 2
    inGlow.position.set(-1.04, -0.05, 0)
    factoryGroup.add(inGlow)

    // Output door (right side, larger - "!" exits here)
    const doorFrameGeo = new RoundedBoxGeometry(0.18, 1.0, 0.7, 3, 0.06)
    const doorFrame = new THREE.Mesh(doorFrameGeo, matOrange)
    doorFrame.position.set(0.96, -0.15, 0)
    doorFrame.castShadow = true
    factoryGroup.add(doorFrame)

    const doorOpeningMat = new THREE.MeshBasicMaterial({ color: 0x2A1E15, transparent: true, opacity: 0.95 })
    const doorOpeningGeo = new RoundedBoxGeometry(0.05, 0.85, 0.55, 3, 0.05)
    const doorOpening = new THREE.Mesh(doorOpeningGeo, doorOpeningMat)
    doorOpening.position.set(0.98, -0.15, 0)
    factoryGroup.add(doorOpening)

    const outGlowMat = new THREE.MeshBasicMaterial({ color: COLOR.orange, transparent: true, opacity: 0.6 })
    const outGlowGeo = new THREE.PlaneGeometry(0.5, 0.8)
    const outGlow = new THREE.Mesh(outGlowGeo, outGlowMat)
    outGlow.rotation.y = Math.PI / 2
    outGlow.position.set(1.02, -0.15, 0)
    factoryGroup.add(outGlow)

    // Inside warm light
    const insideLight = new THREE.PointLight(COLOR.orange, 1.4, 4)
    insideLight.position.set(0, 0.15, 0)
    factoryGroup.add(insideLight)

    /* ── Conveyor belt (diagonal, going down to factory) ── */
    const conveyorGroup = new THREE.Group()
    scene.add(conveyorGroup)

    const beltGeo = new RoundedBoxGeometry(BELT_LENGTH, 0.12, BELT_WIDTH, 4, 0.05)
    const belt = new THREE.Mesh(beltGeo, matBelt)
    belt.castShadow = true
    belt.receiveShadow = true
    conveyorGroup.add(belt)

    // Side rails (slim borders)
    const railGeo = new RoundedBoxGeometry(BELT_LENGTH, 0.16, 0.06, 3, 0.025)
    const railA = new THREE.Mesh(railGeo, matRail)
    railA.position.set(0, 0.08, -BELT_WIDTH / 2 + 0.02)
    railA.castShadow = true
    conveyorGroup.add(railA)
    const railB = new THREE.Mesh(railGeo, matRail)
    railB.position.set(0, 0.08, BELT_WIDTH / 2 - 0.02)
    railB.castShadow = true
    conveyorGroup.add(railB)

    // End rollers
    const rollerGeo = new THREE.CylinderGeometry(0.13, 0.13, BELT_WIDTH + 0.08, 18)
    const rollerStart = new THREE.Mesh(rollerGeo, matDark)
    rollerStart.rotation.x = Math.PI / 2
    rollerStart.position.set(-BELT_LENGTH / 2, 0, 0)
    rollerStart.castShadow = true
    conveyorGroup.add(rollerStart)
    const rollerEnd = new THREE.Mesh(rollerGeo, matDark)
    rollerEnd.rotation.x = Math.PI / 2
    rollerEnd.position.set(BELT_LENGTH / 2, 0, 0)
    rollerEnd.castShadow = true
    conveyorGroup.add(rollerEnd)

    // Tilt + position the conveyor: belt's right end meets factory left port
    // Factory port is at world (-0.93, -0.05 + 0.3, 0) = (-0.93, 0.25, 0)  [factory at y=0.3]
    // Belt's right end after rotation about z by -BELT_TILT: (BELT_LENGTH/2 * cos, -BELT_LENGTH/2 * sin, 0)
    // We want this to land near the port.
    const halfLen = BELT_LENGTH / 2
    const rotEndX = halfLen * Math.cos(-BELT_TILT)
    const rotEndY = halfLen * Math.sin(-BELT_TILT)
    const portWorldX = -0.93
    const portWorldY = 0.25
    conveyorGroup.rotation.z = -BELT_TILT
    conveyorGroup.position.set(
      portWorldX - rotEndX,
      portWorldY - rotEndY,
      0,
    )

    // Support leg (single column under center of belt)
    const beltCenterWorldX = conveyorGroup.position.x
    const beltCenterWorldY = conveyorGroup.position.y
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, beltCenterWorldY - (-1.0), 12)
    const leg = new THREE.Mesh(legGeo, matDark)
    leg.position.set(beltCenterWorldX, (-1.0 + beltCenterWorldY) / 2, 0)
    leg.castShadow = true
    scene.add(leg)

    // Foot pad at bottom of leg
    const padGeo = new RoundedBoxGeometry(0.4, 0.08, 0.4, 3, 0.03)
    const pad = new THREE.Mesh(padGeo, matDark)
    pad.position.set(beltCenterWorldX, -0.96, 0)
    pad.castShadow = true
    pad.receiveShadow = true
    scene.add(pad)

    /* ── Belt pieces (4 puzzle pieces flowing down) ── */
    const beltPieceGeo = new RoundedBoxGeometry(0.42, 0.42, 0.42, 4, 0.1)
    const pieceMats = [matOrange, matLightOrange, matCream, matOrange]
    type BeltPiece = { mesh: THREE.Mesh }
    const beltPieces: BeltPiece[] = []
    for (let i = 0; i < BELT_PIECE_COUNT; i++) {
      const mesh = new THREE.Mesh(beltPieceGeo, pieceMats[i % pieceMats.length])
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.visible = false
      conveyorGroup.add(mesh)   // child of belt → inherits tilt
      beltPieces.push({ mesh })
    }

    /* ── Output platform (small disc where "!" lands) ── */
    const platformPos = new THREE.Vector3(2.4, -0.5, 0.2)
    const platformGeo = new THREE.CylinderGeometry(0.75, 0.85, 0.15, 32)
    const platform = new THREE.Mesh(platformGeo, matSoftCream)
    platform.position.copy(platformPos)
    platform.castShadow = true
    platform.receiveShadow = true
    scene.add(platform)

    // Tiny ring on top of platform (decorative)
    const ringGeo = new THREE.TorusGeometry(0.6, 0.025, 8, 48)
    const ring = new THREE.Mesh(ringGeo, matOrange)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(platformPos.x, platformPos.y + 0.08, platformPos.z)
    scene.add(ring)

    /* ── Assembled "!" group (sits above platform) ── */
    const exclGroup = new THREE.Group()
    exclGroup.position.set(platformPos.x, platformPos.y + 0.5, platformPos.z)
    scene.add(exclGroup)

    // "!" layout: 3 bar pieces stacked + 1 dot below (with gap)
    const exclLayout = [
      { x: 0, y: 0.85, color: matOrange, size: 0.5 },        // top of bar
      { x: 0, y: 0.30, color: matOrange, size: 0.5 },        // middle of bar
      { x: 0, y: -0.25, color: matLightOrange, size: 0.5 },  // bottom of bar
      { x: 0, y: -0.95, color: matOrange, size: 0.36 },      // dot (smaller, gap)
    ]

    type ExclPiece = {
      mesh: THREE.Mesh
      baseX: number
      baseY: number
      // entry start position (relative to exclGroup, near factory door)
      startX: number
      startY: number
    }

    // Factory door (world): (0.96, -0.15 + 0.3, 0) = (0.96, 0.15, 0)
    // exclGroup center (world): (2.4, 0.0, 0.2)
    // door relative to exclGroup: (0.96 - 2.4, 0.15 - 0.0, 0 - 0.2) = (-1.44, 0.15, -0.2)
    const exclPieces: ExclPiece[] = []
    const exclGeometries: RoundedBoxGeometry[] = []

    exclLayout.forEach((p) => {
      const geo = new RoundedBoxGeometry(p.size, p.size, p.size, 4, 0.1)
      exclGeometries.push(geo)
      const mesh = new THREE.Mesh(geo, p.color)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(p.x, p.y, 0)
      mesh.visible = false
      exclGroup.add(mesh)
      exclPieces.push({
        mesh,
        baseX: p.x,
        baseY: p.y,
        startX: -1.44,
        startY: 0.15,
      })
    })

    // Soft halo behind "!"
    const haloMat = new THREE.MeshBasicMaterial({ color: COLOR.orange, transparent: true, opacity: 0.08 })
    const haloGeo = new THREE.CircleGeometry(1.0, 48)
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.set(0, 0.0, -0.5)
    exclGroup.add(halo)

    /* ── Mouse parallax ─────────────────────────────── */
    let mx = 0, my = 0
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6
      my = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3
    }
    window.addEventListener('mousemove', onMouseMove)

    /* ── Resize ─────────────────────────────────────── */
    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    /* ── Animation ──────────────────────────────────── */
    let rafId: number
    const startTime = performance.now()

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const t = (performance.now() - startTime) / 1000
      const cycleT = t % CYCLE

      /* — Belt pieces — */
      let piecesInFactory = 0
      beltPieces.forEach((piece, i) => {
        const spawn = SPAWN_TIMES[i]
        const progress = (cycleT - spawn) / BELT_TRAVERSAL

        if (progress >= 0 && progress <= 1.0) {
          piece.mesh.visible = true
          const localX = -BELT_LENGTH / 2 + progress * BELT_LENGTH
          piece.mesh.position.set(localX, 0.35, 0)
          // Rotate as it travels (rolling forward)
          piece.mesh.rotation.x = (cycleT - spawn) * 1.4
          piece.mesh.rotation.z = (cycleT - spawn) * 0.5 + i
          // Fade at very start and very end
          let s = 1
          if (progress < 0.05) s = progress / 0.05
          if (progress > 0.95) s = (1 - progress) / 0.05
          piece.mesh.scale.setScalar(Math.max(0, s))
        } else {
          piece.mesh.visible = false
        }

        // Count as "entering factory" near the end
        if (progress > 0.9 && progress < 1.0) piecesInFactory += 1
      })

      /* — Factory: subtle motion + glow modulation — */
      factoryGroup.position.y = 0.3 + Math.sin(t * 0.55) * 0.03
      factoryGroup.rotation.y = Math.sin(t * 0.35) * 0.04
      cap1.scale.setScalar(1 + Math.sin(t * 2.0) * 0.10)
      cap2.scale.setScalar(1 + Math.sin(t * 2.0 + Math.PI / 2) * 0.10)

      insideLight.intensity = 1.3 + piecesInFactory * 0.9 + Math.sin(t * 3) * 0.15
      inGlowMat.opacity = 0.65 + Math.sin(t * 3) * 0.15 + piecesInFactory * 0.2
      outGlowMat.opacity = 0.45 + Math.sin(t * 3 + Math.PI / 2) * 0.15

      /* — "!" pieces: appear one by one from factory door — */
      exclPieces.forEach((p, i) => {
        const appear = SPAWN_TIMES[i] + BELT_TRAVERSAL + APPEAR_DELAY  // 3.35, 4.35, 5.35, 6.35

        if (cycleT < appear) {
          p.mesh.visible = false
        } else if (cycleT < appear + SNAP_DURATION) {
          // Flying out of factory door, arcing to target position
          p.mesh.visible = true
          const aT = (cycleT - appear) / SNAP_DURATION
          const ease = easeOutBack(aT)
          const easeArc = easeOutCubic(aT)

          // Arc trajectory (bezier-ish via Y offset)
          const arcY = Math.sin(aT * Math.PI) * 0.45

          p.mesh.position.x = lerp(p.startX, p.baseX, easeArc)
          p.mesh.position.y = lerp(p.startY, p.baseY, ease) + arcY
          p.mesh.position.z = lerp(-0.2, 0, easeArc)

          p.mesh.rotation.x = (1 - aT) * 1.5
          p.mesh.rotation.y = (1 - aT) * 2.0
          p.mesh.rotation.z = 0

          p.mesh.scale.setScalar(0.3 + ease * 0.7)
        } else if (cycleT < HOLD_END) {
          // Held in place — gentle breathing
          p.mesh.visible = true
          const breathe = Math.sin((cycleT - appear - SNAP_DURATION) * 2.2 + i * 0.5) * 0.025
          p.mesh.position.set(p.baseX, p.baseY + breathe, 0)
          p.mesh.rotation.set(0, 0, 0)
          p.mesh.scale.setScalar(1)
        } else if (cycleT < FADE_END) {
          // Fade out (float up)
          p.mesh.visible = true
          const fT = (cycleT - HOLD_END) / (FADE_END - HOLD_END)
          p.mesh.position.y = p.baseY + fT * 0.35
          p.mesh.scale.setScalar(1 - fT)
        } else {
          p.mesh.visible = false
        }
      })

      /* — "!" group: bobs on platform, halo pulses — */
      const allAssembled =
        cycleT > SPAWN_TIMES[3] + BELT_TRAVERSAL + APPEAR_DELAY + SNAP_DURATION &&
        cycleT < HOLD_END
      exclGroup.position.y =
        platformPos.y + 0.5 + (allAssembled ? Math.sin(t * 1.8) * 0.10 : 0)
      exclGroup.rotation.y = Math.sin(t * 0.45) * 0.10
      haloMat.opacity = allAssembled ? 0.08 + Math.abs(Math.sin(t * 1.5)) * 0.12 : 0

      /* — Platform ring pulse — */
      const ringScale = 1 + Math.sin(t * 2) * 0.04
      ring.scale.set(ringScale, 1, ringScale)

      /* — Camera parallax — */
      const targetX = 5.5 + mx
      const targetY = 4.0 - my
      camera.position.x += (targetX - camera.position.x) * 0.04
      camera.position.y += (targetY - camera.position.y) * 0.04
      camera.lookAt(0, 0.3, 0)

      renderer.render(scene, camera)
    }
    animate()

    /* ── Cleanup ────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }

      // Geometries
      const geos = [
        groundGeo, factoryBaseGeo, factoryBodyGeo, factoryRoofGeo,
        chimGeo, capGeo, labelGeo, windowGeo,
        portGeo, inGlowGeo, doorFrameGeo, doorOpeningGeo, outGlowGeo,
        beltGeo, railGeo, rollerGeo, legGeo, padGeo,
        beltPieceGeo, platformGeo, ringGeo, haloGeo,
        ...exclGeometries,
      ]
      geos.forEach((g) => g.dispose())

      // Materials
      allMats.forEach((m) => m.dispose())
      labelMat.dispose()
      inGlowMat.dispose()
      outGlowMat.dispose()
      doorOpeningMat.dispose()
      haloMat.dispose()

      // Textures
      labelTex.dispose()

      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full" />
}
