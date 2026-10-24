// A link that is either live or sealed with wax until the work is published.
export function SealedLink({ label, href, onClick }: { label: string; href: string; onClick?: () => void }) {
  if (!href) {
    return (
      <span className="link link-sealed" title="Sealed until it is published">
        <span className="wax" aria-hidden />
        {label} <small>(sealed)</small>
      </span>
    )
  }
  return (
    <a className="link" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {label}
    </a>
  )
}
