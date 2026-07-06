import { Container } from 'pixi.js';
import { createSlotLayout } from './layout.js';
import { randomInt } from './random.js';
import { fitLayoutToScreen } from './responsive.js';
import { SpinCoordinator } from './SpinCoordinator.js';
import { ReelNode } from './nodes/ReelNode.js';
import { SpinButtonNode } from './nodes/SpinButtonNode.js';
import { TextLabelNode } from './nodes/TextLabelNode.js';

export class SlotGame extends Container {
  constructor(config, options = {}) {
    super();
    this.config = config;
    this.layout = createSlotLayout(config);
    this.symbols = new Map(config.symbols.map((symbol) => [symbol.id, symbol]));
    this.reels = [];
    this.spinning = false;
    this.randomIndex = options.randomIndex ?? randomInt;
    this.spinCoordinator = options.spinCoordinator ?? new SpinCoordinator(config, {
      randomIndex: this.randomIndex,
    });

    this.reelsLayer = new Container();
    this.overlayLayer = new Container();

    this.addChild(this.reelsLayer, this.overlayLayer);
    this.build();
  }

  build() {
    this.createReels();
    this.createOverlay();
  }

  createReels() {
    for (let reelIndex = 0; reelIndex < this.layout.reels; reelIndex += 1) {
      const reel = new ReelNode({
        reelIndex,
        strip: this.config.reelStrips[reelIndex],
        symbols: this.symbols,
        layout: this.layout,
        spinConfig: this.config.spin,
        visualConfig: this.config.visual,
      });

      reel.x = this.layout.gridX + reelIndex * (this.layout.symbolWidth + this.layout.reelGap);
      reel.y = this.layout.gridY;
      reel.setStop(this.randomIndex(reel.stripIds.length));

      this.reelsLayer.addChild(reel);
      this.reels.push(reel);
    }
  }

  createOverlay() {
    const text = this.config.visual.text;

    this.title = new TextLabelNode(this.config.game.title, {
      fill: text.titleColor,
      fontFamily: text.fontFamily,
      fontSize: text.titleFontSize,
      fontWeight: text.titleWeight,
    });
    this.status = new TextLabelNode(text.idleMessage, {
      fill: text.statusColor,
      fontFamily: text.fontFamily,
      fontSize: text.statusFontSize,
    });
    this.spinButton = new SpinButtonNode(this.config.visual.button);

    this.overlayLayer.addChild(this.title, this.status, this.spinButton);
    this.spinButton.on('pointertap', () => this.spin());
  }

  async spin() {
    if (this.spinning) {
      return;
    }

    this.spinning = true;
    this.spinButton.setEnabled(false);
    this.status.text = this.config.visual.text.spinningMessage;

    const session = this.spinCoordinator.startSpin();
    let result = null;

    if (!session) {
      return;
    }

    const spins = this.reels.map(async (reel, reelIndex) => {
      await reel.spinTo(session.targets[reelIndex]);
      const stop = this.spinCoordinator.recordReelStopped({
        spinId: session.spinId,
        reelIndex,
        visibleSymbols: reel.visibleSymbols,
      });

      if (stop.complete) {
        result = stop.result;
      }
    });

    await Promise.all(spins);
    this.status.text = result?.message ?? this.config.visual.text.loseMessage;

    this.spinning = false;
    this.spinButton.setEnabled(true);
  }

  resize(width, height) {
    fitLayoutToScreen(this, this.layout, width, height);
    this.positionOverlay();
  }

  positionOverlay() {
    this.title.x = this.layout.sceneWidth / 2;
    this.title.y = this.config.visual.text.titleY;
    this.status.x = this.layout.sceneWidth / 2;
    this.status.y = this.layout.gridY + this.layout.gridHeight + this.config.visual.text.statusGapBelowGrid;
    this.spinButton.x = this.layout.sceneWidth / 2 - this.config.visual.button.width / 2;
    this.spinButton.y = this.layout.gridY + this.layout.gridHeight + this.config.visual.button.gapBelowGrid;
  }
}
