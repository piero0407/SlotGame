import { randomInt } from './random.js';
import { completeSpin, createSpinSession, recordReelStopped } from './spinSession.js';

export class SpinCoordinator {
  constructor(config, options = {}) {
    this.config = config;
    this.randomIndex = options.randomIndex ?? randomInt;
    this.onSpinStart = options.onSpinStart ?? (() => {});
    this.onSpinComplete = options.onSpinComplete ?? (() => {});
    this.activeSession = null;
  }

  get spinning() {
    return Boolean(this.activeSession);
  }

  startSpin() {
    if (this.activeSession) {
      return null;
    }

    this.activeSession = createSpinSession(this.config, this.randomIndex);

    this.activeSession.targets.forEach((targetStop, reelIndex) => {
      this.onSpinStart({
        spinId: this.activeSession.spinId,
        reelIndex,
        targetStop,
      });
    });

    return this.activeSession;
  }

  recordReelStopped(payload) {
    if (!this.activeSession) {
      return { accepted: false, complete: false, reason: 'no-active-spin' };
    }

    const stop = recordReelStopped(this.activeSession, this.config, payload);

    if (!stop.complete) {
      return stop;
    }

    const result = completeSpin(this.activeSession, this.config);
    this.activeSession = null;
    this.onSpinComplete(result);

    return {
      ...stop,
      result,
    };
  }
}
