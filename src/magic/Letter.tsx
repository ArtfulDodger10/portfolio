import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { letter } from '../content/site'
import { useSpells } from './Spells'

// The acceptance letter. An envelope floats in, the seal breaks, the letter rises out and writes
// itself in ink (with a quill at the tip); then the visitor says Alohomora to enter.
// Click the letter to finish the writing at once; "Skip the letter" closes it straight away.

type Stage = 'envelope' | 'opening' | 'writing' | 'ready' | 'leaving'

// the letter as one stream of characters, so the quill can write across paragraphs
const PARAS = [letter.greeting, ...letter.body]
const TOTAL = PARAS.reduce((n, p) => n + p.length, 0)

export function AcceptanceLetter({ onEnter }: { onEnter: () => void }) {
  const calm = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [stage, setStage] = useState<Stage>(calm ? 'ready' : 'envelope')
  const [written, setWritten] = useState(calm ? TOTAL : 0)
  const { cast } = useSpells()
  const enterRef = useRef<HTMLButtonElement>(null)

  // envelope arrives, then opens on its own
  useEffect(() => {
    if (stage === 'envelope') {
      const t = setTimeout(() => setStage('opening'), 1700)
      return () => clearTimeout(t)
    }
    if (stage === 'opening') {
      const t = setTimeout(() => setStage('writing'), 1300)
      return () => clearTimeout(t)
    }
  }, [stage])

  // the quill: a human pace, a little uneven, pausing after punctuation
  useEffect(() => {
    if (stage !== 'writing') return
    if (written >= TOTAL) {
      setStage('ready')
      return
    }
    const flat = PARAS.join('')
    const prev = flat[written - 1] ?? ''
    const delay = /[.,:;]/.test(prev) ? 160 : 14 + Math.random() * 22
    const t = setTimeout(() => setWritten((n) => n + 1), delay)
    return () => clearTimeout(t)
  }, [stage, written])

  useEffect(() => {
    if (stage === 'ready') enterRef.current?.focus()
  }, [stage])

  const finishWriting = () => {
    if (stage === 'writing') setWritten(TOTAL)
  }

  const leave = () => {
    setStage('leaving')
    setTimeout(onEnter, 700)
  }
  const enter = (e: MouseEvent) =>
    cast('Alohomora', e, leave, { key: 'letter', points: letter.points, reason: letter.reason })

  // which paragraph the quill is in, and how far
  let left = written
  const shown = PARAS.map((p) => {
    const n = Math.max(0, Math.min(p.length, left))
    left -= p.length
    return n
  })
  const activePara = shown.findIndex((n, i) => n < PARAS[i].length)

  return (
    <div className={`letter-stage stage-${stage}`} role="dialog" aria-modal="true" aria-label="Your acceptance letter">
      <button className="letter-skip" onClick={leave}>
        {letter.skip}
      </button>

      {(stage === 'envelope' || stage === 'opening') && (
        <div className="envelope-wrap" aria-hidden>
          <div className="env">
            <div className="env-back" />
            <div className="env-paper" />
            <div className="env-front">
              <p className="env-address">
                {letter.address.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </p>
            </div>
            <div className="env-flap" />
            <div className="env-seal">N</div>
          </div>
        </div>
      )}

      {stage !== 'envelope' && stage !== 'opening' && (
        <article className="acceptance" onClick={finishWriting}>
          <header className="acc-head">
            <span className="acc-crest" aria-hidden>N</span>
            <h1>{letter.school}</h1>
            <p className="acc-office">{letter.office}</p>
            <p className="acc-keeper">{letter.keeper}</p>
          </header>
          <div className="acc-body">
            {PARAS.map((p, i) => (
              <p key={i} className={i === 0 ? 'acc-greeting' : undefined}>
                {p.slice(0, shown[i])}
                {stage === 'writing' && i === activePara && (
                  <span className="quill-tip" aria-hidden>
                    <svg viewBox="0 0 40 60">
                      <path d="M2 58 L 30 4 Q 40 -4 36 10 L 8 58 Z" fill="#efe4cc" stroke="#7a5a2a" strokeWidth="1.2" />
                      <path d="M2 58 L 7 50" stroke="#1d140d" strokeWidth="2.5" />
                    </svg>
                  </span>
                )}
                <span className="acc-unwritten">{p.slice(shown[i])}</span>
              </p>
            ))}
          </div>
          <footer className={`acc-sign ${stage === 'writing' ? '' : 'is-in'}`}>
            <p>{letter.signoff}</p>
            <p className="acc-signature">{letter.signature}</p>
            <p className="acc-title">{letter.title}</p>
          </footer>
          <div className={`acc-enter ${stage === 'ready' || stage === 'leaving' ? 'is-in' : ''}`}>
            <button
              ref={enterRef}
              className="alohomora"
              onClick={(e) => {
                e.stopPropagation()
                enter(e)
              }}
              disabled={stage !== 'ready'}
            >
              <span className="keyhole" aria-hidden />
              {letter.enter}
            </button>
            <small>{letter.enterHint}</small>
          </div>
        </article>
      )}
    </div>
  )
}
