import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  about,
  azkaban,
  points as pointsFor,
  caseFiles,
  charms,
  experience,
  links,
  owls,
  profile,
  prophet,
  roomOfRequirement,
  sortingVerdict,
  spellbook,
  traits,
  type CaseFile,
} from '../content/site'
import { InvisibilityCloak } from '../magic/Brewing'
import { useSpells } from '../magic/Spells'
import { skyNow } from '../scene/state'
import { MaraudersMap } from './MaraudersMap'
import { SealedLink } from './SealedLink'

function SectionHead({ spell, title, sub }: { spell: string; title: string; sub: string }) {
  return (
    <header className="section-head reveal">
      <p className="incantation">{spell}</p>
      <h2>{title}</h2>
      <p className="section-sub">{sub}</p>
      <div className="scarf" aria-hidden />
    </header>
  )
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function Hero() {
  const { cast } = useSpells()
  const openCases = (e: MouseEvent) => {
    e.preventDefault()
    cast('Alohomora', e, () => scrollTo('cases'), { key: 'hero' })
  }
  const summonCv = (e: MouseEvent) => {
    e.preventDefault()
    cast('Accio', e, () => window.open(links.resume, '_blank', 'noopener'))
  }
  return (
    <section id="top" className="hero">
      <div className="hero-copy">
        <p className="tower reveal">
          {profile.house} <span aria-hidden>&middot;</span> {profile.tower}
        </p>
        <h1 className="hero-name" aria-label={profile.name}>
          {profile.name.split(' ').map((word, w, words) => {
            const before = words.slice(0, w).join('').length
            return (
              <span key={word} className="word" aria-hidden>
                {word.split('').map((ch, i) => (
                  <span key={i} className="ch" style={{ animationDelay: `${0.4 + (before + i) * 0.07}s` }}>
                    {ch}
                  </span>
                ))}
              </span>
            )
          })}
        </h1>
        <p className="hero-role reveal">
          {profile.roles.map((r, i) => (
            <span key={r}>
              {i > 0 && <span className="dot"> &#9670; </span>}
              {r}
            </span>
          ))}
        </p>
        <p className="hero-tagline reveal">{profile.tagline}</p>
        <p className="margin-note reveal">{profile.margin}</p>
        <div className="hero-cta reveal">
          <a className="btn btn-gold" href="#cases" onClick={openCases} data-spell="Alohomora">
            Open the case files
          </a>
          <a className="btn btn-ghost" href={links.resume} onClick={summonCv} data-spell="Accio">
            Download CV
          </a>
        </div>
      </div>
      <a className="scroll-hint" href="#sorting" aria-label="Scroll to the next section">
        <span />
      </a>
    </section>
  )
}

function SortingHat() {
  return (
    <svg className="hat" viewBox="0 0 120 110" aria-hidden>
      <path d="M8 96 Q 60 80 112 96 Q 60 108 8 96 Z" fill="#3b2a1e" stroke="#e0b354" strokeWidth="1.5" />
      <path d="M26 92 Q 40 60 52 40 Q 58 12 84 6 Q 70 22 72 40 Q 76 66 94 90 Q 60 82 26 92 Z" fill="#4a3526" stroke="#e0b354" strokeWidth="1.5" />
      <path className="hat-brow" d="M44 62 q 8 -6 16 0 M 64 60 q 8 -6 14 2" stroke="#1d140d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path className="hat-mouth" d="M48 76 q 14 8 28 0" stroke="#1d140d" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Sorting() {
  const e = profile.education
  return (
    <section id="sorting" className="section">
      <SectionHead spell="The Sorting Hat" title="Who keeps this grimoire" sub="A student of the dark arts, firmly on the defending side." />
      <div className="verdict reveal">
        <SortingHat />
        <blockquote>{sortingVerdict}</blockquote>
      </div>
      <div className="parchment reveal">
        {about.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <div className="schooling">
          <div>
            <h3>{e.school}</h3>
            <p>{e.faculty}</p>
            <p>{e.department}</p>
          </div>
          <div>
            <p className="degree">{e.degree}</p>
            <p className="muted">{e.dates}</p>
          </div>
        </div>
        <ul className="coursework" aria-label="Relevant coursework">
          {e.coursework.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <ul className="traits">
        {traits.map((t) => (
          <li key={t.trait} className="trait reveal">
            <h3>{t.trait}</h3>
            <p>{t.line}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function GreatHall() {
  return (
    <section id="hall" className="section">
      <SectionHead spell="The Great Hall" title="Experience" sub="Where I have done the work, and where I taught it." />
      <ol className="timeline">
        {experience.map((x) => (
          <li key={x.role} className="parchment reveal">
            <p className="timeline-title">{x.title}</p>
            <h3>{x.role}</h3>
            <p className="muted">
              {x.org} &middot; {x.dates} &middot; {x.place}
            </p>
            <ul className="outcomes">
              {x.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

function CaseCard({ c }: { c: CaseFile }) {
  const { cast } = useSpells()
  const open = (e: MouseEvent) => {
    e.preventDefault()
    cast(
      'Alohomora',
      e,
      () => {
        location.hash = `/case/${c.id}`
      },
      { key: c.id },
    )
  }
  return (
    <article id={`case-${c.id}`} className={`case reveal ${c.status}`}>
      <div className="case-tab">{c.codename}</div>
      <span className={`stamp stamp-${c.status}`}>{c.status === 'published' ? 'Published' : 'Brewing'}</span>
      <p className="case-date">{c.date}</p>
      <h3>{c.title}</h3>
      <p>{c.summary}</p>
      <ol className="chain" aria-label="Chain">
        {c.chain.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className="case-foot">
        <a className="case-open" href={`#/case/${c.id}`} onClick={open} data-spell="Alohomora">
          <span className="keyhole" aria-hidden /> Open the file
        </a>
        <div className="case-links">
          {c.links.map((l) => (
            <SealedLink key={l.label} {...l} />
          ))}
        </div>
      </div>
      {c.note && <p className="margin-note small">{c.note}</p>}
    </article>
  )
}

export function Cases() {
  const { cast, award } = useSpells()
  const malware = caseFiles.filter((c) => c.kind === 'malware')
  const tags = useMemo(() => [...new Set(malware.flatMap((c) => c.tags))], [malware])
  const [tag, setTag] = useState<string | null>(null)
  const [vanishing, setVanishing] = useState(false)
  const shown = tag ? malware.filter((c) => c.tags.includes(tag)) : malware

  const clear = (e: MouseEvent) => {
    setVanishing(true)
    cast('Evanesco', e, () => {
      setTag(null)
      setVanishing(false)
    })
  }

  return (
    <section id="cases" className="section">
      <SectionHead
        spell="Defence Against the Dark Arts"
        title="Case files"
        sub="Real samples from real campaigns, reversed end to end. Each file ends in something reusable: an extractor, a rule, a report."
      />
      <div className="filters reveal" role="group" aria-label="Filter case files">
        {tags.map((t) => (
          <button key={t} className={`chip ${tag === t ? 'is-on' : ''}`} aria-pressed={tag === t} onClick={() => {
              setTag(tag === t ? null : t)
              award(`filter:${t}`, pointsFor.filter.points, pointsFor.filter.reason)
            }}>
            {t}
          </button>
        ))}
        {tag && (
          <button className="chip chip-clear" onClick={clear} data-spell="Evanesco">
            Clear filters
          </button>
        )}
      </div>
      <div className={`cases ${vanishing ? 'is-vanishing' : ''}`}>
        {shown.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  )
}

export function MapSection() {
  const cti = caseFiles.filter((c) => c.kind === 'cti')
  return (
    <section id="map" className="section">
      <SectionHead
        spell="The Marauder's Map"
        title="Threat intelligence"
        sub="Where the malware walked. Passive sources only, facts kept apart from judgments, every judgment with a confidence."
      />
      <div className="reveal">
        <MaraudersMap />
      </div>
      <div className="cases cti">
        {cti.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  )
}

export function Charms() {
  return (
    <section id="charms" className="section">
      <SectionHead spell="Protego" title="Detection charms" sub={charms.intro} />
      <ul className="charm-kinds reveal">
        {charms.kinds.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
      <div className="charms">
        {charms.rules.map((r) => (
          <div key={r.name} className="charm reveal">
            <code>rule {r.name}</code>
            <p>{r.hits}</p>
          </div>
        ))}
      </div>
      <p className="reveal">
        <SealedLink label="All rules on GitHub" href={charms.repo} />
      </p>
    </section>
  )
}

export function RoomOfRequirement() {
  const { cast } = useSpells()
  const [open, setOpen] = useState(false)
  const reveal = (e: MouseEvent) => cast('Revelio', e, () => setOpen(true))
  return (
    <section id="room" className="section">
      <SectionHead spell="The Room of Requirement" title="The lab that builds itself" sub="It appears when you need it. Mine drives the disassembler." />
      <div className={`room reveal ${open ? 'is-open' : ''}`}>
        <button className="door" onClick={reveal} aria-expanded={open} aria-label="Open the door" data-spell="Revelio">
          <span className="door-leaf" />
          <span className="door-glow" />
          {!open && <span className="door-hint">Open</span>}
        </button>
        <div className="room-text">
          <p>{roomOfRequirement.line}</p>
          <ul className="outcomes">
            {roomOfRequirement.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <SealedLink {...roomOfRequirement.link} />
        </div>
      </div>
    </section>
  )
}

export function Prophet() {
  const { award } = useSpells()
  return (
    <section id="prophet" className="section">
      <SectionHead spell="The Daily Prophet" title="Latest from the blog" sub="Every case gets a full write-up. The blog is its own site; these are the latest editions." />
      <div className="prophet reveal">
        <header className="prophet-mast">
          <span>Vol. 2026</span>
          <strong>The {profile.handle} Prophet</strong>
          <span>Malware &middot; RE &middot; CTI</span>
        </header>
        <div className="prophet-grid">
          {prophet.editions.map((p, i) => (
            <a
              key={p.href}
              className={`edition ${i === 0 ? 'lead' : ''}`}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => award(`prophet:${p.href}`, pointsFor.prophet.points, pointsFor.prophet.reason)}
            >
              <span className="edition-photo" aria-hidden />
              <span className="edition-date">{p.date}</span>
              <strong>{p.title}</strong>
              <span className="edition-dek">{p.dek}</span>
            </a>
          ))}
        </div>
        <p className="prophet-next">Next editions</p>
        <div className="cloaks">
          {prophet.upcoming.map((t) => (
            <InvisibilityCloak key={t} title={t} />
          ))}
        </div>
        <a className="btn btn-gold prophet-cta" href={links.blog} target="_blank" rel="noopener noreferrer">
          Read the full Prophet &rarr;
        </a>
      </div>
    </section>
  )
}

export function Spellbook() {
  return (
    <section id="spellbook" className="section">
      <SectionHead spell="Accio tools" title="The spellbook" sub="What I reach for, grouped by school of magic." />
      <div className="schools">
        {spellbook.map((s) => (
          <div key={s.school} className="school reveal">
            <h3>{s.school}</h3>
            <ul>
              {s.spells.map((sp, i) => (
                <li key={sp} style={{ transitionDelay: `${0.2 + i * 0.04}s` }}>
                  {sp}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Owls() {
  return (
    <section id="owls" className="section">
      <SectionHead spell="O.W.L.s & N.E.W.T.s" title="Studies" sub="Certification, training, and the restricted-section reading list." />
      <div className="owls">
        <div className="parchment reveal">
          <h3>Certification</h3>
          <ul>{owls.certifications.map((c) => <li key={c}>{c}</li>)}</ul>
          <h3>Training</h3>
          <ul>{owls.training.map((c) => <li key={c}>{c}</li>)}</ul>
          <h3>OpenSecurityTraining2</h3>
          <ul>{owls.ost2.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className="parchment reveal">
          <h3>The Restricted Section</h3>
          <ul>{owls.reading.map((c) => <li key={c}><em>{c}</em></li>)}</ul>
          <h3>Duelling club</h3>
          <p>{owls.ctf}</p>
          <p className="margin-note small">teaching it is how I learned it properly</p>
        </div>
      </div>
    </section>
  )
}

export function OwlPost() {
  const { cast, award } = useSpells()
  const footer = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = footer.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) award('end', pointsFor.end.points, pointsFor.end.reason)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [award])
  const summonCv = (e: MouseEvent) => {
    e.preventDefault()
    cast('Accio', e, () => window.open(links.resume, '_blank', 'noopener'))
  }
  const up = (e: MouseEvent) => cast('Ascendio', e, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
  const items = [
    { label: 'Email', href: links.email },
    { label: 'GitHub', href: links.github },
    { label: 'LinkedIn', href: links.linkedin },
    { label: 'Blog', href: links.blog },
    { label: 'Medium', href: links.medium },
  ]
  return (
    <section id="owl-post" className="section owl-post">
      <SectionHead spell="Owl Post" title="Send word" sub="Open to malware analysis, reverse engineering and threat intelligence roles." />
      <div className="envelope reveal">
        <div className="seal" aria-hidden>N</div>
        <ul>
          {items.map((i) => (
            <li key={i.label}>
              <SealedLink {...i} onClick={() => award(`owl:${i.label}`, pointsFor.owl.points, pointsFor.owl.reason)} />
            </li>
          ))}
        </ul>
        <a className="btn btn-gold" href={links.resume} onClick={summonCv} data-spell="Accio">
          Download CV (PDF)
        </a>
      </div>
      <footer className="footer" ref={footer}>
        <p className="mischief">Mischief managed.</p>
        <p className="muted small-print">{skyNow().label}, by your local time.</p>
        <button className="btn btn-ghost" onClick={up} data-spell="Ascendio">
          Back to the top
        </button>
        <p className="muted small-print">
          Psst: try typing <kbd>lumos</kbd>, <kbd>nox</kbd> or <kbd>expecto patronum</kbd> anywhere on the page.
        </p>
        <p className="muted small-print">
          Built with React Three Fiber. Fan-inspired styling; not affiliated with any film or book franchise.
        </p>
      </footer>
    </section>
  )
}

export function Azkaban() {
  const { cast } = useSpells()
  const open = (e: MouseEvent, id: string) => {
    e.preventDefault()
    cast(
      'Alohomora',
      e,
      () => {
        location.hash = `/case/${id}`
      },
      { key: id },
    )
  }
  return (
    <section id="azkaban" className="section">
      <SectionHead spell="Azkaban" title="The malware I locked up" sub={azkaban.intro} />
      <ol className="cells">
        {azkaban.inmates.map((m) => (
          <li key={m.no} className={`cell reveal ${m.status}`}>
            <a href={`#/case/${m.caseId}`} onClick={(e) => open(e, m.caseId)} data-spell="Alohomora">
              <span className="cell-no">Prisoner No. {m.no}</span>
              <strong className="cell-name">{m.name}</strong>
              <span className="cell-row">
                <em>Crime</em> {m.crime}
              </span>
              <span className="cell-row">
                <em>Sentence</em> {m.sentence}
              </span>
              <span className={`cell-status ${m.status}`}>{m.status === 'locked' ? 'Locked up' : 'Awaiting trial'}</span>
              <span className="bars" aria-hidden />
            </a>
          </li>
        ))}
      </ol>
      <p className="margin-note reveal">{azkaban.dementorLine}</p>
    </section>
  )
}
