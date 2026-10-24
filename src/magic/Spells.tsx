import { PatronusDoe } from './Doe'
import { chime, groan, setSoundEnabled, soundEnabled } from './sound'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

// One spell engine for the whole site. `cast(spell, origin, action)` writes the incantation,
// plays the spell's light and screen effect from where it was cast and runs the action mid-spell.
// House points: every visitor starts at 0; each distinct action earns its points once per visit,
// with a chime (or a groan when points are taken away).
// Reduced motion / Muggle mode: the action runs at once, no overlay; points still count.

export type Spell =
  | 'Lumos'
  | 'Nox'
  | 'Alohomora'
  | 'Colloportus'
  | 'Accio'
  | 'Evanesco'
  | 'Revelio'
  | 'Ascendio'
  | 'Expecto Patronum'
  | 'Avada Kedavra'

type Motion = 'burst' | 'converge' | 'rise' | 'smoke' | 'patronus'
type Veil = 'flash' | 'dark' | 'ring-out' | 'ring-in' | 'ink' | 'none'

// `hold`: how long the overlay stays after the action (ms); the doe needs time to cross
type SpellDef = { color: string; motion: Motion; veil: Veil; does: string; at: number; points: number; reason: string; hold?: number }

export const SPELLS: Record<Spell, SpellDef> = {
  Lumos: { color: '#ffe7a8', motion: 'burst', veil: 'flash', does: 'light returns', at: 380, points: 5, reason: 'for bringing the light back' },
  Nox: { color: '#9aa4c7', motion: 'smoke', veil: 'dark', does: 'the lights go out', at: 520, points: 5, reason: 'for trying Muggle mode' },
  Alohomora: { color: '#ffd166', motion: 'burst', veil: 'ring-out', does: 'unlocking', at: 420, points: 10, reason: 'for unlocking a case file' },
  Colloportus: { color: '#e0b354', motion: 'converge', veil: 'ring-in', does: 'sealing', at: 380, points: 2, reason: 'for locking up after yourself' },
  Accio: { color: '#ffc46b', motion: 'converge', veil: 'none', does: 'summoning', at: 520, points: 20, reason: 'for summoning the CV' },
  Evanesco: { color: '#cfc7d8', motion: 'smoke', veil: 'none', does: 'vanishing', at: 300, points: 5, reason: 'for a clean vanish' },
  Revelio: { color: '#f2b45a', motion: 'burst', veil: 'ink', does: 'revealing', at: 420, points: 10, reason: 'for finding the hidden room' },
  Ascendio: { color: '#ffdf8f', motion: 'rise', veil: 'none', does: 'rising', at: 260, points: 5, reason: 'for flying back up' },
  'Expecto Patronum': { color: '#dff3ff', motion: 'burst', veil: 'flash', does: 'a silver doe', at: 1000, points: 50, reason: 'for driving off the dementors', hold: 8000 },
  'Avada Kedavra': { color: '#5dff7a', motion: 'burst', veil: 'flash', does: 'unforgivable', at: 300, points: -50, reason: 'YARA hit: HP_Unforgivable_Curse (severity: critical)' },
}

type Casting = { spell: Spell; x: number; y: number; key: number }
type Origin = { clientX: number; clientY: number } | { x: number; y: number } | null | undefined
// `key` makes the award distinct per target (each case file pays once); `points`/`reason` override the spell's.
type CastOpts = { key?: string; points?: number; reason?: string }

type Ctx = {
  cast: (spell: Spell, origin: Origin, action?: () => void, opts?: CastOpts) => void
  award: (key: string, points: number, reason: string) => void
  points: number
  sound: boolean
  toggleSound: () => void
}

const SpellCtx = createContext<Ctx>({
  cast: (_s, _o, a) => a?.(),
  award: () => {},
  points: 0,
  sound: false,
  toggleSound: () => {},
})
export const useSpells = () => useContext(SpellCtx)

type Toast = { line: string; reason: string; bad: boolean; key: number }
type Floater = { id: number; x: number; y: number; text: string; bad: boolean }

export function SpellProvider({ quiet, children }: { quiet: boolean; children: ReactNode }) {
  const [casting, setCasting] = useState<Casting | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [points, setPoints] = useState(0)
  const paid = useRef<Set<string>>(new Set())
  const [floaters, setFloaters] = useState<Floater[]>([])
  // where the visitor last clicked or tapped: the "+N" rises from there
  const lastPointer = useRef({ x: innerWidth / 2, y: innerHeight / 2 })
  useEffect(() => {
    const on = (e: PointerEvent) => (lastPointer.current = { x: e.clientX, y: e.clientY })
    window.addEventListener('pointerdown', on, { capture: true, passive: true })
    return () => window.removeEventListener('pointerdown', on, { capture: true })
  }, [])
  const busy = useRef(false)
  const [sound, setSound] = useState(soundEnabled)
  const toggleSound = useCallback(() => {
    setSound((on) => {
      setSoundEnabled(!on)
      if (!on) chime()
      return !on
    })
  }, [])

  const award = useCallback((key: string, pts: number, reason: string, delay = 0) => {
    if (paid.current.has(key)) return
    paid.current.add(key)
    setTimeout(() => {
      setPoints((p) => p + pts)
      const bad = pts < 0
      const id = Date.now() + Math.random()
      const { x, y } = lastPointer.current
      setFloaters((f) => [...f, { id, x, y, text: bad ? `−${-pts}` : `+${pts}`, bad }])
      setTimeout(() => setFloaters((f) => f.filter((o) => o.id !== id)), 1600)
      setToast({
        line: bad ? `−${-pts} points from Gryffindor` : `+${pts} points to Gryffindor!`,
        reason,
        bad,
        key: Date.now(),
      })
      if (bad) groan()
      else chime(pts >= 50)
      // a small buzz on phones that support it (Android); silently ignored elsewhere
      if (window.matchMedia('(pointer: coarse)').matches && 'vibrate' in navigator && soundEnabled()) {
        navigator.vibrate(bad ? [40, 60, 40] : pts >= 50 ? [15, 40, 15, 40, 25] : 15)
      }
    }, delay)
  }, [])

  const cast = useCallback(
    (spell: Spell, origin: Origin, action?: () => void, opts: CastOpts = {}) => {
      const def = SPELLS[spell]
      const key = `${spell}:${opts.key ?? ''}`
      // Lumos is the way out of Muggle mode, so it is the one spell that still plays there.
      const calm =
        (quiet && spell !== 'Lumos') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (calm || busy.current) {
        action?.()
        award(key, opts.points ?? def.points, opts.reason ?? def.reason)
        return
      }
      const x = origin ? ('clientX' in origin ? origin.clientX : origin.x) : innerWidth / 2
      const y = origin ? ('clientY' in origin ? origin.clientY : origin.y) : innerHeight / 2
      busy.current = true
      setCasting({ spell, x, y, key: Date.now() })
      setTimeout(() => action?.(), def.at)
      setTimeout(() => {
        setCasting(null)
        busy.current = false
      }, def.at + (def.hold ?? 1000))
      award(key, opts.points ?? def.points, opts.reason ?? def.reason, def.at + 700)
    },
    [quiet, award],
  )

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <SpellCtx.Provider value={{ cast, award, points, sound, toggleSound }}>
      {children}
      {casting && <SpellOverlay {...casting} />}
      {floaters.map((f) => (
        <span key={f.id} className={`points-floater ${f.bad ? 'is-bad' : ''}`} style={{ left: f.x, top: f.y }} aria-hidden>
          {f.text}
        </span>
      ))}
      <div className="spell-toast-wrap" aria-live="polite">
        {toast && (
          <p key={toast.key} className={`spell-toast ${toast.bad ? 'is-bad' : ''}`}>
            <span className="toast-shield" aria-hidden />
            <strong>{toast.line}</strong>
            <small>{toast.reason}</small>
          </p>
        )}
      </div>
    </SpellCtx.Provider>
  )
}

function SpellOverlay({ spell, x, y }: Casting) {
  const ref = useRef<HTMLCanvasElement>(null)
  const s = SPELLS[spell]

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(devicePixelRatio, 2)
    canvas.width = innerWidth * dpr
    canvas.height = innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const parts = makeParticles(s.motion, x, y, spell === 'Avada Kedavra' ? ['#5dff7a', '#b6ffbf', '#2bd94f'] : spell === 'Expecto Patronum' ? ['#ffffff', '#cfe8ff', '#7fb8ff'] : undefined)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = s.motion === 'smoke' ? 'source-over' : 'lighter'
      for (const p of parts) {
        const life = 1 - (t - p.delay) / p.ttl
        if (t < p.delay || life <= 0) continue
        p.x += p.vx
        p.y += p.vy
        if (s.motion === 'converge') {
          p.vx += (x - p.x) * 0.012
          p.vy += (y - p.y) * 0.012
          p.vx *= 0.86
          p.vy *= 0.86
        } else if (s.motion === 'smoke') {
          p.vx *= 0.97
          p.vy = p.vy * 0.97 - 0.02
        } else if (s.motion === 'patronus') {
          p.a += 0.035
          p.x += Math.cos(p.a) * 2.2
          p.y += Math.sin(p.a * 1.3) * 1.4
        } else {
          p.vx *= 0.95
          p.vy *= 0.95
        }
        const r = s.motion === 'smoke' ? p.r * (2 - life) : p.r * life
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3)
        const alpha = s.motion === 'smoke' ? life * 0.22 : life
        g.addColorStop(0, hexA(p.color, alpha))
        g.addColorStop(1, hexA(p.color, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      if (t < 1.5) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [s, spell, x, y])

  const style = { '--x': `${x}px`, '--y': `${y}px`, '--c': s.color } as CSSProperties
  return (
    <div className={`spell-overlay veil-${s.veil}`} style={style} aria-hidden>
      <div className="spell-veil" />
      <canvas ref={ref} className="spell-canvas" />
      {spell === 'Expecto Patronum' && <PatronusDoe originX={x} originY={y} />}
      <p className="spell-word">
        {spell.split('').map((ch, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.035}s` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
        <small>{s.does}</small>
      </p>
    </div>
  )
}

type P = { x: number; y: number; vx: number; vy: number; r: number; ttl: number; delay: number; color: string; a: number }

function makeParticles(motion: Motion, x: number, y: number, tint?: string[]): P[] {
  const out: P[] = []
  const gold = ['#ffd98a', '#ffc46b', '#fff1c9', '#e0b354']
  const scarlet = ['#ff6b4a', '#c23a2b']
  const silver = ['#e8f6ff', '#bfe4ff', '#ffffff']
  const pick = (a: string[]) => a[(Math.random() * a.length) | 0]
  const W = innerWidth
  const H = innerHeight
  const n = motion === 'patronus' ? 260 : motion === 'smoke' ? 40 : 120
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2
    const sp = 2 + Math.random() * 9
    const p: P = { x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 1.5 + Math.random() * 3, ttl: 0.7 + Math.random() * 0.6, delay: Math.random() * 0.15, color: tint ? pick(tint) : pick(Math.random() < 0.8 ? gold : scarlet), a: 0 }
    if (motion === 'converge') {
      const edge = Math.random() * 4
      p.x = edge < 1 ? 0 : edge < 2 ? W : Math.random() * W
      p.y = edge < 1 || edge < 2 ? Math.random() * H : edge < 3 ? 0 : H
      p.vx = 0
      p.vy = 0
      p.delay = Math.random() * 0.25
    } else if (motion === 'rise') {
      p.x = Math.random() * W
      p.y = H + Math.random() * 60
      p.vx = 0
      p.vy = -(12 + Math.random() * 14)
      p.r = 1 + Math.random() * 2
    } else if (motion === 'smoke') {
      p.vx *= 0.35
      p.vy *= 0.35
      p.r = 10 + Math.random() * 18
      p.ttl = 1 + Math.random() * 0.4
      p.color = pick(['#bdb6c9', '#8f879c', '#d8d2e2'])
    } else if (motion === 'patronus') {
      p.x = -40 - Math.random() * 200
      p.y = H * (0.3 + Math.random() * 0.4)
      p.vx = 9 + Math.random() * 7
      p.vy = (Math.random() - 0.5) * 2
      p.a = Math.random() * 6
      p.ttl = 1.2 + Math.random() * 0.3
      p.delay = Math.random() * 0.3
      p.color = pick(silver)
    }
    out.push(p)
  }
  return out
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, a).toFixed(3)})`
}

// Type a spell anywhere on the page (outside inputs) to cast it.
export function useTypedSpells(handlers: Partial<Record<string, () => void>>) {
  useEffect(() => {
    let buf = ''
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-20)
      for (const word of Object.keys(handlers)) {
        if (buf.endsWith(word)) {
          buf = ''
          handlers[word]?.()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers])
}
