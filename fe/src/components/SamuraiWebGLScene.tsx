'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createEmbers(count: number) {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = Math.random() * 9 - 4.5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    speeds[i] = 0.2 + Math.random() * 0.72
    sizes[i]  = 0.02 + Math.random() * 0.04
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    color: '#d59b45',
    size: 0.038,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return { points: new THREE.Points(geometry, material), positions, speeds }
}

function createDustParticles(count: number) {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 22
    positions[i * 3 + 1] = Math.random() * 10 - 5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4
    speeds[i] = 0.05 + Math.random() * 0.18
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.012,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return { points: new THREE.Points(geometry, material), positions, speeds }
}

function makeKatana() {
  const group = new THREE.Group()

  // Main blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.058, 0.038),
    new THREE.MeshBasicMaterial({
      color: '#ddd8ce',
      transparent: true,
      opacity: 0.78,
    }),
  )
  blade.position.x = 0.4
  group.add(blade)

  // Sharp edge highlight
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.011, 0.042),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.52,
    }),
  )
  edge.position.set(0.45, 0.04, 0.01)
  group.add(edge)

  // Blood groove (fuller)
  const fuller = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.006, 0.018),
    new THREE.MeshBasicMaterial({
      color: '#b0aaa0',
      transparent: true,
      opacity: 0.35,
    }),
  )
  fuller.position.set(0.2, -0.015, 0)
  group.add(fuller)

  // Shimmer sweep mesh (animated)
  const shimmer = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.065, 0.04),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  shimmer.position.set(-2.5, 0.038, 0.01)
  shimmer.userData.isShimmer = true
  group.add(shimmer)

  // Guard (tsuba) — more ornate
  const guard = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.022, 10, 48),
    new THREE.MeshBasicMaterial({
      color: '#d4a855',
      transparent: true,
      opacity: 0.85,
    }),
  )
  guard.rotation.x = Math.PI / 2
  guard.position.x = -2.05
  group.add(guard)

  // Inner guard ring
  const guardInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.01, 8, 36),
    new THREE.MeshBasicMaterial({
      color: '#b83227',
      transparent: true,
      opacity: 0.55,
    }),
  )
  guardInner.rotation.x = Math.PI / 2
  guardInner.position.x = -2.05
  group.add(guardInner)

  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.13, 0.065),
    new THREE.MeshBasicMaterial({
      color: '#3a1512',
      transparent: true,
      opacity: 0.92,
    }),
  )
  handle.position.x = -2.7
  group.add(handle)

  // Handle wrapping marks
  for (let i = 0; i < 5; i++) {
    const wrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.14, 0.07),
      new THREE.MeshBasicMaterial({
        color: '#1a0a08',
        transparent: true,
        opacity: 0.6,
      }),
    )
    wrap.position.x = -2.2 - i * 0.2
    group.add(wrap)
  }

  group.rotation.z = -0.36
  group.position.set(2.6, -0.9, 0)

  return group
}

function makeCrest() {
  const group = new THREE.Group()
  const redMat = new THREE.MeshBasicMaterial({
    color: '#b83227',
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  })
  const goldMat = new THREE.MeshBasicMaterial({
    color: '#cfa45b',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  })

  // Concentric rings
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45 + i * 0.2, 0.011, 8, 96),
      i % 2 === 0 ? redMat : goldMat,
    )
    ring.rotation.x = Math.PI / 2
    group.add(ring)
  }

  // Radiating spokes
  for (let i = 0; i < 12; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.01, 0.01),
      redMat,
    )
    spoke.rotation.z = (Math.PI / 6) * i
    group.add(spoke)
  }

  // Center dot
  const center = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 24),
    new THREE.MeshBasicMaterial({
      color: '#b83227',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  )
  center.rotation.x = -Math.PI / 2
  group.add(center)

  group.position.set(3.2, 1.4, -0.3)
  return group
}

export default function SamuraiWebGLScene() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (mount === null) return
    const container = mount

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.z = 7.5

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // Moon — larger and more visible
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 128),
      new THREE.MeshBasicMaterial({
        color: '#f5e8c0',
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    )
    moon.position.set(3.5, 1.65, -0.5)
    scene.add(moon)

    // Moon halo
    const moonHalo = new THREE.Mesh(
      new THREE.RingGeometry(1.08, 1.38, 128),
      new THREE.MeshBasicMaterial({
        color: '#e8d49a',
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    moonHalo.position.set(3.5, 1.65, -0.55)
    scene.add(moonHalo)

    // Embers — 280 particles
    const embers = createEmbers(280)
    scene.add(embers.points)

    // Dust — 120 tiny white particles
    const dust = createDustParticles(120)
    scene.add(dust.points)

    // Katana
    const katana = makeKatana()
    scene.add(katana)

    // Find the shimmer mesh
    let shimmerMesh: THREE.Mesh | null = null
    katana.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData.isShimmer) {
        shimmerMesh = obj
      }
    })

    // Crest
    const crest = makeCrest()
    scene.add(crest)

    // Subtle ambient fog
    scene.fog = new THREE.FogExp2(0x07080c, 0.015)

    let frame = 0
    let animationId = 0
    let shimmerPhase = 0
    let shimmerActive = false
    let shimmerTimer = 0

    function resize() {
      const width  = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    function animate() {
      frame += 0.01

      // Embers
      const pos = embers.points.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < embers.speeds.length; i++) {
        const y = pos.getY(i) + embers.speeds[i] * 0.013
        const x = pos.getX(i) + Math.sin(frame * 0.9 + i * 0.7) * 0.0022
        pos.setX(i, x)
        pos.setY(i, y > 4.8 ? -4.5 : y)
      }
      pos.needsUpdate = true

      // Dust particles — very slow lateral drift
      const dustPos = dust.points.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < dust.speeds.length; i++) {
        const x = dustPos.getX(i) + dust.speeds[i] * 0.004
        dustPos.setX(i, x > 11 ? -11 : x)
      }
      dustPos.needsUpdate = true

      // Katana breathing
      katana.rotation.z = -0.36 + Math.sin(frame * 1.35) * 0.022
      katana.position.y = -0.9 + Math.sin(frame * 1.08) * 0.055

      // Katana shimmer sweep — fires every ~8 seconds
      shimmerTimer += 0.01
      if (shimmerTimer > 8 && !shimmerActive) {
        shimmerActive = true
        shimmerPhase = 0
        shimmerTimer = 0
      }

      if (shimmerActive && shimmerMesh) {
        shimmerPhase += 0.06
        const t = shimmerPhase / Math.PI
        const mat = shimmerMesh.material as THREE.MeshBasicMaterial
        if (t < 1) {
          shimmerMesh.position.x = -2.5 + t * 5.0
          mat.opacity = Math.sin(t * Math.PI) * 0.72
        } else {
          mat.opacity = 0
          shimmerActive = false
        }
      }

      // Crest slow rotation
      crest.rotation.z += 0.0018

      // Moon breathing
      const moonMat = moon.material as THREE.MeshBasicMaterial
      moonMat.opacity = 0.20 + Math.sin(frame * 0.85) * 0.042

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      container.removeChild(renderer.domElement)
      renderer.dispose()

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose()
          ;(obj.material as THREE.Material).dispose()
        }
      })
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] opacity-92"
    />
  )
}
