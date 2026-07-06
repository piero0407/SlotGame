# Pixi Slot Prototype

A small Vite + PixiJS prototype for a 3x3 slot game with six procedurally drawn symbols.

## Run

```bash
npm install
npm run dev
```

The browser dev server renders the whole prototype in one page. For real native windows, build and start Electron:

```bash
npm run build
npm start
```

Electron opens one native window per reel. Press Enter or click a reel window to spin.

## Data

Slot settings live in `public/slot-config.json`. Visual settings live in `public/visual-config.json`.

- `game.reels`, `game.rows`, and size fields control the grid layout.
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
