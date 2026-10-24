import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry } from './rng'

// Rising gold and scarlet sparks. All motion happens in the vertex shader.

const vert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vSeed;
  varying float vLife;
  void main() {
    vSeed = aSeed;
    vec3 p = position;
    float speed = 0.25 + aSeed * 0.5;
    float span = 90.0;
    float y = mod(p.y + uTime * speed + 76.0, span) - 76.0;
    p.y = y;
    p.x += sin(uTime * 0.6 + aSeed * 30.0) * 0.6;
    p.z += cos(uTime * 0.5 + aSeed * 17.0) * 0.4;
    vLife = fract((y + 76.0) / span);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (6.0 + aSeed * 10.0) * uPixelRatio / -mv.z;
  }
`

const frag = /* glsl */ `
  varying float vSeed;
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 gold = vec3(1.0, 0.78, 0.35);
    vec3 scarlet = vec3(0.95, 0.22, 0.12);
    vec3 col = mix(gold, scarlet, step(0.7, vSeed));
    float fade = smoothstep(0.0, 0.1, vLife) * smoothstep(1.0, 0.75, vLife);
    gl_FragColor = vec4(col * 1.6, a * fade * 0.9);
  }
`

export function Embers({ count, animate }: { count: number; animate: boolean }) {
  const { pos, seed } = useMemo(() => {
    const rnd = mulberry(42)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * 24
      pos[i * 3 + 1] = rnd() * 90 - 76
      pos[i * 3 + 2] = -rnd() * 16 + 2
      seed[i] = rnd()
    }
    return { pos, seed }
  }, [count])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } }),
    [],
  )

  useFrame(({ clock }) => {
    if (animate) uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
