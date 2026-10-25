import { useEffect, useRef, useState } from 'react'
import { owlNotes } from '../content/site'

// Owl post: one note every 20 seconds, on a steady rhythm. The note for the section the visitor is reading
// goes first; otherwise the next unread one in order. Each note shows for 8 s and never repeats in a session;
// when all are read, the owls stop. One click turns them off for good. Off in Muggle mode.
// Replies to something the visitor did (typed easter eggs, the dementors) arrive at once and restart the clock.

const EVERY = 20_000
const STAY = 8_000

function seen(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem('owls-seen') ?? '[]')
  } catch {
    return []
  }
}
function markSeen(id: string) {
  try {
    sessionStorage.setItem('owls-seen', JSON.stringify([...seen(), id]))
  } catch {
    /* fine: may repeat after a reload */
  }
}
function owlsOff(): boolean {
  try {
    return localStorage.getItem('owls') === '0'
  } catch {
    return false
  }
}

// Deliver a note right away (typed easter eggs), skipping the queue and the per-visit cap.
export function sendOwl(note: { from: string; text: string }) {
  window.dispatchEvent(new CustomEvent('owl', { detail: note }))
}

export function OwlPostNotes({ off }: { off: boolean }) {
  const [note, setNote] = useState<(typeof owlNotes)[number] | null>(null)
  const [stopped, setStopped] = useState(owlsOff)
  const queue = useRef<string[]>([])
  const last = useRef(Date.now())

  useEffect(() => {
    if (off || stopped) return
    const done = new Set(seen())
    const want = (id: string) => {
      if (!done.has(id) && !queue.current.includes(id)) queue.current.push(id)
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && want(e.target.id)),
      // "reached" = the section crosses the middle of the screen (works for very tall sections too)
      { rootMargin: '-45% 0px -45% 0px' },
    )
    owlNotes.forEach((n) => {
      const el = n.section !== 'top' && document.getElementById(n.section)
      if (el) io.observe(el)
    })

    // every 20 s: the note for where the visitor is, else the next unread one
    last.current = Date.now()
    const tick = setInterval(() => {
      if (Date.now() - last.current < EVERY) return
      let id = queue.current.shift()
      while (id && done.has(id)) id = queue.current.shift()
      const n = (id && owlNotes.find((x) => x.section === id)) || owlNotes.find((x) => !done.has(x.section))
      if (!n) return clearInterval(tick) // all read
      done.add(n.section)
      markSeen(n.section)
      last.current = Date.now()
      setNote(n)
    }, 1000)

    return () => {
      clearInterval(tick)
      io.disconnect()
    }
  }, [off, stopped])

  useEffect(() => {
    if (off) return
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ from: string; text: string }>).detail
      last.current = Date.now()
      setNote({ section: `direct-${Date.now()}`, ...d })
    }
    window.addEventListener('owl', on)
    return () => window.removeEventListener('owl', on)
  }, [off])

  useEffect(() => {
    if (!note) return
    const t = setTimeout(() => setNote(null), STAY)
    return () => clearTimeout(t)
  }, [note])

  if (off || stopped || !note) return null

  const stop = () => {
    try {
      localStorage.setItem('owls', '0')
    } catch {
      /* private mode */
    }
    setStopped(true)
  }

  return (
    <aside key={note.section} className="owl-note" role="status" aria-live="polite">
      <Owl />
      <div className="owl-letter">
        <span className="owl-seal" aria-hidden />
        <p className="owl-from">{note.from}</p>
        <p className="owl-text">{note.text}</p>
        <div className="owl-actions">
          <button onClick={() => setNote(null)}>Mischief managed</button>
          <button onClick={stop}>No more owls</button>
        </div>
      </div>
    </aside>
  )
}

function Owl() {
  return (
    <svg className="owl" viewBox="0 0 60 60" aria-hidden>
      <g className="owl-wing owl-wing-l">
        <path d="M18 30 Q 2 22 4 40 Q 12 36 20 40 Z" fill="#8a6a4a" />
      </g>
      <g className="owl-wing owl-wing-r">
        <path d="M42 30 Q 58 22 56 40 Q 48 36 40 40 Z" fill="#8a6a4a" />
      </g>
      <ellipse cx="30" cy="34" rx="13" ry="16" fill="#b08a60" />
      <ellipse cx="30" cy="39" rx="8" ry="10" fill="#e9dcc0" />
      <path d="M19 20 L 22 12 L 26 19 Z M41 20 L 38 12 L 34 19 Z" fill="#b08a60" />
      <circle cx="25" cy="27" r="5" fill="#f7efdc" />
      <circle cx="35" cy="27" r="5" fill="#f7efdc" />
      <circle className="owl-eye" cx="25" cy="27" r="2.4" fill="#1d140d" />
      <circle className="owl-eye" cx="35" cy="27" r="2.4" fill="#1d140d" />
      <path d="M28.5 31 L 30 34 L 31.5 31 Z" fill="#e0b354" />
    </svg>
  )
}
