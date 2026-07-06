import 'pixi.js/unsafe-eval';
import { Application } from 'pixi.js';
import { Actions } from 'pixi-actions';
import { loadSlotConfig } from './slot/config.js';
import { ElectronReelGame } from './slot/ElectronReelGame.js';
import { SlotGame } from './slot/SlotGame.js';
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

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.repeat) {
      game.spin();
    }
  });

  game.resize(app.screen.width, app.screen.height);
  window.addEventListener('resize', () => {
    game.resize(app.screen.width, app.screen.height);
  });
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

  window.addEventListener('keydown', (event) => {
    if (event.key === 'F11' && !event.repeat) {
      event.preventDefault();
      window.slotBridge.toggleMaximize();
      return;
    }

    if (event.key === 'Enter' && !event.repeat) {
      window.slotBridge.requestSpin();
    }
  });

  game.resize(app.screen.width, app.screen.height);
  window.addEventListener('resize', () => {
    game.resize(app.screen.width, app.screen.height);
  });

  window.slotBridge.onSpinStart(async ({ spinId, reelIndex: spinningReelIndex, targetStop }) => {
    if (spinningReelIndex !== reelIndex) {
      return;
    }

    const visibleSymbols = await game.spinTo(targetStop);
    window.slotBridge.reelStopped({ spinId, reelIndex, visibleSymbols });
  });
}
