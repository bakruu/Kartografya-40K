# CLAUDE.md — Warhammer 40K Interactive Galaxy Map (TR/EN)

> Working name: **Kartografya 40K** (rename freely — search/replace `kartografya`).
> This file is the source of truth for how this project is built. Read it fully before writing code.

## 1. What we're building

An **open-source, fan-made, interactive 3D map of the Warhammer 40,000 galaxy**.

- **Turkish-first**, English second. Every user-facing string exists in both languages.
- Smooth on everything: a 5-year-old Android phone, a school laptop, a gaming PC.
- **Idle = zero cost.** If nothing moves, nothing renders.
- Each world/region has its own **static, SEO-friendly page** (dossier) in both languages.
- Era switch: **M41 (Pre-Rift)** ↔ **M42 (Indomitus / Great Rift)**.
- Layers: routes, labels, Great Rift overlay, Segmentum borders.
- Content creators (Reels/Shorts) can export a **9:16 screenshot** of the current view.

Inspiration: cartographia40k.com. **Do not copy its code, data, text or assets.** All coordinates, lore summaries and visuals in this repo are written/made by us.

## 2. Tech stack (do not change without discussion)

| Layer | Choice |
|---|---|
| Language | TypeScript, `strict: true` |
| Package manager | pnpm |
| Site framework | Astro (latest stable), static output (`output: 'static'`) |
| 3D rendering | Three.js (vanilla, inside one Astro island — no React unless needed later) |
| Styling | Plain CSS with custom properties (design tokens in `src/styles/tokens.css`). No Tailwind. |
| Content | Astro Content Collections (Markdown + frontmatter, validated by Zod) |
| i18n | Astro built-in i18n routing: `/tr/...` (default), `/en/...` |
| Lint/format | Biome |
| Tests | Vitest (unit), Playwright (smoke e2e) |
| CI | GitHub Actions: lint → typecheck → test → build |
| Hosting | Cloudflare Pages (or GitHub Pages) — static only |

**Not allowed:** Rust/WASM, game engines (Bevy, Unity export, etc.), heavy UI frameworks, analytics trackers, any paid service.

## 3. Folder structure

```
/
├─ CLAUDE.md
├─ README.md                 # TR first, EN below
├─ LICENSE                   # MIT (code)
├─ LICENSE-CONTENT.md        # CC BY-SA 4.0 (our lore texts) + GW disclaimer
├─ CONTRIBUTING.md           # how to add a world (TR + EN)
├─ astro.config.mjs
├─ biome.json
├─ tsconfig.json
├─ public/
│  ├─ textures/              # KTX2 only, small
│  └─ og/                    # social cards
├─ src/
│  ├─ content.config.ts      # collections (Astro 6+ requires this path)
│  ├─ content/
│  │  ├─ schemas.ts          # Zod schemas themselves, importable from unit tests
│  │  ├─ worlds/             # one .md per world, per language: terra.tr.md, terra.en.md
│  │  ├─ routes/             # warp routes (JSON)
│  │  └─ regions/            # segmentum / rift polygons (JSON)
│  ├─ i18n/
│  │  ├─ tr.json
│  │  ├─ en.json
│  │  └─ index.ts            # t(key, lang) helper, type-safe keys
│  ├─ map/                   # ALL Three.js code lives here, framework-free
│  │  ├─ MapApp.ts           # entry: init(canvas, data, options) / dispose()
│  │  ├─ renderer.ts         # renderer setup, DPR cap, render-on-demand loop
│  │  ├─ camera.ts           # camera + controls, fly-to animations
│  │  ├─ layers/
│  │  │  ├─ stars.ts         # InstancedMesh / Points — ONE draw call
│  │  │  ├─ galaxy.ts        # galaxy disc (shader)
│  │  │  ├─ rift.ts          # Great Rift (shader, era-aware)
│  │  │  ├─ routes.ts
│  │  │  ├─ labels.ts        # HTML/CSS2D or SDF text, LOD-based
│  │  │  └─ segmentums.ts
│  │  ├─ shaders/            # .glsl files
│  │  ├─ picking.ts          # raycast / GPU picking
│  │  ├─ quality.ts          # auto quality tiers (low/medium/high)
│  │  └─ events.ts           # typed event bus: select, hover, eraChange
│  ├─ components/            # .astro UI: Sidebar, Dossier, LayerToggles, EraSwitch, LangSwitch, SearchBox
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ index.astro         # redirects to /tr/
│  │  ├─ [lang]/index.astro  # the map
│  │  └─ [lang]/worlds/[slug].astro   # static dossier page
│  └─ styles/
├─ tests/
│  ├─ unit/
│  └─ e2e/
└─ .github/
   ├─ workflows/ci.yml
   ├─ ISSUE_TEMPLATE/        # bug, new-world, translation
   └─ PULL_REQUEST_TEMPLATE.md
```

Rule: `src/map/` must not import anything from Astro or UI components. UI talks to the map only through `MapApp`'s public API and the event bus.

## 4. Data schema (world)

Frontmatter of `src/content/worlds/<slug>.<lang>.md`:

```yaml
slug: terra                     # same across languages
lang: tr                        # tr | en
name: Terra
classification: throne-world    # enum key, translated via i18n
segmentum: solar                # solar | obscurus | pacificus | tempestus | ultima | none
position: { x: 0, y: 0, z: 0 }  # galactic units, see §5. Same in both language files.
eras:
  m41: { status: active }       # active | destroyed | lost | contested | warp-rift
  m42: { status: active, side: imperium-sanctus }  # imperium-sanctus | imperium-nihilus | n/a
tags: [imperium, solar]
factions: [imperium]
sources:                        # where the lore comes from (book/codex names), no copied text
  - "Codex: Space Marines (10th ed.)"
approximate: true               # position is fan-estimated
```

Body = short dossier summary **written in our own words** (max ~250 words). Never paste text from books, wikis or other sites.

- The Zod schema in `src/content/schemas.ts`, wired up in `src/content.config.ts`, must enforce all of this.
- A unit test must check: every slug has both `tr` and `en`, and their `position`/`eras` match.

## 5. Coordinate system

- Galaxy plane = XZ, Y = thickness (small values). Seen from above: +X = galactic east, +Z = galactic south.
- Units: 1 unit = 1,000 light years. Galaxy diameter ≈ 100 units, centered on origin.
- Terra is **not** at origin in the final map — it sits roughly in the Segmentum Solar position relative to the galactic core. Use `(0,0,0)` for Terra only in the initial stub data, and add a TODO.
- All positions are approximate fan estimates; the UI must say so.

## 6. Performance rules (non-negotiable)

1. **Render on demand.** Render only when: camera moves, an animation is running, hover/selection changes, or the window resizes. Idle = 0 frames. Verify with the FPS counter showing 0 when idle.
2. **One draw call for stars** (InstancedMesh or Points with per-instance attributes). No one-Mesh-per-world.
3. **DPR cap:** `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, low tier caps at 1.
4. **Effects = shaders**, not huge images. Nebula, rift, glow → fragment shaders. Textures (if any) are KTX2, ≤ 1024px.
5. **Quality tiers** (`quality.ts`): detect on first load (GPU tier heuristics + a short frame-time sample), allow manual override in UI, persist in localStorage (wrapped in try/catch).
6. **Respect `prefers-reduced-motion`:** no auto-rotation, instant camera jumps instead of fly-to.
7. **Label LOD:** far = Segmentum names only; mid = major worlds; near = all.
8. **Budgets:** initial JS for map page ≤ 250 KB gzip (Three.js included, tree-shaken). Lighthouse performance ≥ 90 on mobile for dossier pages.
9. Pause everything when the tab is hidden (`visibilitychange`).
10. `dispose()` must free all geometries, materials, textures and listeners.

## 7. i18n rules

- Default language: **tr**. Routes: `/tr/...`, `/en/...`. `/` redirects to `/tr/`.
- All UI strings come from `src/i18n/*.json`. No hard-coded user-facing text in components.
- Lore proper nouns (Terra, Cadia, Segmentum Obscurus, Adeptus Mechanicus…) stay **in English in both languages**. Translate descriptions, classifications and UI only.
- `<html lang>`, `hreflang` alternates and canonical URLs set on every page.
- Language switch keeps the user on the same world/view.

## 8. Accessibility

- Every world reachable without the 3D canvas: searchable list in the sidebar + static dossier pages.
- Keyboard: Tab through the list, Enter selects, Esc closes dossier, +/- zoom, arrow keys pan.
- Canvas has `aria-label`; selection changes announced via an `aria-live` region.
- Contrast AA minimum. Do not rely on color alone for faction/status.

## 9. Legal (must appear in README, footer and LICENSE-CONTENT.md)

> Unofficial fan-made project. Not affiliated with or endorsed by Games Workshop. Warhammer 40,000 and all associated names, races, locations and marks are © Games Workshop Ltd. Used without permission, no challenge to their status intended. Positions are approximate fan estimates.

- No official GW artwork, logos, fonts or scanned maps — ever.
- No selling, no paywalls.
- Code: MIT. Our original texts/visuals: CC BY-SA 4.0.

## 10. Roadmap (work phase by phase, one PR per phase)

- [ ] **Phase 0 — Scaffold:** Astro + TS strict + Biome + Vitest + Playwright + CI workflow + README/LICENSE/CONTRIBUTING skeletons + issue/PR templates. `pnpm build` green.
- [ ] **Phase 1 — Data:** Zod schemas, i18n helper, 5 stub worlds (Terra, Mars, Cadia, Macragge, Baal) in TR + EN, data consistency test.
- [ ] **Phase 2 — Map core:** `MapApp` with renderer, render-on-demand loop, camera controls, galaxy disc shader, stars layer (single draw call), FPS/debug overlay (dev only).
- [ ] **Phase 3 — Interaction:** hover, select (picking), fly-to, sidebar list + search, dossier panel, URL sync (`?world=cadia`) for shareable links.
- [ ] **Phase 4 — Static pages:** `/[lang]/worlds/[slug]` dossier pages, OG images, sitemap, hreflang.
- [ ] **Phase 5 — Eras & Rift:** M41/M42 switch, Great Rift shader overlay, world status per era, Sanctus/Nihilus tint.
- [ ] **Phase 6 — Layers:** routes, segmentum borders, label LOD, layer toggles persisted.
- [ ] **Phase 7 — Quality & a11y:** quality tiers, reduced motion, keyboard nav, Lighthouse/budget checks in CI.
- [ ] **Phase 8 — Creator tools:** "Share" button → PNG export of current view in 16:9 and **9:16** (Reels/Shorts), with a small watermark/credit line.
- [ ] **Phase 9 — Content expansion:** grow to 100+ worlds via community PRs.

## 11. Conventions

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`…), English.
- Code, identifiers, comments: English. Docs: TR first, then EN.
- Small, focused PRs. Each phase ends with: lint ✅ typecheck ✅ tests ✅ build ✅.
- No new dependency without a one-line justification in the PR description.
- Prefer clarity over cleverness. No premature abstractions.

## 12. Commands

```bash
pnpm install
pnpm dev          # local dev server
pnpm build        # static build to dist/
pnpm preview
pnpm lint         # biome check
pnpm typecheck    # astro check && tsc --noEmit
pnpm test         # vitest
pnpm test:e2e     # playwright
```

## 13. Definition of done (every task)

1. Works in Chrome, Firefox, Safari (desktop + mobile viewport).
2. Idle map renders 0 frames.
3. Both `tr` and `en` updated.
4. Lint, typecheck, tests, build all pass.
5. No copied lore text, no GW assets.
