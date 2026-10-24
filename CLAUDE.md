# The Grimoire — Nader Ayman's 3D portfolio (repo: portfolio)

A Gryffindor / wizarding-styled 3D portfolio for a malware analyst & reverse engineer.
Live target: `https://artfuldodger10.github.io/portfolio/` (GitHub Pages via Actions; the URL printed on the CV).
This is the **main portfolio**. The Chirpy blog (`../artfuldodger10.github.io`) is a separate site for the
write-ups; its old Portfolio tab moved to `/projects/` so this repo owns `/portfolio/`. They link both ways
(nav "Blog" + Daily Prophet here; sidebar hat icon + tip box there).

## Stack
Vite 8 · React 19 · TypeScript · three.js via @react-three/fiber 9 + drei 10 · @react-three/postprocessing.
No Blender: every 3D object is procedural (geometry + shaders in code) or a CC0 glTF.

## Layout
- `src/content/site.ts` — **all text and links**. Components never hard-code copy.
- `src/scene/` — the WebGL layer (fixed full-screen canvas, lazy-loaded chunk).
  `state.ts` holds scroll/pointer refs read in `useFrame` (scroll never re-renders React).
- `src/ui/` — DOM sections over the canvas, the Marauder's Map SVG, the wand-spark cursor, `CasePage` (`#/case/<id>`).
- `src/magic/` — the spell engine (`Spells.tsx`: `cast(spell, origin, action)`, house points, typed spells) and the
  placeholders for unpublished work (`Brewing.tsx`: cauldron, enchanted quill, invisibility cloak).
- `src/magic.css` — styles for spells, case pages, placeholders, Prophet, Room of Requirement.
- `src/styles.css` — tokens on `:root`, Muggle mode under `:root.muggle`.

## Non-negotiables
1. **Content first.** A recruiter must reach the case files in one click and under 10 s. The 3D never
   blocks reading: text renders before three.js loads; the loader times out at 3.5 s.
2. **Muggle mode** (plain, light, no canvas, no motion) must show *everything* the wizard view shows.
   Auto-on when WebGL is missing. `prefers-reduced-motion` freezes the scene and CSS motion.
3. **Performance budget:** three chunk ≤ 300 KB gzip; page code ≤ 100 KB gzip; 60 fps on a mid laptop,
   ≥ 30 fps on a mid phone. Low tier (≤ 768 px or ≤ 4 cores): fewer particles, no postprocessing, DPR ≤ 1.25.
   Use instancing / Points / shaders, never hundreds of separate meshes. No runtime HDR or model fetches
   from third-party CDNs (Environment uses Lightformers).
4. **Responsive:** test at 375×812, 768×1024, 1280×800, 1920×1080. No horizontal scroll. The crest
   positions itself from the text column width (`Scene.tsx` Layout) — keep CSS and that math in sync.
5. **IP:** fan-*inspired* only. No official crests, logos, film fonts, music, screenshots or likenesses;
   no long book/film quotes. Original art, Google Fonts (Cinzel, Cormorant Garamond, Caveat), CC0 assets.
   Keep the "not affiliated" footer line.
6. **Privacy / security hygiene (inherited from the lab):** no phone number in page text (it is only inside the
   CV PDF the analyst chose to publish), no lab paths, VM names,
   hwids, or anything from victim-derived files. Network IOCs defanged in prose; the Map shows stages,
   not domains. Never claim a finding the published write-up doesn't support. Unfinished work = `status: 'brewing'`
   with empty links (rendered as "sealed").
7. **Voice ("humanic"):** first person, short, specific, a little dry. Handwritten margin notes (Caveat)
   are the human touch — one per section at most. No hype words ("cutting-edge", "passionate").

## Naming map (keep consistent)
Sorting Hat = about · Great Hall = experience · Defence Against the Dark Arts = malware case files ·
Marauder's Map = CTI · Protego = detections · Room of Requirement = AI-assisted lab · Daily Prophet = blog ·
Spellbook = skills · O.W.L.s & N.E.W.T.s = certs/training · Restricted Section = reading · Duelling club = CTF ·
Owl Post = contact · Azkaban = malware I locked up · Platform 9¾ = 404 · Mischief managed = footer.

## Spells (every action is a spell; keep the mapping)
Lumos = page load + leave Muggle mode · Nox = enter Muggle mode · Alohomora = open a case file / jump to cases ·
Colloportus = close a case file · Accio = fetch the CV · Evanesco = clear filters · Revelio = reveal (Room door) ·
Ascendio = back to top · Expecto Patronum = typed easter egg. New interactions get a spell from `SPELLS` in
`src/magic/Spells.tsx`; one spell per action, cast from the click point.
House points: every visitor starts at 0 (not stored). Each distinct action pays once per visit with a chime and a
reason line: spells via `cast(..., { key })` (points/reason in `SPELLS`), other actions via `award(key, pts, reason)`
(amounts in `site.ts` `points`). Negative points (Taboo, Avada Kedavra) play a groan and a green toast.
Placement rule: buttons and links say what they do in plain words ("Open the file", "Download CV"); the spell
name lives in `data-spell` and floats above as a handwritten whisper on hover/focus, then plays when cast.
Section headings carry the wizarding names; body text stays plain professional English.
Sound: a synthesised chime (`src/magic/sound.ts`) only when house points are awarded; mute toggle in the nav.
Owl post (`src/magic/Owls.tsx`, copy in `site.ts` `owlNotes`): one note per section, ≥ 18 s apart, ≤ 4 per visit,
8 s each, "No more owls" switches them off. Keep them tips or light flavour, never nags.
3D background: candles, embers, crest, spellbook, flying winged keys (`FlyingKeys.tsx`). No logos or flags.
Azkaban (section `#azkaban`, copy in `site.ts` `azkaban`): reversed families as prisoners, the "sentence" is the
detection content. Dementors (`Dementors.tsx`, schedule in `state.ts` `dementors`) visit anywhere: first ~35 s after
load, stay 40 s, then 1.5-2.5 min away; a Patronus sends them off for 2-3 min. While here: light frost (`--cold`),
blue candles, the always-visible "Cast a Patronus" button (bottom right) pulses. The Patronus is a silver doe
made of light (`Doe.tsx`, modelled on the official Patronus style: smooth glowing body, dense blue spark comet
trail; gallops two swings across the screen (away from the wand, then back and out), ~7.5 s;
`window.__doeT = 2` freezes it in dev for screenshots); +50 when it repels dementors, +5 for practice. Points show as a "+N" rising from the click and a
banner under the counter. Typed eggs: `voldemort` (Taboo, -10), `you know who`, `avada kedavra` (-50, "YARA hit").

## Interactive layer (reacts to the visitor)
- Wand cursor (`ui/WandTrail.tsx`, `wand.css`): OPT-IN via the round wand button next to "Cast a Patronus"
  (bottom-right dock, saved in localStorage); the normal mouse is the default. Mouse/pen only; when on, the arrow is hidden (`:root.wand-cursor`),
  the wand's tip is the hotspot, glows over clickables and the crest, flicks + sparks on click.
- Golden Snitch (`magic/Snitch.tsx`): first flight 2 min after the letter, then every 2 min, 7.5 s each;
  a real button (keyboard-catchable) with a big hit area; +150. Dev: `window.__snitchNow()`.
- Candles lean away from the wand and flare (`Candles.tsx`); on phones the device tilt drives `pointer`
  (iOS asks permission on first tap, `state.ts`).
- Mist (`ui/Mist.tsx`): 2D canvas at the bottom between the scene and the text, parts around the wand.
- Marauder's Map (`ui/MaraudersMap.tsx`): route inks in with scroll, footprints walk and stop with it,
  labels appear as the feet arrive. Full map in Muggle mode / reduced motion.
- Sky (`state.ts` `skyNow`): night / dawn / day / dusk from the visitor's clock; footer says which.
- Hero emblem (`Crest.tsx` + `Wizard.tsx`, helpers in `wizardKit.ts`): a young Gryffindor wizard racing on a
  broom inside the rune rings (generic, not Harry's likeness; no trademarked broom name). Sculpted from tapered
  tubes, ink-black with a gold fresnel rim (`rimMaterial`), cloth flutters in the vertex shader (`clothMaterial`),
  ~150-twig tail shedding gold sparks. Keep him in profile: the turn towards the cursor is deliberately small. Hover spins the rings up and glows (screen position matched in `Crest.tsx`, since the DOM covers
  the canvas); click casts Lumos (+5), handled in `App.tsx`.

- Muggle mode has its own light/dark switch (moon/sun icon in the nav, only shown in Muggle mode; tokens under
  `:root.muggle.muggle-dark` in `styles.css`, saved in localStorage).

## Opening: the acceptance letter
`src/magic/Letter.tsx` + `src/letter.css`, copy in `site.ts` `letter`. After the Lumos loader, every visit
gets an envelope (wax seal, green-ink address) that opens; the letter writes itself with a quill;
"Alohomora" enters the site (+10). Click the letter to finish writing; "Skip the letter" for people in a hurry.
Not shown in Muggle mode; instant with reduced motion. Dementors and owls wait until the letter is closed.

## Unpublished work
`status: 'brewing'` → stamped "Brewing", links sealed with wax, case page shows the cauldron + quill.
Upcoming posts appear in the Prophet under the Invisibility Cloak. When something publishes, flip status,
fill hrefs, move it out of `prophet.upcoming` (skill `case-file-entry`).

## Commands
`npm run dev` (port 5173; `.claude/launch.json` in the parent workspace starts it as `portfolio`) ·
`npm run build` · `npm run lint`. Verify visual changes in the browser pane at phone and desktop sizes.

## Skills in this repo
`spellcraft-3d` (scene work) · `castle-design-system` (UI, tokens, voice) · `case-file-entry`
(add/update a project) · `portfolio-audit` (perf + responsive + a11y + privacy check before any push).
