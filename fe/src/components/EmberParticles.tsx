'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function EmberParticles() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 7

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Embers (gold) ────────────────────────────
    const EMBER_COUNT = 160
    const ePos    = new Float32Array(EMBER_COUNT * 3)
    const eSpeeds = new Float32Array(EMBER_COUNT)

    for (let i = 0; i < EMBER_COUNT; i++) {
      ePos[i * 3]     = (Math.random() - 0.5) * 22
      ePos[i * 3 + 1] = Math.random() * 10 - 5
      ePos[i * 3 + 2] = (Math.random() - 0.5) * 8
      eSpeeds[i]      = 0.18 + Math.random() * 0.55
    }

    const emberGeo = new THREE.BufferGeometry()
    emberGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3))

    const emberMat = new THREE.PointsMaterial({
      color: '#d59b45',
      size: 0.032,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const embers = new THREE.Points(emberGeo, emberMat)
    scene.add(embers)

    // ── Dust (white, tiny) ───────────────────────
    const DUST_COUNT = 80
    const dPos    = new Float32Array(DUST_COUNT * 3)
    const dSpeeds = new Float32Array(DUST_COUNT)

    for (let i = 0; i < DUST_COUNT; i++) {
      dPos[i * 3]     = (Math.random() - 0.5) * 24
      dPos[i * 3 + 1] = Math.random() * 10 - 5
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 6
      dSpeeds[i]      = 0.04 + Math.random() * 0.12
    }

    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3))

    const dustMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.010,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const dust = new THREE.Points(dustGeo, dustMat)
    scene.add(dust)

    let frame = 0
    let animId = 0

    function resize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
    }

    function animate() {
      frame += 0.008

      // Embers drift upward
      const ep = embers.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < EMBER_COUNT; i++) {
        const y = ep.getY(i) + eSpeeds[i] * 0.011
        const x = ep.getX(i) + Math.sin(frame + i * 0.7) * 0.0018
        ep.setY(i, y > 5.2 ? -5 : y)
        ep.setX(i, x)
      }
      ep.needsUpdate = true

      // Dust drifts sideways
      const dp = dust.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < DUST_COUNT; i++) {
        const x = dp.getX(i) + dSpeeds[i] * 0.003
        dp.setX(i, x > 12 ? -12 : x)
      }
      dp.needsUpdate = true

      // Slow opacity breathe
      emberMat.opacity = 0.52 + Math.sin(frame * 0.6) * 0.13

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    resize()
    animate()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
      emberGeo.dispose()
      emberMat.dispose()
      dustGeo.dispose()
      dustMat.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.55 }}
    />
  )
}
