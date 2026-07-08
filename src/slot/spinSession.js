import { evaluateWin } from './winRules.js';

export function createSpinSession(config, randomIndex, options = {}) {
  const targets = options.guaranteeWin
    ? createWinningTargets(config, randomIndex)
    : createRandomTargets(config, randomIndex);

  return {
    spinId: createSpinId(),
    targets,
    stopped: new Set(),
    visibleSymbolsByReel: Array.from({ length: config.game.reels }, () => null),
  };
}

export function createRandomTargets(config, randomIndex) {
  return config.reelStrips.map((strip) => randomIndex(strip.length));
}

export function createWinningTargets(config, randomIndex) {
  if (config.winRule.type !== 'matchingRow') {
    return createRandomTargets(config, randomIndex);
  }

  const { rowIndex, minimumMatches } = config.winRule;
  const symbolTargets = config.symbols.map((symbol) => {
    const targets = config.reelStrips.map((strip) => findStopForSymbolOnRow(strip, symbol.id, rowIndex));

    return {
      symbolId: symbol.id,
      targets,
      matchCount: targets.filter((target) => target !== null).length,
    };
  });
  const winningSymbol = symbolTargets.find((entry) => entry.targets[0] !== null && entry.matchCount >= minimumMatches);

  if (!winningSymbol) {
    return createRandomTargets(config, randomIndex);
  }

  let matchesAssigned = 0;

  return winningSymbol.targets.map((target, reelIndex) => {
    if (target !== null && matchesAssigned < minimumMatches) {
      matchesAssigned += 1;
      return target;
    }

    if (reelIndex === 0) {
      matchesAssigned += 1;
      return target;
    }

    return randomIndex(config.reelStrips[reelIndex].length);
  });
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

function findStopForSymbolOnRow(strip, symbolId, rowIndex) {
  const symbolIndex = strip.findIndex((entry) => entry === symbolId);

  if (symbolIndex === -1) {
    return null;
  }

  return (symbolIndex - rowIndex + strip.length) % strip.length;
}
