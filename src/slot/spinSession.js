import { evaluateWin } from './winRules.js';

export function createSpinSession(config, randomIndex) {
  const targets = config.reelStrips.map((strip) => randomIndex(strip.length));

  return {
    spinId: createSpinId(),
    targets,
    stopped: new Set(),
    visibleSymbolsByReel: Array.from({ length: config.game.reels }, () => null),
  };
}

export function recordReelStopped(session, config, payload) {
  if (!isValidStopPayload(payload, config)) {
    return { accepted: false, complete: false, reason: 'invalid-payload' };
  }

  if (payload.spinId !== session.spinId) {
    return { accepted: false, complete: false, reason: 'stale-spin' };
  }

  if (session.stopped.has(payload.reelIndex)) {
    return { accepted: false, complete: false, reason: 'duplicate-reel' };
  }

  session.stopped.add(payload.reelIndex);
  session.visibleSymbolsByReel[payload.reelIndex] = payload.visibleSymbols;

  return {
    accepted: true,
    complete: session.stopped.size === config.game.reels,
    reason: null,
  };
}

export function completeSpin(session, config) {
  const result = evaluateWin(session.visibleSymbolsByReel, config.winRule);

  return {
    ...result,
    message: formatSpinResult(result, config),
  };
}

export function formatSpinResult(result, config) {
  if (!result.win) {
    return config.visual.text.loseMessage;
  }

  const symbol = config.symbols.find((entry) => entry.id === result.symbolId);
  return `WIN: ${symbol?.label ?? result.symbolId} ${config.visual.text.winMessageSuffix}`;
}

export function isValidStopPayload(payload, config) {
  return Boolean(
    payload
      && typeof payload.spinId === 'string'
      && Number.isInteger(payload.reelIndex)
      && payload.reelIndex >= 0
      && payload.reelIndex < config.game.reels
      && Array.isArray(payload.visibleSymbols)
      && payload.visibleSymbols.length === config.game.rows
      && payload.visibleSymbols.every((symbolId) => config.symbols.some((symbol) => symbol.id === symbolId)),
  );
}

function createSpinId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
