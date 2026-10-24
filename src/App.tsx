import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { links, whispers } from './content/site'
import { AcceptanceLetter } from './magic/Letter'
import { OwlPostNotes, sendOwl } from './magic/Owls'
import { GoldenSnitch } from './magic/Snitch'
import { SpellProvider, useSpells, useTypedSpells } from './magic/Spells'
import { bindScrollAndPointer, crest, dementors, detectTier, hasWebGL } from './scene/state'
import { CasePage } from './ui/CasePage'
import {
  Cases,
  Azkaban,
  Charms,
  GreatHall,
  Hero,
  MapSection,
  OwlPost,
  Owls,
  Prophet,
  RoomOfRequirement,
  Sorting,
  Spellbook,
} from './ui/Sections'
import { Mist } from './ui/Mist'
import { WandTrail } from './ui/WandTrail'

// three.js ships in its own chunk, so the text is readable before the castle loads.
const Scene = lazy(() => import('./scene/Scene'))

const NAV = [
  ['#sorting', 'Sorting'],
  ['#hall', 'Great Hall'],
  ['#cases', 'Dark Arts'],
  ['#map', 'Map'],
  ['#prophet', 'Prophet'],
  ['#spellbook', 'Spellbook'],
  ['#owl-post', 'Owl Post'],
] as const

function readMuggle(): boolean {
  try {
    return localStorage.getItem('muggle') === '1'
  } catch {
    return false
  }
}

function useRoute() {
  const read = () => {
    const m = location.hash.match(/^#\/case\/([\w-]+)/)
    return m ? m[1] : null
  }
  const [caseId, setCaseId] = useState(read)
  useEffect(() => {
    const on = () => setCaseId(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return caseId
}

export default function App() {
  const webgl = useMemo(() => hasWebGL(), [])
  const [muggle, setMuggle] = useState(() => readMuggle() || !webgl)
  return (
    <SpellProvider quiet={muggle}>
      <Castle muggle={muggle} setMuggle={setMuggle} webgl={webgl} />
    </SpellProvider>
  )
}

function Castle({ muggle, setMuggle, webgl }: { muggle: boolean; setMuggle: (m: boolean) => void; webgl: boolean }) {
  const tier = useMemo(() => detectTier(), [])
  const [sceneReady, setReady] = useState(false)
  const ready = sceneReady || muggle
  const [menu, setMenu] = useState(false)
  const caseId = useRoute()

  // The wand cursor is opt-in: the normal mouse by default, a small toggle next to the Patronus button.
  const finePointer = useMemo(() => window.matchMedia('(pointer: fine)').matches, [])
  const [wandOn, setWandOn] = useState(() => {
    try {
      return localStorage.getItem('wand') === '1'
    } catch {
      return false
    }
  })
  const toggleWand = () =>
    setWandOn((on) => {
      try {
        localStorage.setItem('wand', on ? '0' : '1')
      } catch {
        /* private mode: lasts for this visit */
      }
      return !on
    })

  // The acceptance letter greets every visit (not in Muggle mode); "Skip the letter" is always there.
  const [letterOpen, setLetterOpen] = useState(() => !muggle)
  const closeLetter = useCallback(() => {
    setLetterOpen(false)
    // give the visitor a calm first half-minute in the castle before any dementor shows up
    if (dementors.phase === 'away') dementors.nextVisit = performance.now() / 1000 + 35
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('page-open', letterOpen)
    if (letterOpen) dementors.nextVisit = Number.POSITIVE_INFINITY
  }, [letterOpen])
  const { cast, award, points, sound, toggleSound } = useSpells()

  useEffect(() => bindScrollAndPointer(), [])

  // Are dementors around right now? (the scene announces each visit)
  const [dementorsHere, setDementorsHere] = useState(false)
  const warned = useRef(false)
  useEffect(() => {
    const on = (e: Event) => {
      const here = (e as CustomEvent<string>).detail === 'present'
      setDementorsHere(here)
      if (here && !warned.current) {
        warned.current = true
        sendOwl(whispers.dementors)
      }
    }
    window.addEventListener('dementors', on)
    return () => window.removeEventListener('dementors', on)
  }, [])

  // Click the crest (it lives in the 3D layer under the text, so the click is matched by position): Lumos
  useEffect(() => {
    const onClick = (e: globalThis.MouseEvent) => {
      if (!crest.hover || letterOpen || caseId) return
      if ((e.target as Element).closest('a, button, input, .case, .cell, .parchment')) return
      crest.flashAt = performance.now() / 1000
      cast('Lumos', e, undefined, { key: 'crest', points: 5, reason: 'for lighting up the crest' })
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [cast, letterOpen, caseId])

  // Expecto Patronum: worth 50 when it drives dementors off, a little for practice otherwise
  const patronus = useCallback(
    (e?: MouseEvent | null) => {
      const here = dementors.phase === 'present'
      cast(
        'Expecto Patronum',
        e ?? null,
        () => dementors.repel(),
        here ? { key: 'repel' } : { key: 'practice', points: 5, reason: 'for practising your Patronus' },
      )
    },
    [cast],
  )

  // Muggle mode has its own light/dark switch (remembered); the wizard view is always night.
  const [muggleDark, setMuggleDark] = useState(() => {
    try {
      return localStorage.getItem('muggle-dark') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('muggle-dark', muggleDark)
    try {
      localStorage.setItem('muggle-dark', muggleDark ? '1' : '0')
    } catch {
      /* private mode: lasts for this visit */
    }
  }, [muggleDark])

  useEffect(() => {
    document.documentElement.classList.toggle('muggle', muggle)
    try {
      localStorage.setItem('muggle', muggle ? '1' : '0')
    } catch {
      /* private mode: the toggle still works for this visit */
    }
  }, [muggle])

  // Fade sections in as they enter the viewport. Re-run after a filter or route change adds cards.
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-visible)')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    const mo = new MutationObserver(() =>
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el)),
    )
    mo.observe(document.querySelector('main')!, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  // Never leave the loader up if the scene is off or slow.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const toggleMuggle = (e?: MouseEvent) =>
    muggle ? cast('Lumos', e, () => setMuggle(false)) : cast('Nox', e, () => setMuggle(true))

  const typed = useMemo(
    () => ({
      lumos: () => muggle && cast('Lumos', null, () => setMuggle(false)),
      nox: () => !muggle && cast('Nox', null, () => setMuggle(true)),
      'expecto patronum': () => patronus(),
      'avada kedavra': () => cast('Avada Kedavra', null),
      voldemort: () => {
        // the Taboo: a cold snap, a whisper, and it costs points
        document.documentElement.classList.add('taboo')
        setTimeout(() => document.documentElement.classList.remove('taboo'), 1800)
        sendOwl(whispers.taboo)
        award('taboo', whispers.taboo.points, whispers.taboo.reason)
      },
      'you know who': () => sendOwl(whispers.youKnowWho),
      alohomora: () => cast('Alohomora', null, () => document.getElementById('cases')?.scrollIntoView({ behavior: 'smooth' })),
      accio: () => cast('Accio', null, () => window.open(links.resume, '_blank', 'noopener')),
    }),
    [muggle, cast, award, setMuggle, patronus],
  )
  useTypedSpells(typed)

  return (
    <>
      {!muggle && (
        <Suspense fallback={null}>
          <Scene tier={tier} onReady={() => setReady(true)} />
        </Suspense>
      )}
      {!muggle && <Mist low={tier.low} />}
      {!muggle && wandOn && <WandTrail />}
      {!muggle && <div className="frost" aria-hidden />}

      <div className={`loader ${ready ? 'is-done' : ''}`} aria-hidden>
        <p>Lumos&hellip;</p>
      </div>

      <a className="skip" href="#cases">Skip to case files</a>

      <nav className="nav" aria-label="Sections">
        <a className="nav-crest" href="#top" aria-label="Back to top">N</a>
        <button className="nav-burger" aria-expanded={menu} aria-controls="nav-links" onClick={() => setMenu(!menu)}>
          <span className="sr-only">Menu</span>
          <span aria-hidden>{menu ? '✕' : '☰'}</span>
        </button>
        <ul id="nav-links" className={menu ? 'is-open' : ''}>
          {NAV.map(([href, label]) => (
            <li key={href}>
              <a href={href} onClick={() => setMenu(false)}>{label}</a>
            </li>
          ))}
          <li>
            <a className="nav-blog" href={links.blog} target="_blank" rel="noopener noreferrer">
              Blog &#8599;
            </a>
          </li>
        </ul>
        <span className="house-points" title="Gryffindor house points: everything you do here earns some">
          <span className="hp-shield" aria-hidden />
          <span key={points} className="hp-count">{points}</span>
          <span className="sr-only"> house points</span>
        </span>
        {muggle && (
          <button
            className="theme-toggle"
            onClick={() => setMuggleDark(!muggleDark)}
            aria-pressed={muggleDark}
            aria-label={muggleDark ? 'Light mode' : 'Dark mode'}
            title={muggleDark ? 'Light mode' : 'Dark mode'}
          >
            {muggleDark ? (
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="4.2" fill="currentColor" />
                <path
                  d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
              </svg>
            )}
          </button>
        )}
        <button
          className="sound-toggle"
          aria-pressed={sound}
          onClick={toggleSound}
          title={sound ? 'Mute the chimes' : 'Play a chime when you earn house points'}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {sound ? (
              <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
          <span className="sr-only">{sound ? 'Sound on' : 'Sound off'}</span>
        </button>
        <button
          className="muggle-toggle"
          aria-pressed={muggle}
          onClick={(e) => toggleMuggle(e)}
          title={muggle ? 'Bring the magic back' : 'Plain, fast, no 3D'}
          disabled={!webgl}
          data-spell={muggle ? 'Lumos' : 'Nox'}
        >
          {muggle ? 'Wizard mode' : 'Muggle mode'}
        </button>
      </nav>

      <main aria-hidden={caseId ? true : undefined}>
        <Hero />
        <Sorting />
        <GreatHall />
        <Cases />
        <Azkaban />
        <MapSection />
        <Charms />
        <RoomOfRequirement />
        <Prophet />
        <Spellbook />
        <Owls />
        <OwlPost />
      </main>

      {caseId && <CasePage id={caseId} />}
      <OwlPostNotes off={muggle || !!caseId || letterOpen} />
      {letterOpen && ready && <AcceptanceLetter onEnter={closeLetter} />}
      {!muggle && <GoldenSnitch paused={letterOpen || !!caseId} />}
      {!muggle && !letterOpen && (
        <div className="fab-dock">
          {finePointer && (
            <button
              className={`wand-toggle ${wandOn ? 'is-on' : ''}`}
              onClick={toggleWand}
              aria-pressed={wandOn}
              aria-label={wandOn ? 'Use the normal cursor' : 'Use a wand as your cursor'}
              title={wandOn ? 'Back to the normal cursor' : 'Use a wand as your cursor'}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M4 20 L 15.5 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M4 20 L 7.5 16.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M18 2.5 v3 M 16.5 4 h3 M 21 7.5 v2 M 20 8.5 h2 M 13 3 v1.6 M 12.2 3.8 h1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <button
            className={`patronus-fab ${dementorsHere ? 'is-urgent' : ''}`}
            onClick={(e) => patronus(e)}
            data-spell="Expecto Patronum"
            title={dementorsHere ? 'Dementors nearby: drive them off' : 'Cast a Patronus'}
          >
            <span className="fab-glow" aria-hidden />
            Cast a Patronus
          </button>
        </div>
      )}
    </>
  )
}
