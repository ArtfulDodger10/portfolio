import { useEffect, useRef } from 'react'
import { caseFiles } from '../content/site'

// The Lumma C++ chain drawn as an inked map. The map writes itself as you scroll past it:
// the route inks in, footprints walk along it (and stop when you stop), and each stage's label
// appears as the feet reach it. Only infection stages are shown: no domains or IPs live on this page.
// Muggle mode / reduced motion: the whole map, already drawn.

const chain = caseFiles.find((c) => c.id === 'lumma')!.chain

// Hand-placed, slightly wandering node positions on a 1000 x 420 sheet.
const nodes = [
  { x: 90, y: 300 },
  { x: 290, y: 150 },
  { x: 500, y: 290 },
  { x: 710, y: 130 },
  { x: 900, y: 270 },
]

const path = nodes
  .map((n, i) => {
    if (i === 0) return `M ${n.x} ${n.y}`
    const p = nodes[i - 1]
    const cx = (p.x + n.x) / 2
    return `C ${cx} ${p.y}, ${cx} ${n.y}, ${n.x} ${n.y}`
  })
  .join(' ')

const STEPS = 8 // footprints visible behind the walker
const STEP = 22 // map units between prints

export function MaraudersMap() {
  const fig = useRef<HTMLElement>(null)
  const reveal = useRef<SVGPathElement>(null)
  const feet = useRef<(SVGUseElement | null)[]>([])
  const labels = useRef<(SVGGElement | null)[]>([])

  useEffect(() => {
    const el = fig.current
    const mask = reveal.current
    if (!el || !mask) return
    const L = mask.getTotalLength()
    // how far along the route each stage sits
    const stops = nodes.map((n) => {
      let best = 0
      let bestD = Infinity
      for (let s = 0; s <= L; s += 4) {
        const p = mask.getPointAtLength(s)
        const d = Math.hypot(p.x - n.x, p.y - n.y)
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
      return best
    })
    const still =
      document.documentElement.classList.contains('muggle') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    const draw = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = innerHeight
      // 0 when the map's top enters the lower part of the screen, 1 when it is well up the page
      const k = still ? 1 : Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.25)))
      const at = L * k
      mask.style.strokeDasharray = `${L}`
      mask.style.strokeDashoffset = `${L - at}`
      feet.current.forEach((f, i) => {
        if (!f) return
        const s = at - i * STEP
        if (s < 0 || k === 0) {
          f.style.opacity = '0'
          return
        }
        const p = mask.getPointAtLength(s)
        const q = mask.getPointAtLength(Math.min(L, s + 1))
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
        const side = i % 2 ? 6 : -6
        f.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang}) translate(0 ${side})`)
        f.style.opacity = String((1 - i / STEPS) * 0.85)
      })
      labels.current.forEach((g, i) => g?.classList.toggle('is-on', at >= stops[i] - 6))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <figure ref={fig} className="map" aria-label={`Infection chain: ${chain.join(', then ')}`}>
      <svg viewBox="0 0 1000 420" role="img">
        <defs>
          <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
          </filter>
          <g id="foot" transform="rotate(90)">
            <ellipse cx="0" cy="0" rx="5" ry="8" />
            <circle cx="-3" cy="-11" r="1.6" />
            <circle cx="0" cy="-12.5" r="1.6" />
            <circle cx="3" cy="-11" r="1.6" />
          </g>
          {/* the route only shows where the ink has reached */}
          <mask id="inked">
            <path ref={reveal} d={path} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
          </mask>
        </defs>

        {/* faint corridors, like walls on an old floor plan */}
        <g className="map-walls" filter="url(#ink)">
          <rect x="30" y="40" width="940" height="340" rx="6" />
          <path d="M30 210 H 200 M 400 40 V 120 M 600 380 V 330 M 800 40 V 90 M 970 200 H 840" />
        </g>

        <path d={path} className="map-route" filter="url(#ink)" mask="url(#inked)" />

        {nodes.map((n, i) => (
          <g
            key={i}
            ref={(g) => {
              labels.current[i] = g
            }}
            className="map-node"
            transform={`translate(${n.x} ${n.y})`}
          >
            <circle r="9" />
            <text y={i % 2 ? -22 : 34} textAnchor="middle">
              {chain[i]}
            </text>
          </g>
        ))}

        {/* the walker: newest print first, older ones fading behind */}
        {Array.from({ length: STEPS }, (_, i) => (
          <use
            key={i}
            ref={(u) => {
              feet.current[i] = u
            }}
            href="#foot"
            className="map-foot"
          />
        ))}
      </svg>
      <figcaption>
        Lumma, C++ chain: lure to payload. Keep scrolling and the map draws itself. The full CTI layer
        (infrastructure, pivots, judgments) is being inked.
      </figcaption>
    </figure>
  )
}
