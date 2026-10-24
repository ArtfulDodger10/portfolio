import * as THREE from 'three'

// Building blocks for the broom rider (Wizard.tsx): smooth tapered tubes for limbs and twigs,
// a "gold-rim" material that gives every shape a glowing gold edge like the crest rings,
// and a cloth material whose vertices flutter in the wind (cape, robe, scarf).

type V3 = [number, number, number]

// A tube along a smooth curve whose radius follows radius(u), u = 0..1 along the curve.
export function taperedTube(points: V3[], radius: (u: number) => number, tubular = 24, radial = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const frames = curve.computeFrenetFrames(tubular, false)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular
    curve.getPointAt(u, p)
    const r = radius(u)
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(v)).addScaledVector(frames.binormals[i], Math.sin(v))
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r)
      uv.push(u, j / radial)
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j
      const b = a + radial + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// limb-like taper: radius a at the start, mid in the middle, b at the end, with rounded ends
export const limb = (a: number, mid: number, b: number) => (u: number) => {
  const r = u < 0.5 ? a + (mid - a) * u * 2 : mid + (b - mid) * (u - 0.5) * 2
  const cap = 0.35 + 0.65 * Math.min(1, Math.min(u, 1 - u) / 0.08)
  return r * Math.sqrt(cap)
}

// Standard PBR material plus a glowing gold rim (fresnel), so shapes read as sculpted light against the night.
export function rimMaterial(color: string, opts: { rim?: string; rimStrength?: number; roughness?: number; metalness?: number; map?: THREE.Texture; side?: THREE.Side } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.05,
    map: opts.map,
    side: opts.side ?? THREE.FrontSide,
  })
  const rim = new THREE.Color(opts.rim ?? '#ffcf6b')
  const strength = opts.rimStrength ?? 1
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: rim }
    shader.uniforms.uRimStrength = { value: strength }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim;\nuniform float uRimStrength;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 4.5);
        totalEmissiveRadiance += uRim * fres * uRimStrength;`,
      )
  }
  m.customProgramCacheKey = () => `rim-${opts.rim ?? 'gold'}-${strength}`
  return m
}

// Cloth: a sheet rooted along x = 0 and streaming to x = -len; flutters more towards the free end.
export const clothTime = { value: 0 }
export function clothMaterial(color: string, len: number, opts: { amp?: number; speed?: number; side?: THREE.Side; map?: THREE.Texture; rimStrength?: number } = {}) {
  const m = rimMaterial(color, { side: opts.side ?? THREE.DoubleSide, map: opts.map, roughness: 0.85, rimStrength: opts.rimStrength ?? 0.8 })
  const base = m.onBeforeCompile
  const amp = opts.amp ?? 0.12
  const speed = opts.speed ?? 8
  m.onBeforeCompile = (shader, renderer) => {
    base.call(m, shader, renderer)
    shader.uniforms.uTime = clothTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float k = clamp(-position.x / ${len.toFixed(3)}, 0.0, 1.0);
        float w = sin(position.x * 5.0 - uTime * ${speed.toFixed(2)} + position.z * 2.0);
        float w2 = sin(position.x * 9.0 - uTime * ${(speed * 1.6).toFixed(2)} + 1.3);
        transformed.y += (w * ${amp.toFixed(3)} + w2 * ${(amp * 0.35).toFixed(3)}) * k * k;
        transformed.z += cos(position.x * 4.0 - uTime * ${(speed * 0.8).toFixed(2)}) * ${(amp * 0.5).toFixed(3)} * k;`,
      )
  }
  m.customProgramCacheKey = () => `cloth-${color}-${len}-${amp}-${speed}-${opts.side ?? 2}`
  return m
}

// A cloth sheet: length along -x from the root, width along z, gently curved so it wraps a little.
export function clothSheet(len: number, width: number, curl = 0.25, segL = 24, segW = 8) {
  const g = new THREE.PlaneGeometry(len, width, segL, segW)
  g.translate(-len / 2, 0, 0)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i)
    // curl the edges downwards, like fabric falling over a back
    p.setY(i, p.getY(i) - (z * z) / (width * width) * curl * 2)
  }
  g.computeVertexNormals()
  return g
}

// striped Gryffindor scarf texture
export function scarfTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 16
  const g = c.getContext('2d')!
  const bands = ['#7d121c', '#7d121c', '#7d121c', '#d9a53a', '#7d121c', '#d9a53a']
  bands.forEach((col, i) => {
    g.fillStyle = col
    g.fillRect((i * 128) / bands.length, 0, 128 / bands.length + 1, 16)
  })
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}
