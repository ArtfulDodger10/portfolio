import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mulberry } from './rng'
import { pointer } from './state'
import { clothMaterial, clothSheet, clothTime, limb, rimMaterial, scarfTexture, taperedTube } from './wizardKit'

// A young Gryffindor wizard racing on a broom, sculpted from smooth tapered shapes and lit like the rest of
// the page: ink-black robes with a glowing gold edge, a cape lined in scarlet billowing behind, a striped
// scarf, wind-swept hair, a curved broom with gold bindings and a twig tail that sheds gold sparks.
// (Generic wizard: not a film character's likeness; no trademarked broom name.)
// Built facing +x with the seat at the origin; the parent turns him to fly left towards the camera.

type V3 = [number, number, number]
type Part = 'robe' | 'skin' | 'trousers' | 'shoe' | 'hair' | 'shirt'

const INK = '#191522'
const SKIN = '#ecccb2'

// ---------- the broom ----------
function buildBroom() {
  const handle = taperedTube(
    [
      [-1.62, -0.01, 0],
      [-0.8, 0.0, 0],
      [0, 0.0, 0],
      [0.9, 0.01, 0],
      [1.45, 0.05, 0],
      [1.68, 0.16, 0],
    ],
    (u) => (u < 0.85 ? 0.05 - u * 0.012 : 0.04 - (u - 0.85) * 0.12) * (u > 0.97 ? 0.7 : 1),
    48,
    12,
  )
  // twig tail: ~150 thin, slightly curved twigs fanning out from the binding
  const rnd = mulberry(5)
  const twigs: THREE.BufferGeometry[] = []
  for (let i = 0; i < 150; i++) {
    const a = rnd() * Math.PI * 2
    const spread = Math.sqrt(rnd())
    const r0 = 0.03 + spread * 0.04
    const r1 = 0.08 + spread * 0.3
    const len = 0.85 + rnd() * 0.3
    const curl = (rnd() - 0.5) * 0.12
    twigs.push(
      taperedTube(
        [
          [-1.58, Math.sin(a) * r0, Math.cos(a) * r0],
          [-1.9, Math.sin(a) * (r0 + r1) * 0.45 + curl, Math.cos(a) * (r0 + r1) * 0.45],
          [-1.58 - len, Math.sin(a) * r1 + curl * 2 + 0.03, Math.cos(a) * r1],
        ],
        (u) => 0.011 * (1 - u * 0.75),
        5,
        3,
      ),
    )
  }
  return { handle, tail: mergeGeometries(twigs)! }
}

// gold sparks streaming off the twig tail (local space, so they trail behind the flight)
const sparkVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  varying float vLife;
  void main() {
    float life = fract(uTime * (0.35 + aSeed * 0.4) + aSeed * 7.0);
    vLife = life;
    vec3 p = position;
    p.x -= life * (1.4 + aSeed);
    p.y += sin(life * 6.0 + aSeed * 20.0) * 0.12 * life - life * 0.15;
    p.z += cos(life * 5.0 + aSeed * 13.0) * 0.12 * life;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (40.0 + aSeed * 50.0) * (1.0 - life) / -mv.z;
  }
`
const sparkFrag = /* glsl */ `
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * (1.0 - vLife);
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.45) * 1.8, a);
  }
`

// ---------- the rider ----------
function buildRider(): Map<Part, THREE.BufferGeometry> {
  const parts: { geo: THREE.BufferGeometry; mat: Part }[] = []
  const add = (geo: THREE.BufferGeometry, mat: Part) => parts.push({ geo, mat })

  // torso in robes: hips to shoulders, crouched low over the handle
  add(taperedTube([[-0.08, 0.1, 0], [0.12, 0.3, 0], [0.32, 0.5, 0], [0.48, 0.62, 0]], limb(0.19, 0.22, 0.17), 24, 16), 'robe')
  // shoulders: a soft yoke across
  add(taperedTube([[0.44, 0.6, -0.24], [0.48, 0.64, 0], [0.44, 0.6, 0.24]], limb(0.1, 0.12, 0.1), 16, 12), 'robe')
  // neck and a white shirt collar
  add(taperedTube([[0.48, 0.62, 0], [0.56, 0.71, 0]], () => 0.065, 6, 12), 'skin')
  add(taperedTube([[0.47, 0.63, 0], [0.53, 0.68, 0]], () => 0.085, 4, 14), 'shirt')

  for (const s of [1, -1]) {
    // arms: shoulder -> elbow (out and down) -> hands on the handle; sleeves flare at the cuff
    add(
      taperedTube(
        [[0.44, 0.6, 0.22 * s], [0.53, 0.48, 0.26 * s], [0.62, 0.36, 0.27 * s], [0.75, 0.22, 0.18 * s], [0.86, 0.12, 0.09 * s]],
        (u) => limb(0.08, 0.072, 0.07)(u) + (u > 0.82 ? (u - 0.82) * 0.3 : 0),
        24,
        12,
      ),
      'robe',
    )
    const hand = new THREE.SphereGeometry(0.058, 14, 12)
    hand.scale(1.25, 0.9, 1)
    hand.translate(0.92, 0.06, 0.07 * s)
    add(hand, 'skin')
    // legs: hip -> knee (forward, down) -> ankle (tucked back) -> boot
    const knee: V3 = [0.26, -0.15, 0.19 * s]
    add(taperedTube([[0.02, 0.06, 0.13 * s], [0.16, -0.05, 0.17 * s], knee], limb(0.1, 0.095, 0.08), 16, 12), 'trousers')
    add(taperedTube([knee, [0.0, -0.24, 0.2 * s], [-0.3, -0.26, 0.2 * s]], limb(0.075, 0.066, 0.052), 16, 12), 'trousers')
    // boots resting on the rear footrests, toes pointing back
    add(taperedTube([[-0.27, -0.24, 0.2 * s], [-0.38, -0.29, 0.2 * s], [-0.5, -0.3, 0.2 * s]], limb(0.058, 0.06, 0.04), 10, 12), 'shoe')
    // ears
    const ear = new THREE.SphereGeometry(0.035, 10, 8)
    ear.scale(0.6, 1, 0.5)
    ear.translate(0.63, 0.83, 0.14 * s)
    add(ear, 'skin')
  }

  // head: slightly long oval
  const head = new THREE.SphereGeometry(0.15, 28, 22)
  head.scale(1.05, 1.12, 0.95)
  head.translate(0.65, 0.84, 0)
  add(head, 'skin')
  // face, three-quarters: nose, eyes, brows, a hint of a determined mouth
  const nose = new THREE.SphereGeometry(0.026, 12, 10)
  nose.scale(1.3, 1, 0.8)
  nose.translate(0.815, 0.835, 0)
  add(nose, 'skin')
  for (const s of [1, -1]) {
    const eye = new THREE.SphereGeometry(0.019, 10, 8)
    eye.scale(0.6, 1, 1)
    eye.translate(0.79, 0.87, 0.058 * s)
    add(eye, 'hair')
    add(taperedTube([[0.79, 0.905, 0.025 * s], [0.795, 0.912, 0.058 * s], [0.785, 0.902, 0.085 * s]], () => 0.009, 6, 4), 'hair')
  }
  add(taperedTube([[0.795, 0.79, -0.035], [0.8, 0.787, 0], [0.795, 0.79, 0.035]], () => 0.006, 6, 4), 'hair')

  // hair: a full messy cap plus short wind-swept tufts, all blown back
  const cap = new THREE.SphereGeometry(0.162, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.6)
  cap.rotateZ(0.45)
  cap.scale(1.08, 1.12, 1.04)
  cap.translate(0.62, 0.865, 0)
  add(cap, 'hair')
  const rnd = mulberry(21)
  const zAxis = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i < 90; i++) {
    const th = rnd() * Math.PI * 0.55
    const ph = rnd() * Math.PI * 2
    const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyAxisAngle(zAxis, 0.5)
    if (dir.x > 0.55) continue // keep the face clear
    const root = new THREE.Vector3(0.63, 0.86, 0).addScaledVector(dir, 0.15)
    const len = 0.05 + rnd() * 0.08
    const tip = root
      .clone()
      .addScaledVector(dir, len * 0.4)
      .add(new THREE.Vector3(-len, len * 0.15 * (rnd() - 0.3), (rnd() - 0.5) * 0.06))
    const mid = root.clone().lerp(tip, 0.5).addScaledVector(dir, 0.04)
    add(taperedTube([root.toArray() as V3, mid.toArray() as V3, tip.toArray() as V3], (u) => 0.036 * (1 - u) + 0.004, 6, 6), 'hair')
  }

  // merge per material: a handful of draw calls for the whole rider
  const byMat = new Map<Part, THREE.BufferGeometry[]>()
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo
    // mergeGeometries needs identical attribute sets
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
    byMat.set(p.mat, [...(byMat.get(p.mat) ?? []), g])
  }
  const merged = new Map<Part, THREE.BufferGeometry>()
  byMat.forEach((list, k) => merged.set(k, mergeGeometries(list)!))
  return merged
}

export function Wizard({ animate }: { animate: boolean }) {
  const rig = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const broom = useMemo(buildBroom, [])
  const rider = useMemo(buildRider, [])

  const mats = useMemo(() => {
    const scarf = scarfTexture()
    const scarfTail = scarf.clone()
    scarfTail.repeat.set(3, 1)
    return {
      robe: rimMaterial(INK, { rimStrength: 0.75, roughness: 0.8 }),
      trousers: rimMaterial('#14111a', { rimStrength: 0.45 }),
      shoe: rimMaterial('#0c0a0d', { rimStrength: 0.6, roughness: 0.35 }),
      skin: rimMaterial(SKIN, { rim: '#ffdcb0', rimStrength: 0.35, roughness: 0.6 }),
      hair: rimMaterial('#22130b', { rimStrength: 0.45, roughness: 0.9 }),
      shirt: rimMaterial('#ece6da', { rimStrength: 0.2 }),
      wood: rimMaterial('#5e3a1c', { rimStrength: 0.9, roughness: 0.28, metalness: 0.1 }),
      twig: rimMaterial('#b48a50', { rimStrength: 0.7, roughness: 0.9 }),
      gold: rimMaterial('#e0b354', { rimStrength: 0.6, roughness: 0.25, metalness: 1 }),
      scarfWrap: rimMaterial('#ffffff', { map: scarf, rimStrength: 0.4, roughness: 0.9 }),
      cape: clothMaterial(INK, 1.9, { amp: 0.2, speed: 7, side: THREE.FrontSide, rimStrength: 0.18 }),
      lining: clothMaterial('#7a1019', 1.9, { amp: 0.2, speed: 7, side: THREE.BackSide, rimStrength: 0.12 }),
      panel: clothMaterial(INK, 0.95, { amp: 0.1, speed: 9, rimStrength: 0.2 }),
      scarfTail: clothMaterial('#ffffff', 1.05, { amp: 0.09, speed: 12, map: scarfTail, rimStrength: 0.12 }),
    }
  }, [])

  const cloth = useMemo(
    () => ({
      cape: clothSheet(1.9, 0.72, 0.35, 36, 10),
      panel: clothSheet(0.95, 0.34, 0.1, 18, 6),
      scarf: clothSheet(1.05, 0.1, 0, 22, 2),
    }),
    [],
  )

  const sparks = useMemo(() => {
    const rnd = mulberry(77)
    const n = 90
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -2.4 - rnd() * 0.2
      pos[i * 3 + 1] = (rnd() - 0.5) * 0.4
      pos[i * 3 + 2] = (rnd() - 0.5) * 0.4
      seed[i] = rnd()
    }
    return { pos, seed, uniforms: { uTime: { value: 0 } } }
  }, [])

  useFrame(({ clock }, dt) => {
    const t = animate ? clock.elapsedTime : 0
    clothTime.value = t
    sparks.uniforms.uTime.value = t
    const g = rig.current
    if (g) {
      // bank into the wand, nose dips and lifts with a flying rhythm, gentle bob
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.x * 0.3 + Math.sin(t * 1.3) * 0.05, 2.5, dt)
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, pointer.y * 0.2 + Math.sin(t * 0.9) * 0.05, 2.5, dt)
      g.position.y = Math.sin(t * 1.6) * 0.07
    }
    // the rider glances towards the wand
    if (headRef.current) headRef.current.rotation.y = THREE.MathUtils.damp(headRef.current.rotation.y, pointer.x * 0.25, 3, dt)
  })

  const skin = rider.get('skin')
  const hair = rider.get('hair')
  return (
    <group ref={rig}>
      {/* his own light: warm key from the front, cool rim from behind */}
      <pointLight position={[1.6, 1.3, 1.8]} intensity={3} distance={7} color="#fff4e6" />
      <pointLight position={[-1.4, 1.6, -1.6]} intensity={7} distance={7} color="#7fb6ff" />

      {/* broom */}
      <mesh geometry={broom.handle} material={mats.wood} />
      <mesh geometry={broom.tail} material={mats.twig} />
      {[-1.5, -1.58, -1.66].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.gold}>
          <torusGeometry args={[0.062, 0.016, 10, 28]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.4, -0.33, 0.2 * s]} material={mats.gold}>
          <boxGeometry args={[0.2, 0.02, 0.07]} />
        </mesh>
      ))}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparks.pos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[sparks.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial vertexShader={sparkVert} fragmentShader={sparkFrag} uniforms={sparks.uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* rider */}
      {(['robe', 'trousers', 'shoe', 'shirt'] as const).map((k) => {
        const geo = rider.get(k)
        return geo ? <mesh key={k} geometry={geo} material={mats[k]} /> : null
      })}
      <group ref={headRef} position={[0.63, 0.84, 0]}>
        <group position={[-0.63, -0.84, 0]}>
          {skin && <mesh geometry={skin} material={mats.skin} />}
          {hair && <mesh geometry={hair} material={mats.hair} />}
        </group>
      </group>

      {/* scarf: a wrap at the neck and a striped tail streaming back */}
      <mesh position={[0.52, 0.68, 0]} rotation={[0, 0, -0.75]} material={mats.scarfWrap}>
        <torusGeometry args={[0.1, 0.045, 12, 28]} />
      </mesh>
      <mesh geometry={cloth.scarf} material={mats.scarfTail} position={[0.47, 0.7, 0.06]} rotation={[0.2, 0.1, 0.12]} />

      {/* cape from the shoulders: ink outside, scarlet lining inside */}
      <group position={[0.46, 0.64, 0]} rotation={[0, 0, 0.1]}>
        <mesh geometry={cloth.cape} material={mats.cape} />
        <mesh geometry={cloth.cape} material={mats.lining} />
      </group>
      {/* robe panels falling either side of the broom */}
      {[1, -1].map((s) => (
        <mesh key={s} geometry={cloth.panel} material={mats.panel} position={[0.08, 0.04, 0.17 * s]} rotation={[s * 1.15, 0, 0.18]} />
      ))}
    </group>
  )
}
