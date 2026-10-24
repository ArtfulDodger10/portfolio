import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mulberry } from './rng'
import { DEPTH } from './state'

// Winged keys drifting down the tower: gold, silver and bronze keys with feathered wings.
// Three instanced meshes (keys, left wings, right wings), positions updated on the CPU each frame.

// Screen-space anchors (-1 left edge .. 1 right edge), same idea as the crest: never behind the text column.
const WIDE_SLOTS = [0.35, 0.8, 0.55, 0.95, 0.45]
// phones: hug the screen edges so they never cross the text
const NARROW_SLOTS = [-1.02, 1.02, -0.96, 0.96]
const METALS = ['#e2b75a', '#cfd6df', '#c88a4a', '#f0cf7a']

function keyGeometry() {
  // built along +x: bow on the left, teeth on the right
  const bow = new THREE.TorusGeometry(0.13, 0.035, 8, 24).translate(-0.34, 0, 0)
  const shaft = new THREE.CylinderGeometry(0.028, 0.028, 0.56, 8).rotateZ(Math.PI / 2).translate(0.03, 0, 0)
  const t1 = new THREE.BoxGeometry(0.05, 0.13, 0.04).translate(0.24, -0.07, 0)
  const t2 = new THREE.BoxGeometry(0.05, 0.09, 0.04).translate(0.15, -0.05, 0)
  return mergeGeometries([bow, shaft, t1, t2])!
}

function wingGeometry() {
  // one feathered wing in the XY plane, rooted on the x axis, spanning +y
  const s = new THREE.Shape()
  s.moveTo(-0.12, 0)
  s.bezierCurveTo(-0.2, 0.18, -0.12, 0.42, 0.1, 0.48)
  s.lineTo(0.06, 0.38)
  s.lineTo(0.16, 0.36)
  s.lineTo(0.1, 0.26)
  s.lineTo(0.2, 0.22)
  s.lineTo(0.1, 0.12)
  s.bezierCurveTo(0.12, 0.06, 0.1, 0.02, 0.08, 0)
  s.closePath()
  return new THREE.ShapeGeometry(s, 8)
}

export function FlyingKeys({ animate, count, aspect, wide }: { animate: boolean; count: number; aspect: number; wide: boolean }) {
  const keys = useRef<THREE.InstancedMesh>(null)
  const wingsL = useRef<THREE.InstancedMesh>(null)
  const wingsR = useRef<THREE.InstancedMesh>(null)

  const geo = useMemo(() => ({ key: keyGeometry(), wing: wingGeometry() }), [])

  const flock = useMemo(() => {
    const rnd = mulberry(11)
    const slots = wide ? WIDE_SLOTS : NARROW_SLOTS
    return Array.from({ length: count }, (_, i) => {
      const z = -4 - rnd() * 5
      const half = (8 - z) * Math.tan(THREE.MathUtils.degToRad(25)) * aspect
      return {
        x: slots[i % slots.length] * half,
        y: 2 - (i / count) * (DEPTH + 4) - rnd() * 3,
        z,
        phase: rnd() * Math.PI * 2,
        speed: 0.5 + rnd() * 0.5,
        size: 0.8 + rnd() * 0.5,
        color: new THREE.Color(METALS[i % METALS.length]),
      }
    })
  }, [count, aspect, wide])

  const tmp = useMemo(
    () => ({
      body: new THREE.Object3D(),
      wing: new THREE.Matrix4(),
      local: new THREE.Matrix4(),
      rot: new THREE.Matrix4(),
    }),
    [],
  )

  useFrame(({ clock }) => {
    const k = keys.current
    const l = wingsL.current
    const r = wingsR.current
    if (!k || !l || !r) return
    const t = animate ? clock.elapsedTime : 0
    flock.forEach((f, i) => {
      const a = t * f.speed + f.phase
      const b = tmp.body
      b.position.set(f.x + Math.sin(a * 0.6) * 1.3, f.y + Math.sin(a * 0.9) * 0.7, f.z + Math.cos(a * 0.5) * 0.8)
      // face roughly along the direction of travel, bank into the turn
      b.rotation.set(Math.sin(a * 0.9) * 0.15, Math.cos(a * 0.6) > 0 ? 0.35 : Math.PI - 0.35, Math.cos(a * 0.6) * 0.3)
      b.scale.setScalar(f.size * (wide ? 2.1 : 1.0))
      b.updateMatrix()
      k.setMatrixAt(i, b.matrix)

      const flap = 0.45 + 0.85 * (0.5 + 0.5 * Math.sin(t * 13 + f.phase * 3))
      for (const [mesh, dir] of [[l, -1], [r, 1]] as const) {
        tmp.local.makeTranslation(-0.02, 0.02, 0)
        tmp.rot.makeRotationX(dir * flap)
        tmp.wing.multiplyMatrices(b.matrix, tmp.local).multiply(tmp.rot)
        mesh.setMatrixAt(i, tmp.wing)
      }
    })
    k.instanceMatrix.needsUpdate = true
    l.instanceMatrix.needsUpdate = true
    r.instanceMatrix.needsUpdate = true
  })

  // metal colours never change: set once per flock
  useEffect(() => {
    const k = keys.current
    if (!k) return
    flock.forEach((f, i) => k.setColorAt(i, f.color))
    if (k.instanceColor) k.instanceColor.needsUpdate = true
  }, [flock])

  const wingMat = (
    <meshStandardMaterial
      color="#f7efdc"
      emissive="#ffe6a8"
      emissiveIntensity={0.55}
      roughness={0.8}
      side={THREE.DoubleSide}
      transparent
      opacity={0.92}
    />
  )

  return (
    <group>
      <instancedMesh ref={keys} args={[geo.key, undefined, count]} frustumCulled={false}>
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={wingsL} args={[geo.wing, undefined, count]} frustumCulled={false}>
        {wingMat}
      </instancedMesh>
      <instancedMesh ref={wingsR} args={[geo.wing, undefined, count]} frustumCulled={false}>
        {wingMat}
      </instancedMesh>
    </group>
  )
}
