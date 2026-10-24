---
name: portfolio-audit
description: Pre-push audit of the Grimoire portfolio — build size budget, fps/responsiveness at four viewports, Muggle mode parity, accessibility, broken links, privacy/redaction and IP checks. Use before any push/deploy or when asked "is it ready", "check performance", "audit the site".
---

# Portfolio audit (run before every push)

Report each item as PASS / FAIL with the evidence (number, screenshot, line).

## 1. Build & budget
`npm run build` — page JS ≤ 90 KB gzip, `three-*.js` ≤ 300 KB gzip, CSS ≤ 15 KB gzip. `npm run lint` clean.

## 2. Viewports (browser pane, dev server `portfolio`)
375×812, 768×1024, 1280×800, 1920×1080. For each: hero readable, crest not over the name,
no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`), nav usable, no console errors.

## 3. Frame rate
In the page: count `requestAnimationFrame` ticks over 3 s while scrolling. Note the pane may throttle;
treat < 30 fps as "check on a real phone", not a hard fail.

## 4. Spells
Click each spell trigger (case open/close, Accio CV, Evanesco, Revelio door, Nox/Lumos, Ascendio): action happens,
overlay mounts and unmounts, no stuck `page-open` class. Typed `expecto patronum` works. Reduced motion: toast only.

## 5. Muggle mode
Toggle it: every section and link present, light theme, no canvas in the DOM, contrast fine.
Reload: the choice persists.

## 6. Accessibility
One h1, headings in order, every button has a name, focus visible on Tab, skip link works,
reduced-motion emulation freezes motion.

## 7. Links
Every non-empty href returns (use the built-in browser, not curl on third-party sites). Sealed links show "(sealed)".

## 8. Privacy & IP
Grep `src/` and `public/` for: phone patterns (`\+?20\s?1\d{9}`, `\b01\d{9}\b`), `C:\\`, `D:\\lab`, `DESKTOP-`,
hwid-like hex, raw domains/IPs in page text. The CV PDF (`public/Nader_Ayman_Resume.pdf`) contains the phone
number by the analyst's choice; mention it once, and switch `links.resume` when the Drive link exists. No official HP logos/fonts/quotes; footer disclaimer present.
