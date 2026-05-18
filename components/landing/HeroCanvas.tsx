'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(0, 2, 8)
    camera.lookAt(0, 0.5, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 2.0)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffa060, 2.2)
    dirLight.position.set(5, 8, 6)
    dirLight.castShadow = true
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 30
    dirLight.shadow.camera.left = -8
    dirLight.shadow.camera.right = 8
    dirLight.shadow.camera.top = 8
    dirLight.shadow.camera.bottom = -8
    dirLight.shadow.mapSize.set(1024, 1024)
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xffd8b0, 0.8)
    fillLight.position.set(-4, 2, -4)
    scene.add(fillLight)

    const backLight = new THREE.PointLight(0xF77019, 1.2, 15)
    backLight.position.set(0, 4, -4)
    scene.add(backLight)

    // Materials
    const matOrange = new THREE.MeshPhysicalMaterial({
      color: 0xf77019,
      roughness: 0.25,
      metalness: 0.05,
    })
    const matLightOrange = new THREE.MeshPhysicalMaterial({
      color: 0xffb060,
      roughness: 0.3,
      metalness: 0.05,
    })
    const matWhite = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.08,
    })
    const matDark = new THREE.MeshPhysicalMaterial({
      color: 0x1d1c1c,
      roughness: 0.4,
      metalness: 0.2,
    })

    // --- Main box (orange, large) ---
    const mainGeo = new THREE.BoxGeometry(2.0, 2.0, 2.0)
    const mainBox = new THREE.Mesh(mainGeo, matOrange)
    mainBox.rotation.set(0.3, Math.PI / 4, 0.1)
    mainBox.position.set(0.3, 0.2, 0)
    mainBox.castShadow = true
    scene.add(mainBox)

    // --- Torus ring around main box ---
    const torusGeo = new THREE.TorusGeometry(1.6, 0.07, 16, 80)
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0xf77019,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.65,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.rotation.set(Math.PI / 3, 0.2, Math.PI / 6)
    torus.position.set(0.3, 0.2, 0)
    scene.add(torus)

    // --- Small box (light orange) — upper-left ---
    const smallGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85)
    const box2 = new THREE.Mesh(smallGeo, matLightOrange)
    box2.position.set(-2.4, 1.0, 0.3)
    box2.rotation.set(0.2, Math.PI / 5, 0.1)
    box2.castShadow = true
    scene.add(box2)

    // --- Small box (white) — right ---
    const box3 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), matWhite)
    box3.position.set(2.6, -0.3, -0.2)
    box3.rotation.set(0.3, -Math.PI / 5, 0.15)
    box3.castShadow = true
    scene.add(box3)

    // --- Tiny box (dark) — lower-left ---
    const box4 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), matDark)
    box4.position.set(-1.3, -1.6, 0.6)
    box4.rotation.set(0.4, Math.PI / 3, 0.2)
    box4.castShadow = true
    scene.add(box4)

    // --- Tiny box (orange) — upper-right ---
    const box5 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), matOrange)
    box5.position.set(1.8, 1.8, 0.3)
    box5.rotation.set(0.1, Math.PI / 6, 0.3)
    box5.castShadow = true
    scene.add(box5)

    // --- Floating dots (spheres) ---
    const dotGeo = new THREE.SphereGeometry(0.1, 16, 16)
    const dotData: { mesh: THREE.Mesh; baseY: number; phase: number }[] = [
      { x: -2.9, y: 1.8, z: -0.3, phase: 0 },
      { x: 3.0, y: 1.3, z: 0.2, phase: 1.2 },
      { x: 1.6, y: -2.1, z: 0.4, phase: 2.4 },
      { x: -1.6, y: -1.9, z: -0.2, phase: 0.8 },
      { x: 0.1, y: 2.6, z: 0.5, phase: 1.8 },
      { x: -3.2, y: -0.5, z: 0.1, phase: 3.0 },
    ].map(({ x, y, z, phase }) => {
      const mesh = new THREE.Mesh(dotGeo, matOrange)
      mesh.position.set(x, y, z)
      scene.add(mesh)
      return { mesh, baseY: y, phase }
    })

    // --- Shadow plane ---
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.07 })
    )
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.position.y = -2.8
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    // Mouse interaction
    let targetX = 0
    let targetY = 0
    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.6
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('mousemove', onMouseMove)

    // Resize
    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Animation
    const timer = new THREE.Timer()
    let rafId: number

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      timer.update()
      const t = timer.getElapsed()

      // Main box: rotate + float
      mainBox.rotation.y = Math.PI / 4 + t * 0.35
      mainBox.rotation.x = 0.3 + Math.sin(t * 0.5) * 0.08
      mainBox.position.y = 0.2 + Math.sin(t * 0.7) * 0.18

      // Torus: follow main box Y
      torus.position.y = mainBox.position.y
      torus.rotation.z = Math.PI / 6 + t * 0.18

      // Side boxes
      box2.rotation.y = Math.PI / 5 + t * 0.28
      box2.position.y = 1.0 + Math.sin(t * 0.6 + 1.0) * 0.14

      box3.rotation.y = -Math.PI / 5 - t * 0.22
      box3.position.y = -0.3 + Math.sin(t * 0.55 + 2.0) * 0.12

      box4.rotation.y = Math.PI / 3 + t * 0.45
      box4.position.y = -1.6 + Math.sin(t * 0.8 + 0.5) * 0.1

      box5.rotation.y = Math.PI / 6 + t * 0.4
      box5.position.y = 1.8 + Math.sin(t * 0.65 + 3.0) * 0.1

      // Dots
      dotData.forEach(({ mesh, baseY, phase }) => {
        mesh.position.y = baseY + Math.sin(t * 0.5 + phase) * 0.12
      })

      // Camera mouse parallax (lerp)
      camera.position.x += (targetX - camera.position.x) * 0.04
      camera.position.y += (-targetY + 2 - camera.position.y) * 0.04
      camera.lookAt(0, 0.5, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full" />
}
