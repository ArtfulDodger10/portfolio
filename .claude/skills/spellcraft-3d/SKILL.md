---
name: spellcraft-3d
description: Build or change anything in the 3D layer of the Grimoire portfolio (src/scene) — new objects, shaders, particles, camera moves, scroll choreography, postprocessing, performance tiers. Use for "add a 3D ...", "make the scene ...", "new room/section visual", shader or fps work.
---

# Spellcraft: the 3D layer

## Before writing code
1. Read `CLAUDE.md` (budget, tiers, IP rules) and `src/scene/Scene.tsx` (how objects are placed along the scroll path).
2. Decide where the object lives on the camera path. The camera descends `DEPTH` (44) units over the page:
   `y = -scroll.progress * DEPTH`. Find the section's scroll progress in the browser
   (`el.offsetTop / (scrollHeight - innerHeight)`) and place the object near that y.
3. Wide screens keep the right side free for 3D (text column is left). Narrow screens: object above or behind
   text, dimmer, smaller.

## How to build (no Blender)
- Procedural first: `ExtrudeGeometry` from `THREE.Shape` (crest, monogram), lathe for goblets/candles,
  `TubeGeometry` along curves for wand streaks, instanced boxes for runes.
- Many similar things → `InstancedMesh` or `Points` + `shaderMaterial`. Never map over hundreds of `<mesh>`.
- Motion in shaders when possible (see `Embers.tsx`); CPU updates only for < ~200 instances.
- Deterministic layouts: use `mulberry(seed)` from `Candles.tsx`, not `Math.random`, so the scene is stable.
- If a real model is unavoidable: CC0 only (Poly Haven, Quaternius, Kenney), store in `public/models/`,
  compress with `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp`,
  ≤ 400 KB each, load with `useGLTF` inside `<Suspense>`. Record source + licence in `public/models/CREDITS.md`.
- Every `useFrame` reads `animate`; when false (reduced motion) render a pleasing static pose.
- Pointer and scroll come from `state.ts` refs. Do not add React state that changes per frame.
- Damping: `THREE.MathUtils.damp(current, target, lambda, dt)`, not raw lerp.

## Look
Palette: night `#07060b`, gold `#e0b354`/`#ffd98a`, scarlet `#a3202a`/`#5a0f14`, candle `#ffb35c`.
Emissive or `toneMapped={false}` on things that should bloom; keep bloom threshold ~0.55 so text-adjacent
areas don't wash out. Fog hides the far end of the tower; keep new objects inside fog range (9–32).

## Done means
- `npm run build` passes, three chunk still ≤ 300 KB gzip (check the build output).
- Checked in the browser pane at 375×812 and ≥ 1280 wide, plus Muggle mode still fine.
- Low tier: object either cheap or skipped (`tier.low`).
- No new console errors.
