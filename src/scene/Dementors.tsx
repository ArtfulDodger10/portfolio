import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dementors } from './state'

// Hooded, ragged figures that visit now and then (schedule in state.ts). Each is one lathe-turned cloak whose hem
// tears and flutters in the shader, plus a black void where the face should be.
// While they are here it turns cold: `dementors.cold` rises, the DOM frosts over (--cold), candles dim blue.
// They rise from below on arrival and sink away when they leave or a Patronus drives them off.

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying float vV;
  varying float vAng;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vec3 p = position;
    vV = uv.y;                       // 0 at the hood, 1 at the hem
    vAng = atan(p.z, p.x);
    float low = vV * vV;
    float flutter = sin(vAng * 7.0 + uTime * 2.6 + uSeed) * 0.5 + sin(vAng * 13.0 - uTime * 1.9) * 0.5;
    p.xz *= 1.0 + flutter * 0.12 * low;
    p.y += sin(vAng * 9.0 + uTime * 3.1 + uSeed) * 0.09 * low;
    // the whole cloak leans and billows a little
    p.x += sin(uTime * 0.9 + uSeed + p.y) * 0.06 * low;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  varying float vV;
  varying float vAng;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    // tattered hem: long ragged strips, moving slowly
    float rag = 0.7 + 0.22 * (0.5 + 0.5 * sin(vAng * 23.0 + uTime * 0.7)) * (0.5 + 0.5 * sin(vAng * 9.0 - uTime * 0.4));
    if (vV > rag) discard;
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.5);
    vec3 cloth = vec3(0.035, 0.04, 0.05);
    vec3 col = cloth + vec3(0.32, 0.42, 0.55) * rim * 0.55;
    float alpha = (0.92 - smoothstep(rag - 0.18, rag, vV) * 0.6) * uFade;
    gl_FragColor = vec4(col, alpha);
  }
`

function cloakGeometry() {
  // profile from the top of the hood down to the hem (radius, height)
  const pts = [
    [0.0, 1.62], [0.14, 1.6], [0.26, 1.48], [0.31, 1.28], [0.29, 1.1],
    [0.42, 0.98], [0.5, 0.7], [0.54, 0.2], [0.6, -0.4], [0.7, -1.0], [0.82, -1.7],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  return new THREE.LatheGeometry(pts, 40)
}

type Wraith = { ax: number; az: number; phase: number; radius: number; height: number }

export function Dementors({ count, animate, wide, aspect }: { count: number; animate: boolean; wide: boolean; aspect: number }) {
  const geo = useMemo(cloakGeometry, [])
  const groups = useRef<THREE.Group[]>([])

  const crew: Wraith[] = useMemo(() => {
    // screen-space anchors like the keys: right of the text on wide screens, the edges on phones
    const slots = wide ? [0.45, 0.8, 0.62, 0.95] : [-1.0, 1.0, -0.92, 0.92]
    return Array.from({ length: count }, (_, i) => {
      const z = -3 - (i % 2) * 2.5
      const half = (8 - z) * Math.tan(THREE.MathUtils.degToRad(25)) * aspect
      return { ax: slots[i % slots.length] * half, az: z, phase: i * 1.7, radius: (wide ? 0.8 : 0.35) + (i % 3) * (wide ? 0.4 : 0.15), height: ((i % 3) - 1) * 1.6 }
    })
  }, [count, wide, aspect])

  const mats = useMemo(
    () =>
      crew.map(
        (_, i) =>
          new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: { uTime: { value: 0 }, uSeed: { value: i * 2.3 }, uFade: { value: 1 } },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [crew],
  )

  // how present they are: 0 = gone, 1 = fully here. Arrive over 4 s, leave over 3 s.
  const presence = useRef(0)
  const followY = useRef(0)

  useFrame(({ clock, camera }, dt) => {
    dementors.tick()
    const t = animate ? clock.elapsedTime : 0
    const target = dementors.phase === 'present' ? 1 : 0
    presence.current = THREE.MathUtils.damp(presence.current, target, target ? 0.8 : 1.6, dt)
    const p = presence.current
    // they drift after the visitor, a little behind
    followY.current = THREE.MathUtils.damp(followY.current, camera.position.y, 0.6, dt)

    crew.forEach((w, i) => {
      const g = groups.current[i]
      if (!g) return
      g.visible = p > 0.02
      if (!g.visible) return
      const a = t * 0.25 + w.phase
      g.position.set(
        w.ax + Math.cos(a) * w.radius,
        followY.current + w.height + Math.sin(t * 0.6 + w.phase) * 0.35 - (1 - p) * 6,
        w.az + Math.sin(a) * w.radius * 0.6,
      )
      g.rotation.y = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z)
      g.rotation.z = Math.sin(t * 0.5 + w.phase) * 0.08
      mats[i].uniforms.uTime.value = t
      mats[i].uniforms.uFade.value = p
    })

    // a light chill while they are here: frost at the edges, candles turn blue
    const next = p * 0.7
    if (Math.abs(next - dementors.cold) > 0.005) {
      document.documentElement.style.setProperty('--cold', next.toFixed(3))
      dementors.cold = next
    }
  })

  return (
    <group>
      {crew.map((_, i) => (
        <group key={i} ref={(el) => { if (el) groups.current[i] = el }} scale={wide ? 1 : 0.6}>
          <mesh geometry={geo} material={mats[i]} />
          {/* the void under the hood */}
          <mesh position={[0, 1.3, 0.1]}>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
