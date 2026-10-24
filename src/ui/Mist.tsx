import { useEffect, useRef } from 'react'
import { pointer, wand } from '../scene/state'

// Low mist drifting along the bottom of the screen, between the 3D scene and the text.
// It parts around the wand (mouse, or tilt on phones) and closes again behind it.

type Puff = { x: number; y: number; r: number; speed: number; ox: number; oy: number; phase: number }

export function Mist({ low }: { low: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const phone = window.matchMedia('(max-width: 860px)').matches
    let W = 0
    let H = 0
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 1.5)
      W = innerWidth
      H = Math.round(innerHeight * (phone ? 0.2 : 0.34))
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    // one soft cloud sprite, stamped many times
    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 128
    const g = sprite.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(190,205,230,0.55)')
    grad.addColorStop(0.5, 'rgba(160,175,205,0.22)')
    grad.addColorStop(1, 'rgba(140,160,190,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)

    const n = phone ? 10 : low ? 14 : 26
    const puffs: Puff[] = Array.from({ length: n }, (_, i) => ({
      x: (i / n) * (W + 300) - 150,
      y: H * (0.45 + Math.random() * 0.55),
      r: 90 + Math.random() * 120,
      speed: 6 + Math.random() * 10,
      ox: 0,
      oy: 0,
      phase: Math.random() * 6,
    }))

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, W, H)
      // the wand in this canvas's coordinates
      const wx = ((pointer.x + 1) / 2) * W
      const wy = ((1 - pointer.y) / 2) * innerHeight - (innerHeight - H)
      for (const p of puffs) {
        if (!calm) {
          p.x += p.speed * dt
          if (p.x - p.r > W + 40) p.x = -p.r - 40
        }
        // push away from the wand, ease back when it leaves
        let tx = 0
        let ty = 0
        if (wand.active) {
          const dx = p.x - wx
          const dy = p.y - wy
          const d = Math.hypot(dx, dy)
          const reach = p.r + 120
          if (d < reach) {
            const k = (1 - d / reach) * 140
            tx = (dx / (d || 1)) * k
            ty = (dy / (d || 1)) * k * 0.6
          }
        }
        p.ox += (tx - p.ox) * Math.min(1, dt * 4)
        p.oy += (ty - p.oy) * Math.min(1, dt * 4)
        const wob = calm ? 0 : Math.sin(now / 1800 + p.phase) * 8
        const s = p.r * 2
        ctx.globalAlpha = phone ? 0.28 : 0.5
        ctx.drawImage(sprite, p.x + p.ox - p.r, p.y + p.oy + wob - p.r * 0.6, s, s * 0.6)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [low])

  return <canvas ref={ref} className="mist" aria-hidden />
}
