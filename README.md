# Pixi Slot Prototype

Vite + PixiJS slot prototype with JSON-driven reels, symbols, and visual settings.

## Setup

```bash
npm install
```

## Run in browser

```bash
npm run dev
```

Vite prints a local URL in the terminal. Open it to run the browser version.

Debug controls:

- `F1`: toggle debug mode
- `Backspace`: force a winning spin when debug mode is enabled

## Build / export

```bash
npm run build
```

The build output goes to `dist/`. It includes `index.html`, bundled assets, and the JSON config files from `public/`.

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

Electron opens one native window per reel.

Controls:

- `Enter`: spin
- `F1`: toggle debug mode in any reel window
- `Backspace`: force a winning spin when debug mode is enabled

## Data

Slot settings are in `public/slot-config.json`. Visual settings are in `public/visual-config.json`.

- `game.reels`, `game.rows`, and size fields set the grid layout.
- `spin.symbolsPerSecond` sets symbol speed during a spin. Lower values move slower.
- `spin.stepEase` selects the `pixi-actions` interpolation for each symbol step.
- `winRule.rowIndex` is `0`; the current win condition checks the first visible row.
- `winRule.minimumMatches` is `3`; the first visible symbol must repeat on every reel.
- `symbols` lists the available symbols. Use `label`, `color`, and `textColor` for generated tile symbols. Add `image` to render a symbol from an image file.
- `reelStrips` sets the symbol order on each reel. If there are fewer strips than `game.reels`, missing reels use all configured symbols in order.
- `visual.scene` sets stage padding and max scale.
- `visual.machine` sets the reel-window frame style.
- `visual.symbols` sets tile shape, symbol label typography, and image padding.
- `visual.text` sets browser-mode title/status typography and runtime messages.
- `visual.button` sets the browser-mode spin button size, colors, text, and disabled alpha.

Image symbols can point to files under `public/`:

```json
{ "id": 0, "label": "7️⃣", "image": "/assets/symbols/seven.png" }
```

When `image` is present, the symbol uses only that image. Without `image`, the symbol uses the generated shape and label.
