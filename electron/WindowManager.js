import path from 'node:path';

export class WindowManager {
  constructor(options) {
    this.app = options.app;
    this.BrowserWindow = options.BrowserWindow;
    this.screen = options.screen;
    this.projectRoot = options.projectRoot;
    this.preloadPath = options.preloadPath;
    this.rendererUrl = options.rendererUrl;
    this.useDevServer = options.useDevServer;
    this.config = options.config;
    this.windows = new Map();
    this.isQuitting = false;
  }

  createWindows() {
    const { reels, rows, symbolWidth, symbolHeight, symbolGap } = this.config.game;
    const windowPadding = this.config.visual.machine.windowPadding;
    const gridHeight = rows * symbolHeight + (rows - 1) * symbolGap;
    const reelWidth = symbolWidth + windowPadding * 2;
    const reelHeight = gridHeight + windowPadding * 2;
    const gap = 22;
    const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = this.screen.getPrimaryDisplay().workArea;
    const totalWidth = reels * reelWidth + (reels - 1) * gap;
    const startX = Math.round(screenX + (screenWidth - totalWidth) / 2);
    const startY = Math.round(screenY + (screenHeight - reelHeight) / 2);

    for (let reelIndex = 0; reelIndex < reels; reelIndex += 1) {
      this.createWindow({
        id: `reel-${reelIndex}`,
        title: `Reel ${reelIndex + 1}`,
        width: reelWidth,
        height: reelHeight,
        x: startX + reelIndex * (reelWidth + gap),
        y: startY,
        query: `window=reel&reelIndex=${reelIndex}`,
      });
    }
  }

  getReelWindow(reelIndex) {
    return this.windows.get(`reel-${reelIndex}`);
  }

  getValues() {
    return this.windows.values();
  }

  getIdForWebContents(webContents) {
    return [...this.windows.entries()].find(([, win]) => win.webContents === webContents)?.[0] ?? 'unknown';
  }

  isPayloadFromReelWindow(sender, payload) {
    if (!payload || !Number.isInteger(payload.reelIndex)) {
      return false;
    }

    return this.getReelWindow(payload.reelIndex)?.webContents === sender;
  }

  createWindow({ id, title, width, height, x, y, query }) {
    const win = new this.BrowserWindow({
      title,
      width,
      height,
      x,
      y,
      useContentSize: true,
      frame: false,
      resizable: true,
      minWidth: 120,
      minHeight: 160,
      autoHideMenuBar: true,
      backgroundColor: this.config.game.backgroundColor,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.windows.set(id, win);
    win.on('closed', () => this.handleWindowClosed(id));

    if (this.useDevServer) {
      win.loadURL(`${this.rendererUrl}/?${query}`);
    } else {
      win.loadFile(path.join(this.projectRoot, 'dist', 'index.html'), {
        query: Object.fromEntries(new URLSearchParams(query)),
      });
    }

    return win;
  }

  handleWindowClosed(id) {
    this.windows.delete(id);

    if (this.isQuitting) {
      return;
    }

    this.isQuitting = true;
    for (const remainingWindow of this.windows.values()) {
      remainingWindow.close();
    }
    this.app.quit();
  }
}
