import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { crest, pointer, wand } from './state'
import { Wizard } from './Wizard'

// The hero emblem: a young wizard on a racing broom (Wizard.tsx) flying inside three rune rings,
// with one orbiting spell-light. (The component keeps its old name; it began as a shield crest.)
// Built from code (no models), so it costs a few KB instead of megabytes.
// Point the wand at it and the rings spin up and glow; click it and it flares (Lumos, cast in App.tsx).

export function Crest({ animate }: { animate: boolean }) {
  const root = useRef<THREE.Group>(null)
  const rings = useRef<THREE.Group[]>([])
  const orb = useRef<THREE.Mesh>(null)
  const runes = useRef<THREE.InstancedMesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const ringMats = useRef<THREE.MeshBasicMaterial[]>([])
  const motion = useRef({ spin: 0, speed: 1, glow: 0 })
  const centre = useMemo(() => new THREE.Vector3(), [])
  const edge = useMemo(() => new THREE.Vector3(), [])

  const runeCount = 60
  // Rune ticks never move relative to each other, so they are placed once on mount.
  const placeRunes = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    runes.current = mesh
    const d = new THREE.Object3D()
    for (let i = 0; i < runeCount; i++) {
      const a = (i / runeCount) * Math.PI * 2
      const long = i % 5 === 0
      d.position.set(Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0)
      d.rotation.set(0, 0, a)
      d.scale.set(long ? 0.22 : 0.1, 0.025, 0.025)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  useFrame(({ clock, camera, size }, dt) => {
    const t = animate ? clock.elapsedTime : 0
    // where the crest sits on screen, for hover and click (the DOM covers the canvas)
    if (root.current) {
      root.current.getWorldPosition(centre)
      edge.set(3.2, 0, 0).applyMatrix4(root.current.matrixWorld)
      centre.project(camera)
      edge.project(camera)
      crest.x = (centre.x + 1) * 0.5 * size.width
      crest.y = (1 - centre.y) * 0.5 * size.height
      crest.r = Math.abs(edge.x - centre.x) * 0.5 * size.width
      const px = (pointer.x + 1) * 0.5 * size.width
      const py = (1 - pointer.y) * 0.5 * size.height
      const hover = wand.active && Math.hypot(px - crest.x, py - crest.y) < crest.r * 0.75
      if (hover !== crest.hover) {
        crest.hover = hover
        document.documentElement.classList.toggle('over-crest', hover)
      }
    }
    const m = motion.current
    const flash = Math.max(0, 1 - (performance.now() / 1000 - crest.flashAt) / 1.2)
    m.speed = THREE.MathUtils.damp(m.speed, crest.hover ? 5 : 1, 3, dt)
    m.glow = THREE.MathUtils.damp(m.glow, crest.hover ? 1 : 0, 4, dt)
    if (animate) m.spin += dt * m.speed
    const spin = animate ? m.spin : 0
    if (light.current) light.current.intensity = 4 + m.glow * 5 + flash * 40
    ringMats.current.forEach((mat) => mat && mat.color.setScalar(1).lerp(mat.userData.base, Math.max(0, 1 - m.glow * 0.6 - flash * 0.8)))
    if (root.current) {
      const g = root.current
      // a gentler turn than the old shield: the rider should always read in profile, never head-on
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.x * 0.22 + Math.sin(t * 0.3) * 0.08, 3, dt)
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.25, 3, dt)
      g.position.y = Math.sin(t * 0.7) * 0.08
    }
    rings.current.forEach((r, i) => {
      if (!r) return
      r.rotation.z = spin * (i % 2 ? -0.12 : 0.08) * (i + 1)
      r.rotation.x = Math.PI / 2 + Math.sin(t * 0.2 + i) * 0.25 * i
    })
    if (runes.current) runes.current.rotation.z = -spin * 0.05
    if (orb.current) {
      const a = t * 1.1
      orb.current.position.set(Math.cos(a) * 3.1, Math.sin(a * 0.7) * 1.2, Math.sin(a) * 3.1)
    }
  })

  return (
    <group ref={root}>
      {/* the rider: flies left, turned three-quarters towards the camera */}
      <group position={[0, -0.05, 0.2]} rotation={[0, Math.PI + 0.42, 0]}>
        <Wizard animate={animate} />
      </group>

      {/* rune rings */}
      {[2.2, 2.85, 3.4].map((r, i) => (
        <group key={r} ref={(el) => { if (el) rings.current[i] = el }}>
          <mesh>
            <torusGeometry args={[r, i === 1 ? 0.012 : 0.02, 8, 160]} />
            <meshBasicMaterial
              ref={(mat) => {
                if (!mat) return
                mat.userData.base = new THREE.Color(i === 2 ? '#c23a2b' : '#f0c35a')
                ringMats.current[i] = mat
              }}
              color={i === 2 ? '#c23a2b' : '#f0c35a'}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={placeRunes} args={[undefined, undefined, runeCount]}>
        <boxGeometry />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </instancedMesh>

      {/* spell light */}
      <Trail width={0.7} length={4} color="#ffcf6b" attenuation={(w) => w * w}>
        <mesh ref={orb}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#fff2c4" toneMapped={false} />
        </mesh>
      </Trail>
      <pointLight ref={light} position={[0, 0.3, 1.6]} intensity={4} distance={6} color="#ffb35c" />
    </group>
  )
}
