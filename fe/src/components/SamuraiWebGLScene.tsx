'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createEmbers(count: number) {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18
    positions[i * 3 + 1] = Math.random() * 8 - 4
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
    speeds[i] = 0.25 + Math.random() * 0.65
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: '#d59b45',
    size: 0.035,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return {
    points: new THREE.Points(geometry, material),
    positions,
    speeds,
  }
}

function makeKatana() {
  const group = new THREE.Group()

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(4.3, 0.055, 0.035),
    new THREE.MeshBasicMaterial({
      color: '#d8d3c9',
      transparent: true,
      opacity: 0.72,
    }),
  )
  blade.position.x = 0.3
  group.add(blade)

  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(4.1, 0.012, 0.04),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.55,
    }),
  )
  edge.position.set(0.35, 0.038, 0.01)
  group.add(edge)

  const guard = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.018, 8, 36),
    new THREE.MeshBasicMaterial({
      color: '#cfa45b',
      transparent: true,
      opacity: 0.78,
    }),
  )
  guard.rotation.x = Math.PI / 2
  guard.position.x = -1.85
  group.add(guard)

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.12, 0.06),
    new THREE.MeshBasicMaterial({
      color: '#3a1512',
      transparent: true,
      opacity: 0.9,
    }),
  )
  handle.position.x = -2.45
  group.add(handle)

  group.rotation.z = -0.38
  group.position.set(2.5, -0.95, 0)
  return group
}

function makeCrest() {
  const group = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({
    color: '#b83227',
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  })

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52 + i * 0.2, 0.012, 8, 90),
      material,
    )
    ring.rotation.x = Math.PI / 2
    group.add(ring)
  }

  for (let i = 0; i < 8; i++) {
    const ray = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.012, 0.012),
      material,
    )
    ray.rotation.z = (Math.PI / 8) * i
    group.add(ray)
  }

  group.position.set(3.1, 1.35, -0.2)
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
    camera.position.z = 7

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 96),
      new THREE.MeshBasicMaterial({
        color: '#f2dfad',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    )
    moon.position.set(3.45, 1.58, -0.4)
    scene.add(moon)

    const embers = createEmbers(180)
    scene.add(embers.points)

    const katana = makeKatana()
    const crest = makeCrest()
    scene.add(katana)
    scene.add(crest)

    let frame = 0
    let animationId = 0

    function resize() {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    function animate() {
      frame += 0.01

      const position = embers.points.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < embers.speeds.length; i++) {
        const y = position.getY(i) + embers.speeds[i] * 0.012
        const x = position.getX(i) + Math.sin(frame + i) * 0.002
        position.setX(i, x)
        position.setY(i, y > 4.4 ? -4.2 : y)
      }
      position.needsUpdate = true

      katana.rotation.z = -0.38 + Math.sin(frame * 1.4) * 0.025
      katana.position.y = -0.95 + Math.sin(frame * 1.1) * 0.05
      crest.rotation.z += 0.002
      moon.material.opacity = 0.18 + Math.sin(frame) * 0.035

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
      embers.points.geometry.dispose()
      ;(embers.points.material as THREE.Material).dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] opacity-90"
    />
  )
}
