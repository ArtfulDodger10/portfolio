import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry } from './rng'
import { DEPTH, dementors, pointer, wand } from './state'

// Floating candles: one InstancedMesh for the wax, one Points cloud for the flames.
// Positions are spread along the camera's scroll path.
// Near the wand (mouse, or tilt on phones) a candle leans away from it and its flame flares up.

const flameVert = /* glsl */ `
  attribute float aSeed;
  attribute float aBoost;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uCold;
  varying float vSeed;
  varying float vBoost;
  void main() {
    vSeed = aSeed;
    vBoost = aBoost;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float flicker = 0.85 + 0.15 * sin(uTime * 9.0 + aSeed * 40.0) * sin(uTime * 5.3 + aSeed * 13.0);
    // ~0.8 world units across: flame plus its halo
    // dementors nearby: flames shrink
    gl_PointSize = 650.0 * flicker * (1.0 + 0.55 * aBoost) * (1.0 - 0.45 * uCold) * uPixelRatio / -mv.z;
  }
`

const flameFrag = /* glsl */ `
  uniform float uTime;
  uniform float uCold;
  varying float vSeed;
  varying float vBoost;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    p.y = -p.y;
    // teardrop: narrow the top, sway it a little
    p.x += sin(uTime * 6.0 + vSeed * 20.0) * 0.04 * (p.y + 0.5);
    float w = mix(0.22, 0.06, clamp(p.y + 0.5, 0.0, 1.0));
    float d = length(vec2(p.x / w, (p.y + 0.08) / 0.42));
    float core = smoothstep(1.0, 0.0, d);
    float halo = pow(smoothstep(0.5, 0.0, length(p)), 2.5) * 0.45;
    vec3 col = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.92, 0.7), core);
    // ...and turn cold blue
    col = mix(col, mix(vec3(0.25, 0.45, 1.0), vec3(0.8, 0.9, 1.0), core), uCold * 0.85);
    float a = core + halo;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col * (1.4 + core) * (1.0 + 0.7 * vBoost), a);
  }
`

export function Candles({ count, animate }: { count: number; animate: boolean }) {
  const wax = useRef<THREE.InstancedMesh>(null)
  const flamePos = useRef<THREE.BufferAttribute>(null)
  const flameBoost = useRef<THREE.BufferAttribute>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const seeds = useMemo(() => {
    const rnd = mulberry(7)
    return Array.from({ length: count }, () => {
      const side = rnd() < 0.5 ? -1 : 1
      return {
        x: side * (2.2 + rnd() * 7),
        y: 6 - rnd() * (DEPTH + 8),
        z: -2 - rnd() * 12,
        h: 0.5 + rnd() * 0.7,
        phase: rnd() * Math.PI * 2,
        seed: rnd(),
      }
    })
  }, [count])

  const flameData = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const boost = new Float32Array(count)
    seeds.forEach((s, i) => (seed[i] = s.seed))
    return { pos, seed, boost }
  }, [count, seeds])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }, uCold: { value: 0 } }),
    [],
  )

  // per-candle lean (radians) and flare (0..1), eased so they settle back after the wand passes
  const react = useMemo(() => ({ lean: new Float32Array(count), boost: flameData.boost }), [count, flameData])
  const ndc = useMemo(() => new THREE.Vector3(), [])

  const place = (t: number, camera: THREE.Camera, aspect: number, dt: number) => {
    const mesh = wax.current
    if (!mesh) return
    const ease = Math.min(1, dt * 6)
    seeds.forEach((s, i) => {
      const bob = Math.sin(t * 0.8 + s.phase) * 0.18
      const y = s.y + bob
      // how close is this candle to the wand, on screen?
      let leanTo = 0
      let flare = 0
      if (wand.active) {
        ndc.set(s.x, y, s.z).project(camera)
        const dx = (ndc.x - pointer.x) * aspect
        const d = Math.hypot(dx, ndc.y - pointer.y)
        const near = THREE.MathUtils.smoothstep(0.32, 0.04, d)
        leanTo = Math.sign(dx || 1) * near * -0.45 // tip leans away from the wand
        flare = near
      }
      react.lean[i] += (leanTo - react.lean[i]) * ease
      react.boost[i] += (flare - react.boost[i]) * ease
      const lean = react.lean[i]
      dummy.position.set(s.x, y, s.z)
      dummy.rotation.set(0, 0, lean)
      dummy.scale.set(1, s.h, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      const top = s.h * 0.5 + 0.13
      flameData.pos[i * 3] = s.x - Math.sin(lean) * top
      flameData.pos[i * 3 + 1] = y + Math.cos(lean) * top
      flameData.pos[i * 3 + 2] = s.z
    })
    mesh.instanceMatrix.needsUpdate = true
    if (flamePos.current) flamePos.current.needsUpdate = true
    if (flameBoost.current) flameBoost.current.needsUpdate = true
  }

  useFrame(({ clock, camera, viewport }, dt) => {
    const t = animate ? clock.elapsedTime : 0
    uniforms.uTime.value = t
    uniforms.uCold.value = dementors.cold
    place(t, camera, viewport.aspect, dt)
  })

  return (
    <group>
      <instancedMesh ref={wax} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.08, 1, 10]} />
        <meshStandardMaterial color="#efe3c8" roughness={0.6} emissive="#5a3a10" emissiveIntensity={0.25} />
      </instancedMesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute ref={flamePos} attach="attributes-position" args={[flameData.pos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[flameData.seed, 1]} />
          <bufferAttribute ref={flameBoost} attach="attributes-aBoost" args={[flameData.boost, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={flameVert}
          fragmentShader={flameFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
