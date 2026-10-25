// Placeholders for work that is not published yet: a bubbling cauldron and an enchanted quill
// still writing the page. Pure SVG + CSS, so they also work without WebGL.

export function Cauldron({ label = 'Still brewing' }: { label?: string }) {
  return (
    <figure className="cauldron" aria-label={label}>
      <svg viewBox="0 0 200 170" role="img">
        <defs>
          <radialGradient id="brew" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="0.5" stopColor="#c9a227" />
            <stop offset="1" stopColor="#7a3b0c" />
          </radialGradient>
        </defs>
        {/* steam */}
        {[70, 100, 130].map((x, i) => (
          <path
            key={x}
            className="steam"
            style={{ animationDelay: `${i * 0.8}s` }}
            d={`M${x} 60 q -10 -15 0 -30 q 10 -15 0 -30`}
          />
        ))}
        {/* bubbles */}
        {[62, 84, 100, 118, 136].map((x, i) => (
          <circle key={x} className="bubble" cx={x} cy="72" r={3 + (i % 3) * 2} style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
        {/* brew surface + pot */}
        <ellipse cx="100" cy="76" rx="58" ry="10" fill="url(#brew)" />
        <path d="M38 76 Q 32 140 70 150 L 130 150 Q 168 140 162 76 Z" fill="#1d1820" stroke="#e0b354" strokeWidth="2" />
        <ellipse cx="100" cy="76" rx="62" ry="11" fill="none" stroke="#e0b354" strokeWidth="3" />
        <path d="M66 150 l -8 14 M134 150 l 8 14" stroke="#e0b354" strokeWidth="4" strokeLinecap="round" />
        {/* fire */}
        {[80, 100, 120].map((x, i) => (
          <path key={x} className="fire" style={{ animationDelay: `${i * 0.2}s` }} d={`M${x - 8} 168 Q ${x} 148 ${x + 8} 168 Z`} />
        ))}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export function EnchantedQuill({ line }: { line: string }) {
  return (
    <div className="quill">
      <svg viewBox="0 0 320 70" aria-hidden>
        <path className="quill-ink" d="M10 50 c 20 -20 30 10 50 -6 s 30 -8 44 4 s 26 -14 46 -2 s 30 10 48 -6 s 40 6 56 -4 s 24 -6 56 2" />
        <g className="quill-pen">
          <path d="M0 0 L 34 -46 Q 44 -60 30 -40 L 4 -2 Z" fill="#efe4cc" stroke="#e0b354" strokeWidth="1.2" />
          <path d="M0 0 L 6 -8" stroke="#2a1f17" strokeWidth="2" />
        </g>
      </svg>
      <p>{line}</p>
    </div>
  )
}

export function InvisibilityCloak({ title, href }: { title: string; href: string }) {
  return (
    <a className="cloaked" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${title}: coming soon`}>
      <span className="cloaked-title">{title}</span>
      <span className="cloaked-hint">under the Invisibility Cloak · coming soon</span>
    </a>
  )
}
