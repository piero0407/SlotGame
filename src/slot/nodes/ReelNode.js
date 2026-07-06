import { Container, Graphics } from 'pixi.js';
import { Actions, Interpolations } from 'pixi-actions';
import { SymbolTileNode } from './SymbolTileNode.js';
import {
  alignStepCountToStop,
  distanceBackward,
  getBackwardStepWindowSymbols,
  getVisibleSymbols,
  wrapIndex,
} from '../reelMath.js';

export class ReelNode extends Container {
  constructor({ reelIndex, strip, symbols, layout, spinConfig, visualConfig }) {
    super();
    this.reelIndex = reelIndex;
    this.stripIds = strip;
    this.symbols = symbols;
    this.layout = layout;
    this.spinConfig = spinConfig;
    this.visualConfig = visualConfig;
    this.stop = 0;
    this.visibleSymbols = [];

    this.stripNode = new Container();
    this.maskNode = this.createMask();

    this.addChild(this.stripNode, this.maskNode);
    this.mask = this.maskNode;
  }

  setStop(stop) {
    this.stop = stop;
    this.renderStopped(stop);
  }

  resize(layout) {
    this.layout = layout;
    this.redrawMask();
    this.renderStopped(this.stop);
  }

  spinTo(targetStop) {
    const minimumSteps = this.spinConfig.cycles + this.reelIndex * 4;
    const stopDistance = distanceBackward(this.stop, targetStop, this.stripIds.length);
    const totalSteps = alignStepCountToStop(minimumSteps, stopDistance, this.stripIds.length);
    const durationSeconds = (this.spinConfig.baseDurationMs + this.reelIndex * this.spinConfig.reelDelayMs) / 1000;
    const stepDurations = this.createStepDurations(totalSteps, durationSeconds);
    let currentStop = this.stop;
    const stepActions = [];

    for (let step = 0; step < totalSteps; step += 1) {
      stepActions.push(
        Actions.runFunc(() => this.renderStepWindow(currentStop)),
        Actions.moveTo(
          this.stripNode,
          0,
          this.layout.symbolPitch,
          stepDurations[step],
          this.getSpinInterpolation(),
        ),
        Actions.runFunc(() => {
          currentStop = wrapIndex(currentStop - 1, this.stripIds.length);
          this.stop = currentStop;
          this.renderStopped(currentStop);
        }),
      );
    }

    return new Promise((resolve) => {
      Actions.sequence(
        ...stepActions,
        ...this.createSettleActions(),
        Actions.runFunc(() => {
          this.setStop(targetStop);
          resolve();
        }),
      ).play();
    });
  }

  renderStopped(stop) {
    const symbols = this.getVisibleSymbols(stop);

    this.stripNode.removeChildren();
    this.stripNode.y = 0;

    symbols.forEach((symbolId, rowIndex) => {
      const tile = this.createTile(symbolId);
      tile.y = rowIndex * this.layout.symbolPitch;
      this.stripNode.addChild(tile);
    });

    this.visibleSymbols = symbols;
  }

  renderStepWindow(currentStop) {
    const movingSymbols = getBackwardStepWindowSymbols(this.stripIds, currentStop, this.layout.rows);

    this.stripNode.removeChildren();
    this.stripNode.y = 0;

    movingSymbols.forEach((symbolId, index) => {
      const tile = this.createTile(symbolId);
      tile.y = (index - 1) * this.layout.symbolPitch;
      this.stripNode.addChild(tile);
    });
  }

  getVisibleSymbols(stop) {
    return getVisibleSymbols(this.stripIds, stop, this.layout.rows);
  }

  createTile(symbolId) {
    return new SymbolTileNode(this.symbols.get(symbolId), this.layout, this.visualConfig.symbols);
  }

  createMask() {
    const mask = new Graphics();

    this.drawMask(mask);

    return mask;
  }

  redrawMask() {
    this.maskNode.clear();
    this.drawMask(this.maskNode);
  }

  drawMask(mask) {
    mask.rect(0, 0, this.layout.symbolWidth, this.layout.gridHeight);
    mask.fill('#ffffff');
  }

  getSpinInterpolation() {
    return Interpolations[this.spinConfig.stepEase] ?? Interpolations.linear;
  }

  createStepDurations(totalSteps, durationSeconds) {
    const decelerationPower = this.spinConfig.decelerationPower ?? 2.3;
    const minWeight = 0.45;
    const weights = Array.from({ length: totalSteps }, (_, step) => {
      const progress = totalSteps <= 1 ? 1 : step / (totalSteps - 1);
      return minWeight + easeInCubic(progress) * decelerationPower;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    return weights.map((weight) => (weight / totalWeight) * durationSeconds);
  }

  createSettleActions() {
    const bounceDistance = this.spinConfig.bounceDistance ?? 18;
    const bounceDurationSeconds = (this.spinConfig.bounceDurationMs ?? 160) / 1000;

    if (bounceDistance <= 0 || bounceDurationSeconds <= 0) {
      return [];
    }

    return [
      Actions.moveTo(
        this.stripNode,
        0,
        bounceDistance,
        bounceDurationSeconds * 0.45,
        Interpolations.quadOut,
      ),
      Actions.moveTo(
        this.stripNode,
        0,
        0,
        bounceDurationSeconds * 0.55,
        Interpolations.backOut,
      ),
    ];
  }
}

function easeInCubic(progress) {
  return progress ** 3;
}
