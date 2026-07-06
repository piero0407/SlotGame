import { Container, Graphics } from 'pixi.js';
import { randomInt } from './random.js';
import { ReelNode } from './nodes/ReelNode.js';

export class ElectronReelGame extends Container {
  constructor(config, reelIndex) {
    super();
    this.config = config;
    this.reelIndex = reelIndex;
    this.symbols = new Map(config.symbols.map((symbol) => [symbol.id, symbol]));
    this.layout = createSingleReelLayout(config);

    this.background = this.createWindowBackground();
    this.addChild(this.background);
    this.reel = this.createReel();
    this.addChild(this.reel);
  }

  createReel() {
    const reel = new ReelNode({
      reelIndex: this.reelIndex,
      strip: this.config.reelStrips[this.reelIndex],
      symbols: this.symbols,
      layout: this.layout,
      spinConfig: this.config.spin,
      visualConfig: this.config.visual,
    });

    reel.x = this.layout.gridX;
    reel.y = this.layout.gridY;
    reel.setStop(randomInt(reel.stripIds.length));

    return reel;
  }

  createWindowBackground() {
    const background = new Graphics();

    this.drawWindowBackground(background);

    return background;
  }

  drawWindowBackground(background) {
    const visualConfig = this.config.visual.machine;

    background.clear();
    background.roundRect(
      0,
      0,
      this.layout.sceneWidth,
      this.layout.sceneHeight,
      scaleValue(visualConfig.windowRadius, this.layout.visualScale),
    );
    background.fill(visualConfig.windowFill);
    background.stroke({
      width: scaleValue(visualConfig.windowStrokeWidth, this.layout.visualScale),
      color: visualConfig.windowStroke,
    });
  }

  async spinTo(targetStop) {
    await this.reel.spinTo(targetStop);

    return this.reel.visibleSymbols;
  }

  resize(width, height) {
    this.scale.set(1);
    this.position.set(0);
    this.layout = createSingleReelLayout(this.config, width, height);

    this.drawWindowBackground(this.background);
    this.reel.x = this.layout.gridX;
    this.reel.y = this.layout.gridY;
    this.reel.resize(this.layout);
  }
}

function createSingleReelLayout(config, width, height) {
  const { rows } = config.game;
  const sceneWidth = Math.max(width ?? config.game.symbolWidth + config.visual.machine.windowPadding * 2, 1);
  const sceneHeight = Math.max(
    height ?? getBaseGridHeight(config) + config.visual.machine.windowPadding * 2,
    1,
  );
  const baseHeight = getBaseGridHeight(config);
  const baseSceneHeight = baseHeight + config.visual.machine.windowPadding * 2;
  const visualScale = Math.max(Math.min(sceneWidth / (config.game.symbolWidth + config.visual.machine.windowPadding * 2), sceneHeight / baseSceneHeight), 0.1);
  const padding = Math.min(
    scaleValue(config.visual.machine.windowPadding, visualScale),
    sceneWidth / 4,
    sceneHeight / 4,
  );
  const availableGridHeight = Math.max(sceneHeight - padding * 2, rows);
  const symbolGap = rows > 1
    ? Math.min(scaleValue(config.game.symbolGap, visualScale), availableGridHeight / (rows * 4))
    : 0;
  const symbolHeight = Math.max((availableGridHeight - (rows - 1) * symbolGap) / rows, 1);
  const symbolWidth = Math.max(sceneWidth - padding * 2, 1);
  const symbolPitch = symbolHeight + symbolGap;
  const gridHeight = rows * symbolHeight + (rows - 1) * symbolGap;

  return {
    rows,
    reels: 1,
    symbolWidth,
    symbolHeight,
    symbolGap,
    symbolPitch,
    reelGap: 0,
    gridWidth: symbolWidth,
    gridHeight,
    sceneWidth,
    sceneHeight,
    gridX: padding,
    gridY: padding,
    maxScale: Infinity,
    visualScale,
  };
}

function getBaseGridHeight(config) {
  return config.game.rows * config.game.symbolHeight + (config.game.rows - 1) * config.game.symbolGap;
}

function scaleValue(value, scale) {
  return Math.max(value * scale, 1);
}
