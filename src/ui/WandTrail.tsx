import { useEffect, useRef } from 'react'

// The mouse is a wand: the arrow is hidden and a wooden wand follows the pointer with its tip on the
// exact click point. The tip glows (brighter over anything clickable), gold sparks trail behind it,
// and a click flicks the wand and throws a burst of sparks. Mouse/pen only; off for touch.
// Reduced motion keeps the wand but drops the sparks and the flick.

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number }

const CLICKABLE = 'a, button, [role="button"], input, select, textarea, label, .door, .cell a, .snitch'

export function WandTrail() {
  const ref = useRef<HTMLCanvasElement>(null)
  const wand = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = ref.current
    const w = wand.current
    if (!fine || !canvas || !w) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    document.documentElement.classList.add('wand-cursor')

    const sparks: Spark[] = []
    let raf = 0
    let last = { x: -1, y: -1 }
    // the wand trails the pointer by a hair, and tilts with the direction of travel
    const pos = { x: innerWidth / 2, y: innerHeight / 2, tilt: 0, flick: 0 }
    let target = { x: pos.x, y: pos.y }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const spray = (x: number, y: number, n: number, speed: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const v = Math.random() * speed
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v + (speed < 1 ? 0.3 : 0),
          life: 1,
          size: Math.random() * 2.2 + 0.6,
          hue: 38 + Math.random() * 14,
        })
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target = { x: e.clientX, y: e.clientY }
      w.style.opacity = '1'
      const hot = (e.target as Element | null)?.closest?.(CLICKABLE)
      w.classList.toggle('is-hot', !!hot)
      if (!calm) {
        const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y)
        spray(e.clientX, e.clientY, Math.min(4, 1 + Math.floor(dist / 12)), 0.6)
      }
      pos.tilt = Math.max(-14, Math.min(14, (e.clientX - last.x) * 0.6))
      last = { x: e.clientX, y: e.clientY }
      if (sparks.length > 260) sparks.splice(0, sparks.length - 260)
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      if (!calm) {
        pos.flick = 1
        spray(e.clientX, e.clientY, 26, 4)
      }
    }
    const onLeave = () => (w.style.opacity = '0')

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.55
      pos.y += (target.y - pos.y) * 0.55
      pos.flick *= 0.82
      pos.tilt *= 0.9
      // the tip of the SVG is its top-left corner, so the element sits exactly on the pointer
      w.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.tilt - pos.flick * 22}deg)`

      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx
        s.y += s.vy
        s.vx *= 0.96
        s.vy = s.vy * 0.96 + 0.03
        s.life -= 0.022
        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.fillStyle = `hsla(${s.hue}, 95%, ${55 + s.life * 30}%, ${s.life})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('wand-cursor')
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <>
      <canvas ref={ref} className="wand-trail" aria-hidden />
      <div ref={wand} className="wand" aria-hidden>
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8a5a34" />
              <stop offset="0.55" stopColor="#5a3418" />
              <stop offset="1" stopColor="#3a200e" />
            </linearGradient>
          </defs>
          {/* shaft: thin at the tip (top-left), thicker towards the handle */}
          <path d="M0 0 L 80 71 Q 79 78 71 80 Z" fill="url(#wood)" />
          <path d="M1 1 L 78 74" stroke="#b07a48" strokeWidth="0.8" opacity="0.6" />
          {/* handle with carved rings */}
          <path d="M70 72 Q 76 66 82 72 L 112 104 Q 116 112 108 114 L 100 112 L 70 82 Q 64 78 70 72 Z" fill="#3b2110" />
          <path d="M74 70 L 84 80 M 86 82 L 92 88 M 98 94 L 104 100" stroke="#c9a26b" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="108" cy="108" r="4.5" fill="#2a160a" stroke="#c9a26b" strokeWidth="1.2" />
        </svg>
        <span className="wand-tip" />
      </div>
    </>
  )
}
