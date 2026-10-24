import { useEffect, useRef } from 'react'
import { caseFiles } from '../content/site'
import { Cauldron, EnchantedQuill } from '../magic/Brewing'
import { useSpells } from '../magic/Spells'
import { SealedLink } from './SealedLink'

// A case file opened with Alohomora (#/case/<id>), sealed again with Colloportus.

export function CasePage({ id }: { id: string }) {
  const c = caseFiles.find((x) => x.id === id)
  const { cast } = useSpells()
  const closeRef = useRef<HTMLButtonElement>(null)

  const close = (e?: { clientX: number; clientY: number }) =>
    cast('Colloportus', e ?? null, () => {
      location.hash = `case-${id}`
    })

  useEffect(() => {
    document.documentElement.classList.add('page-open')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('page-open')
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!c) {
    return (
      <div className="case-page" role="dialog" aria-modal="true" aria-label="Not found">
        <div className="case-page-inner">
          <button ref={closeRef} className="btn btn-ghost" onClick={(e) => close(e)} data-spell="Colloportus">
            Back
          </button>
          <h1>This page vanished</h1>
          <p>Someone cast Evanesco on it. Try the case files instead.</p>
        </div>
      </div>
    )
  }

  const brewing = c.status === 'brewing'
  return (
    <div className="case-page" role="dialog" aria-modal="true" aria-labelledby="case-title">
      <div className="case-page-inner">
        <div className="case-page-bar">
          <button ref={closeRef} className="btn btn-ghost" onClick={(e) => close(e)} data-spell="Colloportus">
            <span aria-hidden>&larr;</span> Close the file
          </button>
          <span className={`stamp stamp-${c.status}`}>{brewing ? 'Brewing' : 'Published'}</span>
        </div>

        <p className="incantation">{c.kind === 'cti' ? "The Marauder's Map" : 'Defence Against the Dark Arts'}</p>
        <p className="case-page-codename">{c.codename}</p>
        <h1 id="case-title">{c.title}</h1>
        <p className="case-date">{c.date}</p>
        <p className="case-page-summary">{c.summary}</p>

        <ol className="chain-big" aria-label="Chain">
          {c.chain.map((s, i) => (
            <li key={s} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
              <span className="chain-dot" />
              {s}
            </li>
          ))}
        </ol>

        <div className="case-page-grid">
          <section className="parchment">
            <h2>{brewing ? 'What is done so far' : 'What came out'}</h2>
            <ul className="outcomes">
              {c.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="tools">{c.tools.join(' · ')}</p>
          </section>

          {brewing ? (
            <section className="brewing-panel">
              <Cauldron label="The full write-up is still in the cauldron" />
              <EnchantedQuill line="The enchanted quill is still writing this chapter. The report and code unseal when they are published." />
            </section>
          ) : (
            <section className="parchment">
              <h2>Read the full spell</h2>
              <p>The complete write-up, code and detections live on the blog and GitHub.</p>
            </section>
          )}
        </div>

        <div className="case-links big">
          {c.links.map((l) => (
            <SealedLink key={l.label} {...l} />
          ))}
        </div>
        {c.note && <p className="margin-note">{c.note}</p>}
      </div>
    </div>
  )
}
