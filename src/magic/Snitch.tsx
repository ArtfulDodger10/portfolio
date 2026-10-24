import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { snitch as copy } from '../content/site'
import { sendOwl } from './Owls'
import { useSpells } from './Spells'

// The Golden Snitch: two minutes after the visitor enters the castle (and every two minutes after that)
// it zips across the screen for a few seconds, darting, hovering for a heartbeat, changing direction.
// Click (or tap) it to catch it: +150 points.
// It is a real button, so keyboard users can catch it too. Off in Muggle mode and while paused.

const EVERY = 120 // seconds between flights (and before the first one)
const FLIGHT = 7.5 // seconds on screen

export function GoldenSnitch({ paused }: { paused: boolean }) {
  const [flying, setFlying] = useState(false)
  const [caught, setCaught] = useState(false)
  const el = useRef<HTMLButtonElement>(null)
  const announced = useRef(false)
  const catches = useRef(0)
  const { award } = useSpells()

  // dev only: window.__snitchNow() releases it at once, for testing the catch
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as { __snitchNow?: () => void }).__snitchNow = () => {
      setCaught(false)
      setFlying(true)
    }
  }, [])

  // the clock only runs while the castle is open (not during the letter or a case page)
  useEffect(() => {
    if (paused || flying) return
    const t = setTimeout(() => {
      setCaught(false)
      setFlying(true)
    }, EVERY * 1000)
    return () => clearTimeout(t)
  }, [paused, flying])

  // the flight: darts between random targets, with short hovers, then away off-screen
  useEffect(() => {
    if (!flying) return
    const b = el.current
    if (!b) return
    if (!announced.current) {
      announced.current = true
      sendOwl(copy.owl)
    }
    const W = innerWidth
    const H = innerHeight
    const p = { x: Math.random() < 0.5 ? -40 : W + 40, y: H * (0.2 + Math.random() * 0.5), vx: 0, vy: 0 }
    let target = { x: W * (0.2 + Math.random() * 0.6), y: H * (0.15 + Math.random() * 0.6) }
    let nextTurn = 0
    let hoverUntil = 0
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      if (t > nextTurn) {
        // pick a new dart; sometimes stop dead and hover, like it is looking around
        nextTurn = t + 0.45 + Math.random() * 0.6
        if (Math.random() < 0.25) hoverUntil = t + 0.35
        target =
          t > FLIGHT - 1.2
            ? { x: p.x < W / 2 ? -80 : W + 80, y: H * Math.random() * 0.4 } // escape
            : { x: W * (0.08 + Math.random() * 0.84), y: H * (0.12 + Math.random() * 0.7) }
      }
      const pull = t < hoverUntil ? 0.02 : 0.09
      p.vx = p.vx * 0.82 + (target.x - p.x) * pull
      p.vy = p.vy * 0.82 + (target.y - p.y) * pull
      p.x += p.vx
      p.y += p.vy + (t < hoverUntil ? Math.sin(t * 30) * 0.6 : 0)
      const tilt = Math.max(-25, Math.min(25, p.vx * 1.5))
      b.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${tilt}deg)`
      if (t < FLIGHT) raf = requestAnimationFrame(tick)
      else setFlying(false)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [flying])

  const catchIt = (e: MouseEvent) => {
    e.stopPropagation()
    if (caught) return
    setCaught(true)
    catches.current += 1
    award(`snitch-${catches.current}`, copy.points, copy.reason)
    setTimeout(() => setFlying(false), 900)
  }

  if (!flying || paused) return null
  return (
    <button ref={el} className={`snitch ${caught ? 'is-caught' : ''}`} onClick={catchIt} aria-label={copy.label}>
      <span className="snitch-wing snitch-wing-l" />
      <span className="snitch-ball" />
      <span className="snitch-wing snitch-wing-r" />
    </button>
  )
}
