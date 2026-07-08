import 'pixi.js/unsafe-eval';
import { Application } from 'pixi.js';
import { Actions } from 'pixi-actions';
import { loadSlotConfig } from './slot/config.js';
import { ElectronReelGame } from './slot/ElectronReelGame.js';
import { SlotGame } from './slot/SlotGame.js';
import { preloadSymbolImages } from './slot/symbolTextures.js';
import './style.css';

const root = document.querySelector('#app');

bootstrap().catch((error) => {
  console.error(error);
  showFatalError(error);
});

async function bootstrap() {
  if (window.slotBridge) {
    await bootstrapElectronWindow();
    return;
  }

  await bootstrapBrowserGame();
}

async function bootstrapBrowserGame() {
  const app = new Application();
  const config = await loadSlotConfig('/slot-config.json');
  await preloadSymbolImages(config);
  const game = new SlotGame(config);

  await app.init({
    background: config.game.backgroundColor,
    resizeTo: root,
    antialias: true,
  });

  app.ticker.maxFPS = 60;
  root.appendChild(app.canvas);
  app.ticker.add((tick) => Actions.tick(tick.deltaTime / 60));
  app.stage.addChild(game);
  game.setDebugMode(config.game.debugMode);
  const scheduleResize = createResizeScheduler(app, game);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'F1' && !event.repeat) {
      event.preventDefault();
      game.setDebugMode(true);
      return;
    }

    if (event.key === 'Backspace' && !event.repeat && game.config.game.debugMode) {
      event.preventDefault();
      game.spin({ guaranteeWin: true });
      return;
    }

    if (event.key === 'Enter' && !event.repeat) {
      game.spin();
    }
  });

  observeRootResize(scheduleResize);
  scheduleResize();
  window.addEventListener('resize', scheduleResize);
}

async function bootstrapElectronWindow() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('window');
  const { config } = await window.slotBridge.getWindowInfo();

  if (mode === 'reel') {
    await bootstrapReel(config, Number(params.get('reelIndex') ?? 0));
  }
}

function showFatalError(error) {
  root.textContent = '';
  const errorNode = document.createElement('pre');
  errorNode.style.cssText = [
    'margin: 12px',
    'padding: 12px',
    'white-space: pre-wrap',
    'color: #ff8a8a',
    'background: #1b1f30',
    'border: 1px solid #5d2430',
    'font: 12px/1.4 Consolas, monospace',
  ].join(';');
  errorNode.textContent = error?.stack ?? String(error);
  root.appendChild(errorNode);
}

async function bootstrapReel(config, reelIndex) {
  const app = new Application();
  const reelSymbolIds = config.reelStrips[reelIndex] ?? [];
  await preloadSymbolImages(config, { symbolIds: reelSymbolIds });
  const game = new ElectronReelGame(config, reelIndex);

  await app.init({
    background: config.game.backgroundColor,
    resizeTo: root,
    antialias: true,
  });

  app.ticker.maxFPS = 60;
  root.appendChild(app.canvas);
  app.ticker.add((tick) => Actions.tick(tick.deltaTime / 60));
  app.stage.addChild(game);
  const scheduleResize = createResizeScheduler(app, game);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'F1' && !event.repeat) {
      event.preventDefault();
      window.slotBridge.enableDebugMode();
      return;
    }

    if (event.key === 'F11' && !event.repeat) {
      event.preventDefault();
      window.slotBridge.toggleMaximize();
      return;
    }

    if (event.key === 'Enter' && !event.repeat) {
      window.slotBridge.requestSpin();
      return;
    }

    if (event.key === 'Backspace' && !event.repeat && config.game.debugMode) {
      event.preventDefault();
      window.slotBridge.requestSpin({ guaranteeWin: true });
    }
  });

  observeRootResize(scheduleResize);
  scheduleResize();
  window.addEventListener('resize', scheduleResize);

  window.slotBridge.onSpinStart(async ({ spinId, reelIndex: spinningReelIndex, targetStop }) => {
    if (spinningReelIndex !== reelIndex) {
      return;
    }

    const visibleSymbols = await game.spinTo(targetStop);
    window.slotBridge.reelStopped({ spinId, reelIndex, visibleSymbols });
  });

  window.slotBridge.onDebugModeChanged(({ debugMode }) => {
    config.game.debugMode = debugMode === true;
    game.setDebugMode(config.game.debugMode);
  });
}

function createResizeScheduler(app, game) {
  let animationFrame = null;

  return () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(() => {
      animationFrame = null;
      const width = Math.max(root.clientWidth, 1);
      const height = Math.max(root.clientHeight, 1);

      if (app.renderer.width !== width || app.renderer.height !== height) {
        app.renderer.resize(width, height);
      }

      game.resize(width, height);
    });
  };
}

function observeRootResize(scheduleResize) {
  if (!window.ResizeObserver) {
    return;
  }

  const observer = new ResizeObserver(scheduleResize);
  observer.observe(root);
}
