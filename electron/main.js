import electron from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeConfigWithDiagnostics, reportConfigDiagnostics } from '../src/slot/config.js';
import { randomInt } from '../src/slot/random.js';
import { SpinCoordinator } from '../src/slot/SpinCoordinator.js';
import { WindowManager } from './WindowManager.js';

const { app, BrowserWindow, ipcMain, screen, session } = electron;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const rendererUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
const useDevServer = Boolean(process.env.VITE_DEV_SERVER_URL);

let config;
let windowManager;
let spinCoordinator;

function readConfig() {
  const configPath = path.join(projectRoot, 'public', 'slot-config.json');
  const visualConfigPath = path.join(projectRoot, 'public', 'visual-config.json');
  const { config: normalizedConfig, diagnostics } = normalizeConfigWithDiagnostics(
    JSON.parse(fs.readFileSync(configPath, 'utf8')),
    JSON.parse(fs.readFileSync(visualConfigPath, 'utf8')),
  );

  reportConfigDiagnostics(diagnostics);

  return normalizedConfig;
}

function createRuntime() {
  config = readConfig();
  windowManager = new WindowManager({
    app,
    BrowserWindow,
    screen,
    projectRoot,
    preloadPath: path.join(__dirname, 'preload.cjs'),
    rendererUrl,
    useDevServer,
    config,
  });
  spinCoordinator = new SpinCoordinator(config, {
    randomIndex: randomInt,
    onSpinStart: ({ reelIndex, ...payload }) => {
      windowManager.getReelWindow(reelIndex)?.webContents.send('slot:spin-start', {
        reelIndex,
        ...payload,
      });
    },
    onSpinComplete: (result) => {
      for (const win of windowManager.getValues()) {
        win.webContents.send('slot:spin-result', {
          ...result,
        });
      }
    },
  });
  windowManager.createWindows();
}

ipcMain.handle('slot:get-window-info', (event) => {
  return {
    id: windowManager.getIdForWebContents(event.sender),
    config,
  };
});

ipcMain.on('slot:request-spin', () => {
  spinCoordinator.startSpin();
});

ipcMain.on('slot:toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (!win) {
    return;
  }

  if (win.isMaximized()) {
    win.unmaximize();
    return;
  }

  win.maximize();
});

ipcMain.on('slot:reel-stopped', (event, payload) => {
  if (!windowManager.isPayloadFromReelWindow(event.sender, payload)) {
    return;
  }

  spinCoordinator.recordReelStopped(payload);
});

function installContentSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const connectSrc = useDevServer
      ? "connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*;"
      : "connect-src 'self';";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; ${connectSrc}`,
        ],
      },
    });
  });
}

app.whenReady().then(() => {
  installContentSecurityPolicy();
  createRuntime();
});

app.on('window-all-closed', () => {
  app.quit();
});
