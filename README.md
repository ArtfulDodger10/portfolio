# The Grimoire

3D portfolio of **Nader Ayman** (Artful Dodger), malware analyst & reverse engineer.
Fan-inspired wizarding styling; not affiliated with any film or book franchise.

Live: https://artfuldodger10.github.io/portfolio/ · Write-ups: https://artfuldodger10.github.io/

## What's inside
- A WebGL scene built entirely in code: an extruded crest with rune rings, instanced floating candles with
  shader flames, GPU-animated embers, a self-turning spellbook, bloom, all driven by scroll and pointer.
- The Marauder's Map: an inked SVG of a real Lumma infection chain with walking footprints.
- **Spells for every action**: Alohomora opens a case file, Colloportus seals it, Accio fetches the CV,
  Evanesco clears filters, Nox/Lumos switch modes. Type `expecto patronum` anywhere.
- **Muggle mode**: one click for a plain, light, fast page with the same content. Turns itself on without WebGL.
- Performance tiers for phones and low-core machines; `prefers-reduced-motion` respected throughout.

## Stack
Vite · React 19 · TypeScript · three.js · React Three Fiber · drei · postprocessing.

## Run
```bash
npm install
npm run dev
```

Content lives in `src/content/site.ts`. Deploys to GitHub Pages on push to `main`.
