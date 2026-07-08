import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeConfig } from '../src/slot/config.js';
import { SpinCoordinator } from '../src/slot/SpinCoordinator.js';
import {
  alignStepCountToStop,
  distanceBackward,
  distanceForward,
  getBackwardStepWindowSymbols,
  getVisibleSymbols,
  wrapIndex,
} from '../src/slot/reelMath.js';
import {
  createSpinSession,
  createWinningTargets,
  recordReelStopped,
  completeSpin,
  formatSpinResult,
} from '../src/slot/spinSession.js';
import { evaluateWin } from '../src/slot/winRules.js';

const baseConfig = normalizeConfig({
  game: {
    title: 'Test Slot',
    reels: 3,
    rows: 1,
    symbolSize: 100,
    symbolGap: 0,
    reelGap: 0,
    backgroundColor: '#000000',
  },
  spin: {
    symbolsPerSecond: 3,
    reelDelayMs: 0,
    cycles: 1,
    stepEase: 'linear',
  },
  winRule: {
    type: 'matchingRow',
    rowIndex: 0,
    minimumMatches: 3,
  },
  symbols: [
    { id: 'a', label: 'A', color: '#111111', textColor: '#ffffff' },
    { id: 'b', label: 'B', color: '#222222', textColor: '#ffffff' },
  ],
  reelStrips: [
    ['a', 'b'],
    ['a', 'b'],
    ['a', 'b'],
  ],
});

test('reel math wraps forward and visible symbols', () => {
  assert.equal(wrapIndex(-1, 3), 2);
  assert.equal(distanceForward(2, 1, 3), 2);
  assert.equal(distanceBackward(1, 2, 3), 2);
  assert.deepEqual(getVisibleSymbols(['a', 'b', 'c'], 2, 3), ['c', 'a', 'b']);
  assert.deepEqual(getBackwardStepWindowSymbols(['a', 'b', 'c', 'd'], 1, 2), ['a', 'b', 'c']);
  assert.equal(alignStepCountToStop(18, 3, 8), 19);
});

test('config normalizes missing strips and replaces unknown symbols', () => {
  const config = normalizeConfig({
    ...baseConfig,
    game: { ...baseConfig.game, reels: 2 },
    reelStrips: [['missing']],
  });

  assert.equal(config.game.symbolWidth, 100);
  assert.equal(config.game.symbolHeight, 100);
  assert.deepEqual(config.reelStrips, [['a'], ['a', 'b']]);
});

test('config merges separate visual settings with defaults', () => {
  const config = normalizeConfig(
    {
      ...baseConfig,
      visual: {
        scene: {
          maxScale: 1,
        },
      },
    },
    {
      scene: {
        maxScale: 2,
      },
      text: {
        idleMessage: 'Ready.',
      },
    },
  );

  assert.equal(config.visual.scene.maxScale, 2);
  assert.equal(config.visual.text.idleMessage, 'Ready.');
  assert.equal(config.visual.button.label, 'SPIN');
});

test('config defaults debug mode off and accepts explicit enable', () => {
  assert.equal(baseConfig.game.debugMode, false);
  assert.equal(normalizeConfig({
    ...baseConfig,
    game: {
      ...baseConfig.game,
      debugMode: true,
    },
  }).game.debugMode, true);
});

test('win rules evaluate matching row', () => {
  assert.deepEqual(evaluateWin([['a'], ['a'], ['a']], baseConfig.winRule), {
    win: true,
    symbolId: 'a',
  });
  assert.deepEqual(evaluateWin([['a'], ['b'], ['a']], baseConfig.winRule), {
    win: false,
    symbolId: 'a',
  });
});

test('win rules reject unsupported rule types', () => {
  assert.throws(
    () => evaluateWin([['a'], ['a'], ['a']], { type: 'unknown' }),
    /Unsupported win rule type: unknown/,
  );
});

test('spin session rejects stale, duplicate, and invalid stop payloads', () => {
  const session = createSpinSession(baseConfig, () => 0);

  assert.equal(recordReelStopped(session, baseConfig, {
    spinId: 'old-spin',
    reelIndex: 0,
    visibleSymbols: ['a'],
  }).reason, 'stale-spin');

  assert.equal(recordReelStopped(session, baseConfig, {
    spinId: session.spinId,
    reelIndex: 0,
    visibleSymbols: ['x'],
  }).reason, 'invalid-payload');

  assert.equal(recordReelStopped(session, baseConfig, {
    spinId: session.spinId,
    reelIndex: 0,
    visibleSymbols: ['a'],
  }).accepted, true);

  assert.equal(recordReelStopped(session, baseConfig, {
    spinId: session.spinId,
    reelIndex: 0,
    visibleSymbols: ['a'],
  }).reason, 'duplicate-reel');
});

test('spin session completes with formatted result', () => {
  const session = createSpinSession(baseConfig, () => 0);

  for (let reelIndex = 0; reelIndex < baseConfig.game.reels; reelIndex += 1) {
    recordReelStopped(session, baseConfig, {
      spinId: session.spinId,
      reelIndex,
      visibleSymbols: ['a'],
    });
  }

  assert.equal(completeSpin(session, baseConfig).message, 'WIN: A across the top row');
  assert.equal(formatSpinResult({ win: false, symbolId: 'a' }, baseConfig), 'No win. Try again.');
});

test('spin session can target a guaranteed win', () => {
  const session = createSpinSession(baseConfig, () => 1, { guaranteeWin: true });
  const visibleSymbolsByReel = session.targets.map((target, reelIndex) => (
    getVisibleSymbols(baseConfig.reelStrips[reelIndex], target, baseConfig.game.rows)
  ));

  assert.equal(evaluateWin(visibleSymbolsByReel, baseConfig.winRule).win, true);
});

test('winning targets respect matching row index', () => {
  const config = normalizeConfig({
    ...baseConfig,
    game: { ...baseConfig.game, rows: 2 },
    winRule: {
      type: 'matchingRow',
      rowIndex: 1,
      minimumMatches: 3,
    },
    reelStrips: [
      ['b', 'a'],
      ['a', 'b'],
      ['b', 'a'],
    ],
  });
  const targets = createWinningTargets(config, () => 0);
  const visibleSymbolsByReel = targets.map((target, reelIndex) => (
    getVisibleSymbols(config.reelStrips[reelIndex], target, config.game.rows)
  ));

  assert.equal(evaluateWin(visibleSymbolsByReel, config.winRule).win, true);
});

test('spin coordinator starts reels and emits one completion result', () => {
  const starts = [];
  const results = [];
  const coordinator = new SpinCoordinator(baseConfig, {
    randomIndex: () => 0,
    onSpinStart: (payload) => starts.push(payload),
    onSpinComplete: (result) => results.push(result),
  });
  const session = coordinator.startSpin();

  assert.equal(starts.length, baseConfig.game.reels);
  assert.equal(coordinator.startSpin(), null);

  for (let reelIndex = 0; reelIndex < baseConfig.game.reels; reelIndex += 1) {
    coordinator.recordReelStopped({
      spinId: session.spinId,
      reelIndex,
      visibleSymbols: ['a'],
    });
  }

  assert.equal(results.length, 1);
  assert.equal(results[0].message, 'WIN: A across the top row');
  assert.equal(coordinator.spinning, false);
});
