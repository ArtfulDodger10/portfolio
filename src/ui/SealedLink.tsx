// A link to published work, or to a coming-soon page (`soon`: still a working link, with a small wax-seal tag).
// An empty href stays sealed (no link at all), but nothing on the site uses that any more.
export function SealedLink({ label, href, onClick, soon }: { label: string; href: string; onClick?: () => void; soon?: boolean }) {
  if (!href) {
    return (
      <span className="link link-sealed" title="Sealed until it is published">
        <span className="wax" aria-hidden />
        {label} <small>(sealed)</small>
      </span>
    )
  }
  return (
    <a className={`link ${soon ? 'link-soon' : ''}`} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {label}
      {soon && (
        <small className="soon-tag">
          <span className="wax" aria-hidden /> coming soon
        </small>
      )}
    </a>
  )
}
