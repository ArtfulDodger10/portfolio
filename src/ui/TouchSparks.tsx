import { useEffect, useRef } from 'react'

// Phones and tablets get no wand cursor, so every tap throws a small burst of gold sparks instead.
// Touch only; off for reduced motion. One small canvas, idle (no animation frame) when there are no sparks.

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number }

export function TouchSparks() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const sparks: Spark[] = []
    let raf = 0

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx
        s.y += s.vy
        s.vx *= 0.94
        s.vy = s.vy * 0.94 + 0.05
        s.life -= 0.03
        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.fillStyle = `hsla(${s.hue}, 95%, ${55 + s.life * 30}%, ${s.life})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = sparks.length ? requestAnimationFrame(tick) : 0
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2
        const v = 1 + Math.random() * 3.5
        sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, size: 1 + Math.random() * 2.2, hue: 38 + Math.random() * 14 })
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return <canvas ref={ref} className="wand-trail" aria-hidden />
}
