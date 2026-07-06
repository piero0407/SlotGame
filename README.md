# Pixi Slot Prototype

A small Vite + PixiJS prototype for a slot game with six procedurally drawn symbols.

## Setup

```bash
npm install
```

## Run in browser

```bash
npm run dev
```

Vite prints a local URL in the terminal. Open that URL in a browser to play the prototype on one page.

## Build / export

```bash
npm run build
```

The production build is exported to `dist/`. The exported folder includes `index.html`, bundled assets, and the JSON config files from `public/`.

To test the exported build locally:

```bash
npm run preview
```

## Run in Electron

Build first, then start Electron:

```bash
npm run build
npm start
```

Electron opens one native window per reel. Press Enter to spin.

## Data

Slot settings live in `public/slot-config.json`. Visual settings live in `public/visual-config.json`.

- `game.reels`, `game.rows`, and size fields control the grid layout.
- `spin.symbolsPerSecond` controls how fast symbols move during a spin. Lower values move slower.
- `spin.stepEase` chooses the `pixi-actions` interpolation used for each moving symbol step.
- `winRule.rowIndex` is `0`, so the current win condition checks the first visible row.
- `winRule.minimumMatches` is `3`, so the first visible symbol must repeat on every reel.
- `symbols` defines the six available symbols and their display colors.
- `reelStrips` defines the symbol order on each reel. If there are fewer strips than `game.reels`, the missing reels use all configured symbols in order.
- `visual.scene` controls stage padding and max scale.
- `visual.machine` controls the independent reel-window colors, strokes, padding, and radius.
- `visual.symbols` controls tile radius, shine, stroke, and symbol label typography.
- `visual.text` controls browser-mode title/status typography and runtime messages.
- `visual.button` controls the browser-mode spin button size, colors, text, and disabled alpha.
