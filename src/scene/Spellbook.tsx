import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A floating open book whose pages turn on their own. Sits beside the Spellbook section.

const PAGES = 4

export function FloatingBook({ animate, position }: { animate: boolean; position: [number, number, number] }) {
  const root = useRef<THREE.Group>(null)
  const pages = useRef<THREE.Group[]>([])

  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 1.2
    if (root.current) {
      root.current.position.y = position[1] + Math.sin(t * 0.9) * 0.15
      root.current.rotation.z = Math.sin(t * 0.5) * 0.05
    }
    pages.current.forEach((p, i) => {
      if (!p) return
      // each page lifts, turns, settles; staggered so one is always mid-air
      const cycle = (t * 0.35 + i / PAGES) % 1
      const k = THREE.MathUtils.smoothstep(cycle, 0.1, 0.9)
      p.rotation.y = -0.18 - k * (Math.PI - 0.36)
      p.position.z = 0.03 + Math.sin(k * Math.PI) * 0.02
    })
  })

  const leather = <meshStandardMaterial color="#5b1215" roughness={0.7} />
  const paper = <meshStandardMaterial color="#efe2c4" roughness={0.9} emissive="#3d2a10" emissiveIntensity={0.3} side={THREE.DoubleSide} />

  return (
    <group ref={root} position={position} rotation={[-0.9, -0.35, 0]} scale={1.1}>
      {/* covers, opened slightly past flat */}
      <mesh position={[-0.75, 0, -0.02]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[1.5, 2, 0.05]} />
        {leather}
      </mesh>
      <mesh position={[0.75, 0, -0.02]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[1.5, 2, 0.05]} />
        {leather}
      </mesh>
      {/* page blocks */}
      <mesh position={[-0.7, 0, 0.04]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[1.38, 1.9, 0.08]} />
        {paper}
      </mesh>
      <mesh position={[0.7, 0, 0.04]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[1.38, 1.9, 0.08]} />
        {paper}
      </mesh>
      {/* turning pages pivot on the spine */}
      {Array.from({ length: PAGES }, (_, i) => (
        <group key={i} ref={(el) => { if (el) pages.current[i] = el }}>
          <mesh position={[0.68, 0, 0]}>
            <planeGeometry args={[1.36, 1.86]} />
            {paper}
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 0, 1.2]} intensity={3} distance={4} color="#ffd38a" />
    </group>
  )
}
