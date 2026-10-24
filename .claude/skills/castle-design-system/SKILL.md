---
name: castle-design-system
description: UI, typography, colour tokens, motion and writing voice for the Grimoire portfolio's DOM layer (src/ui, src/styles.css). Use when adding or restyling a section, card, button, nav item, animation, or when writing any visible copy.
---

# Castle design system

## Tokens (src/styles.css `:root`)
`--night --night-2 --ink --ink-dim --gold --gold-hi --scarlet --scarlet-deep --card --card-edge`,
fonts `--display` (Cinzel: headings, labels, buttons), `--body` (Cormorant Garamond), `--hand` (Caveat: margin
notes, incantations, map labels). Never hard-code a colour in a component; add a token and its Muggle value.

## Components already there — reuse them
`SectionHead` (incantation + h2 + sub) · `.parchment` card · `.case` folder card with `.case-tab` + `.stamp` ·
`.btn-gold` / `.btn-ghost` · `SealedLink` (empty href → "sealed") · `.margin-note` · chips (`.coursework li`,
`.school li`) · `.reveal` (fade-up on scroll, handled in App.tsx).

## Layout
Text column: `width: var(--col)` (640 px) at `margin-left: var(--gutter)`; the right side belongs to the 3D.
If you change the column width or gutter, update the crest maths in `Scene.tsx` Layout.
Mobile (≤ 860 px): single column, 16 px gutter, burger menu, the hero padded to leave the top for the crest.

## Motion
CSS transitions ≤ 0.9 s, ease-out. One signature animation per element at most. Everything respects
`prefers-reduced-motion` (global rule at the bottom of styles.css) and is disabled under `:root.muggle`.

## Voice
First person, plain, specific, a bit dry. Wizarding names on labels and headings only; the body text says
what actually happened in normal words ("one extractor for both chains", not "a mighty spell").
Facts must match the published write-up or `site.ts`; unfinished → "brewing". No hype words.
Each section may carry one handwritten margin note — that is the human touch; don't overdo it.

## Accessibility
Real headings in order (h1 hero, h2 sections, h3 cards). Buttons are `<button>`, links are `<a>`.
Toggles carry `aria-expanded`/`aria-pressed`. Contrast ≥ 4.5:1 for body text in both modes.
Decorative canvases are `aria-hidden`. The SVG map has an `aria-label` describing the chain.
