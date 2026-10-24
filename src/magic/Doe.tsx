import { useEffect, useRef } from 'react'

// The Patronus: a silver doe made of light, in the style of the films' Patronuses.
// - body: a smooth luminous silhouette (white core, blue glow), legs swinging from the hips
// - trail: a dense comet of tiny electric-blue sparks streaming off its back and drifting away
// - motion: it never stops. It bursts from the wand and gallops one long winding path around the whole
//   screen (a smooth spline through waypoints, constant speed), bounding the whole way: the leaps are tied
//   to distance travelled, it turns to face where it is going, and it finally runs off the edge.
// Plain 2D canvas, additive blending.

const DURATION = 7.5 // seconds from the wand to off-screen

// Catmull-Rom spline through waypoints, sampled densely with cumulative length (for constant speed)
function buildPath(pts: [number, number][]) {
  const out: { x: number; y: number; d: number }[] = []
  let d = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    for (let j = 0; j < 60; j++) {
      const t = j / 60
      const t2 = t * t
      const t3 = t2 * t
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      const last = out[out.length - 1]
      if (last) d += Math.hypot(x - last.x, y - last.y)
      out.push({ x, y, d })
    }
  }
  return out
}

// silhouette in a 200 x 150 box, facing right (body centre ~ 110, 75)
const TORSO = [
  'M50 62 Q 60 46 95 48 Q 125 46 135 56 Q 138 70 125 76 Q 95 82 62 76 Q 48 72 50 62 Z',
  'M120 54 Q 132 38 145 26 L 154 31 Q 143 45 136 62 Z',
  'M142 25 Q 150 14 160 17 Q 172 23 177 33 Q 171 36 161 32 Q 151 32 144 30 Z',
  'M147 19 Q 140 5 149 0 Q 154 8 152 18 Z',
  'M153 18 Q 157 4 166 4 Q 162 12 157 20 Z',
  'M52 58 Q 43 50 45 45 Q 52 49 57 56 Z',
]
const FRONT = 'M0 0 L 2 26 L -1 52 L 2.5 52 L 5.5 26 L 4 0 Z'
const HIND = 'M0 0 L -5 26 L 1 52 L 4.5 52 L -1.5 26 L 5 0 Z'
const LEGS = [
  { d: HIND, x: 58, front: false, far: true },
  { d: FRONT, x: 118, front: true, far: true },
  { d: HIND, x: 66, front: false, far: false },
  { d: FRONT, x: 124, front: true, far: false },
]

type Spark = { x: number; y: number; vx: number; vy: number; life: number; ttl: number; r: number; hot: boolean }

// points inside the body, used as emitters for the trail (rear half weighted)
function bodyPoints(): { x: number; y: number }[] {
  const c = document.createElement('canvas')
  c.width = 200
  c.height = 150
  const g = c.getContext('2d', { willReadFrequently: true })!
  TORSO.forEach((d) => g.fill(new Path2D(d)))
  const { data } = g.getImageData(0, 0, 200, 150)
  const pts: { x: number; y: number }[] = []
  for (let y = 0; y < 150; y += 2)
    for (let x = 0; x < 200; x += 2)
      if (data[(y * 200 + x) * 4 + 3] > 128 && (x < 120 || Math.random() < 0.25)) pts.push({ x, y })
  return pts
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k
const smooth = (x: number) => x * x * (3 - 2 * x)

export function PatronusDoe({ originX, originY }: { originX?: number; originY?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(devicePixelRatio, 2)
    const W = innerWidth
    const H = innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr

    const torso = new Path2D()
    TORSO.forEach((d) => torso.addPath(new Path2D(d)))
    const legs = LEGS.map((l) => {
      const p = new Path2D()
      p.addPath(new Path2D(l.d), new DOMMatrix().translate(l.x, 70))
      return { ...l, path: p, hip: { x: l.x + 2, y: 72 } }
    })
    const emitters = bodyPoints()

    const ox = originX ?? W * 0.85
    const oy = originY ?? H * 0.85
    // a winding tour of the screen; mirrored when cast from the left so it always heads away from the wand
    const flip = ox < W / 2
    const fx = (u: number) => (flip ? 1 - u : u) * W
    // two swings: across to the far side, then back and out past the edge it came from
    const path = buildPath([
      [ox, oy],
      [fx(0.55), H * 0.34],
      [fx(0.15), H * 0.48],
      [fx(0.32), H * 0.72],
      [fx(0.7), H * 0.56],
      [fx(0.92), H * 0.32],
      [fx(1.3), H * 0.22],
    ])
    const total = path[path.length - 1].d
    const baseSize = Math.min(2.2, Math.max(1.05, Math.min(W, H * 1.4) / 600))
    const stride = 150 * baseSize // one bound per this many pixels travelled
    const leapH = Math.min(60, H * 0.075)
    let face = flip ? 1 : -1 // +1 faces right; turns smoothly when the path changes direction
    let seg = 0
    let lastT = 0

    const sparks: Spark[] = []
    const start = performance.now()
    let prevX = ox
    let prevY = oy
    let raf = 0

    const tick = (now: number) => {
      // dev only: window.__doeT = 2 freezes the run at that second, for checking poses in screenshots
      const frozen = import.meta.env.DEV ? (window as { __doeT?: number }).__doeT : undefined
      const t = frozen ?? (now - start) / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      // ---- where the doe is: always moving along the path ----
      const k = Math.min(1, t / DURATION)
      const dist = total * (k * 0.85 + smooth(k) * 0.15)
      while (seg < path.length - 2 && path[seg + 1].d < dist) seg++
      while (seg > 0 && path[seg].d > dist) seg--
      const a = path[seg]
      const b = path[seg + 1]
      const f = b.d > a.d ? (dist - a.d) / (b.d - a.d) : 0
      const px = mix(a.x, b.x, f)
      const py = mix(a.y, b.y, f)
      const vx = b.x - a.x
      const vy = b.y - a.y
      const dt = Math.max(0, Math.min(0.05, t - lastT))
      lastT = t
      if (Math.abs(vx) > 0.4) face += (Math.sign(vx) - face) * Math.min(1, dt * 5)

      const ph = (dist / stride) % 1 // gallop phase follows the ground covered
      const bound = Math.sin(Math.PI * ph)
      const x = px
      const y = py - bound * leapH
      const appear = smooth(Math.min(1, t / 0.6))
      const vis = appear * smooth(Math.min(1, (DURATION - t) / 0.8 + 0.001))
      // a touch of depth: it swells and shrinks as it sweeps around
      const size = baseSize * mix(0.4, 1, appear) * (0.92 + 0.14 * Math.sin(k * Math.PI * 3))
      const slope = Math.atan2(vy, Math.abs(vx) + 0.001) * 0.5
      const pitch = (slope + (ph - 0.5) * 0.4) * Math.sign(face || 1)
      const frontA = mix(0.45, -0.95, bound)
      const hindA = mix(-0.55, 0.9, bound)
      const m = new DOMMatrix()
        .translate(x, y)
        .rotate((pitch * 180) / Math.PI)
        .scale(size * face, size)
        .translate(-110, -75)

      // ---- the trail: tiny sparks streaming off the back ----
      const dx = x - prevX
      const dy = y - prevY
      prevX = x
      prevY = y
      const emit = Math.round(190 * vis + 40 * (1 - appear))
      for (let i = 0; i < emit; i++) {
        const e = emitters[(Math.random() * emitters.length) | 0]
        const p = m.transformPoint(new DOMPoint(e.x + (Math.random() - 0.5) * 6, e.y + (Math.random() - 0.5) * 6))
        sparks.push({
          x: p.x,
          y: p.y,
          vx: -dx * (0.2 + Math.random() * 0.35) + (Math.random() - 0.5) * 0.8,
          vy: -dy * (0.2 + Math.random() * 0.35) + (Math.random() - 0.6) * 0.7,
          life: 0,
          ttl: 0.9 + Math.random() * 1.3,
          r: 0.6 + Math.random() * 1.6,
          hot: Math.random() < 0.12,
        })
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += 1 / 60
        if (s.life > s.ttl) {
          sparks.splice(i, 1)
          continue
        }
        // drift with a little curl so the trail looks like smoke, not lines
        s.vx += Math.sin(s.y * 0.03 + t * 2.2) * 0.04
        s.vy += Math.cos(s.x * 0.025 + t * 1.7) * 0.04 - 0.004
        s.vx *= 0.985
        s.vy *= 0.985
        s.x += s.vx
        s.y += s.vy
        const q = 1 - s.life / s.ttl
        // young sparks are white-hot, older ones cool to electric blue
        const c = s.hot || q > 0.82 ? '235,246,255' : q > 0.5 ? '120,185,255' : '45,115,255'
        ctx.fillStyle = `rgba(${c},${(q * (s.hot ? 1 : 0.75)).toFixed(3)})`
        const r = s.r * (s.hot ? 1.6 : 1)
        ctx.fillRect(s.x - r / 2, s.y - r / 2, r, r)
      }
      if (sparks.length > 8000) sparks.splice(0, sparks.length - 8000)

      // ---- the body: smooth light, a blue glow pass then a white core pass ----
      if (vis > 0.01) {
        const drawShape = (glow: boolean) => {
          ctx.save()
          ctx.setTransform(m.a * dpr, m.b * dpr, m.c * dpr, m.d * dpr, m.e * dpr, m.f * dpr)
          const grad = ctx.createLinearGradient(0, 0, 0, 130)
          grad.addColorStop(0, glow ? 'rgba(120,190,255,0.55)' : 'rgba(255,255,255,0.95)')
          grad.addColorStop(1, glow ? 'rgba(60,130,255,0.35)' : 'rgba(170,215,255,0.8)')
          ctx.fillStyle = grad
          ctx.shadowColor = glow ? 'rgba(90,170,255,0.95)' : 'rgba(200,230,255,0.9)'
          ctx.shadowBlur = (glow ? 34 : 10) * dpr
          for (const l of legs.filter((leg) => leg.far)) {
            ctx.save()
            ctx.globalAlpha = vis * 0.55
            ctx.translate(l.hip.x, l.hip.y)
            ctx.rotate((l.front ? frontA : hindA) * 0.85)
            ctx.translate(-l.hip.x, -l.hip.y)
            ctx.fill(l.path)
            ctx.restore()
          }
          ctx.globalAlpha = vis
          ctx.fill(torso)
          for (const l of legs.filter((leg) => !leg.far)) {
            ctx.save()
            ctx.translate(l.hip.x, l.hip.y)
            ctx.rotate(l.front ? frontA : hindA)
            ctx.translate(-l.hip.x, -l.hip.y)
            ctx.fill(l.path)
            ctx.restore()
          }
          ctx.restore()
        }
        ctx.globalCompositeOperation = 'lighter'
        drawShape(true)
        ctx.globalCompositeOperation = 'source-over'
        drawShape(false)
        ctx.globalCompositeOperation = 'lighter'
      }

      // the wand flash where it was cast
      if (t < 1) {
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 120)
        g.addColorStop(0, `rgba(230,245,255,${(1 - t) * 0.9})`)
        g.addColorStop(1, 'rgba(80,160,255,0)')
        ctx.fillStyle = g
        ctx.globalAlpha = 1
        ctx.fillRect(ox - 120, oy - 120, 240, 240)
      }
      ctx.globalAlpha = 1

      if (t < DURATION + 2 || frozen !== undefined) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [originX, originY])

  return <canvas ref={ref} className="patronus-canvas" aria-hidden />
}
