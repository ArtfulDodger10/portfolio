// Shared, non-React state the 3D scene reads every frame.
// Written by DOM listeners, read inside useFrame, so scrolling never re-renders React.

// How far the camera travels down the tower between the top and bottom of the page.
export const DEPTH = 72

export const scroll = { progress: 0 }
export const pointer = { x: 0, y: 0 }

export type Tier = { low: boolean; reducedMotion: boolean; maxDpr: number }

export function detectTier(): Tier {
  const narrow = window.matchMedia('(max-width: 768px)').matches
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const low = narrow || fewCores
  return { low, reducedMotion, maxDpr: low ? 1.25 : 1.75 }
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// `active` is false until the wand (mouse) or a tilt has been seen, so nothing reacts to a stale centre point.
export const wand = { active: false }

export function bindScrollAndPointer(): () => void {
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    scroll.progress = max > 0 ? window.scrollY / max : 0
  }
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    wand.active = true
  }
  // phones: tilting the device moves the "wand" (camera parallax, candles, mist)
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return
    pointer.x = Math.max(-1, Math.min(1, e.gamma / 25))
    pointer.y = Math.max(-1, Math.min(1, -(e.beta - 45) / 25))
    wand.active = true
  }
  // iOS only reports tilt after the visitor allows it, and only from a tap
  const askTilt = () => {
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof DOE?.requestPermission === 'function') DOE.requestPermission().catch(() => {})
    window.removeEventListener('touchend', askTilt)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('deviceorientation', onTilt)
  window.addEventListener('touchend', askTilt)
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('deviceorientation', onTilt)
    window.removeEventListener('touchend', askTilt)
  }
}

// Where the crest is on screen (written by the scene every frame) and whether the wand is over it.
export const crest = { x: -1, y: -1, r: 0, hover: false, flashAt: -10 }

// The sky follows the visitor's local time: night, dawn, day (a deep twilight, the text stays readable), dusk.
export type Sky = { name: 'night' | 'dawn' | 'day' | 'dusk'; bg: string; stars: number; ambient: number; sun: string; label: string }
export function skyNow(hour = new Date().getHours()): Sky {
  if (hour >= 21 || hour < 5) return { name: 'night', bg: '#07060b', stars: 1, ambient: 0.18, sun: '#ffd9a0', label: 'Night at the castle' }
  if (hour < 8) return { name: 'dawn', bg: '#151226', stars: 0.55, ambient: 0.24, sun: '#ffc7a0', label: 'Dawn over the castle' }
  if (hour < 17) return { name: 'day', bg: '#101a2c', stars: 0.3, ambient: 0.3, sun: '#fff2d6', label: 'Daylight at the castle' }
  return { name: 'dusk', bg: '#1a0f1c', stars: 0.65, ambient: 0.22, sun: '#ff9a6a', label: 'Dusk at the castle' }
}

// Dementors wander the castle. They pay a visit now and then wherever the visitor is, hover at the edges
// of the screen, and drift off on their own after a while, or at once when a Patronus is cast.
// Timings are deliberately slow so they stay an occasional surprise, not a nuisance.
type Phase = 'away' | 'present' | 'leaving'
const now = () => performance.now() / 1000

export const dementors = {
  phase: 'away' as Phase,
  since: 0, // when the current phase started (seconds, performance clock)
  nextVisit: 35, // first visit ~35 s after the page opens
  stay: 40, // a visit lasts this long unless repelled
  cold: 0, // 0..1, written by the scene, drives the frost and the candles
  set(phase: Phase) {
    this.phase = phase
    this.since = now()
    window.dispatchEvent(new CustomEvent('dementors', { detail: phase }))
  },
  // a Patronus: they flee and stay away for 2-3 minutes. Returns whether any were here to repel.
  repel(): boolean {
    const here = this.phase === 'present'
    if (here) this.set('leaving')
    this.nextVisit = Math.max(this.nextVisit, now() + 120 + Math.random() * 60)
    return here
  },
  // called every frame by the scene
  tick() {
    const t = now()
    if (this.phase === 'away' && t >= this.nextVisit) this.set('present')
    else if (this.phase === 'present' && t - this.since > this.stay) {
      this.set('leaving')
      this.nextVisit = t + 90 + Math.random() * 60
    } else if (this.phase === 'leaving' && t - this.since > 3) this.set('away')
  },
}
