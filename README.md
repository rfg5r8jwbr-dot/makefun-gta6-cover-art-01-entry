# makefun-gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rfg5r8jwbr-dot/makefun-gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rfg5r8jwbr-dot/makefun-gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn 1–4 of your own photos into a multi-panel GTA-style poster and export it as a PNG — fully offline, in your browser, in three steps.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=4q7hssxn&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

## What it does

- **Layouts** — Quad (2×2 grid), Hero (one large panel + two small), Triptych
  (three vertical panels) and Full-bleed (one photo, edge to edge), with thin
  white gutters and a diagonal accent bar in the caption band.
- **Any photo** — upload 1–4 photos (or drag them onto the preview), or try the
  two bundled samples. Click a panel to select it, drag to pan, scroll to zoom;
  each panel has its own zoom / X-Y pan sliders, grade (Sunset / Neon / Noir /
  Clean / Vice) and flip toggle. Photos land face-safe: a wide panel shows the
  top of a portrait photo, not its middle.
- **Caption** — editable title (default `SUNSET HEIST`) and subtitle (default
  `LEONIDA`), with Sunset / Neon / Mono / Vice lettering styles and a bold
  outline, set in the vendored Anton (OFL) with a sunset-gradient fill and a
  Pacifico script subtitle, sized to fit.
- **The art** — a code-drawn Vice City sunset (magenta-orange-purple gradient,
  glowing sun disc, sunset-lit palm silhouettes, a five-star heat meter,
  scanlines, grain, vignette) with a white outer border. No Rockstar logos,
  artwork or fonts; the two display fonts are vendored under `app/fonts/`
  with their OFL texts, and everything else is code.
- **Fast export** — one click renders the cover at exactly 1080×1080,
  1080×1350 or 1920×1080 and downloads `vice-cover-<WxH>.png`; one more
  button exports all three sizes at once.

## How it is built

- `app/index.html` + `app/style.css` — dark neon editor, controls on the left,
  live preview on the right.
- `app/fonts/` — Anton and Pacifico (SIL OFL, license texts beside them),
  loaded locally with `@font-face`; no network anywhere in the app.
- `app/src/cover.js` — the renderer: `drawCover`, `layoutPanels`,
  `drawSunsetBackdrop`, `drawPalm`, `drawPanelPhoto`, `drawCaption`,
  `drawFinish`, plus the `drawStar` heat meter.
- `app/src/main.js` — editor state, upload / drag-drop / drag-pan / wheel-zoom,
  per-panel controls, and `exportCover` (offscreen canvas → PNG download).
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots, sets
  `window.__shotReady` once painted.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.

## Screenshots

`shots.json` lists the four shots: the quad cover (1080×1080), the editor with
a photo loaded (1280×720), the wide full-bleed cover (1920×1080, shown
1280×720) and the tall triptych cover (1080×1350, shown 1024×1280). Every
cover mixes both sample photos across its panels, and every panel is cropped
face-safe.

Built for the [make.fun](https://make.fun/r/4q7hssxn) bounty
`gta6-cover-art-01` — "Make GTA 6 Cover Art".
