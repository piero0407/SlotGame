export async function loadSlotConfig(path, options = {}) {
  const visualConfigPath = options.visualConfigPath ?? '/visual-config.json';
  const [response, visualResponse] = await Promise.all([
    fetch(path),
    fetch(visualConfigPath),
  ]);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}: ${response.status}`);
  }

  if (!visualResponse.ok) {
    throw new Error(`Unable to load ${visualConfigPath}: ${visualResponse.status}`);
  }

  const { config, diagnostics } = normalizeConfigWithDiagnostics(
    await response.json(),
    await visualResponse.json(),
  );
  reportConfigDiagnostics(diagnostics, options.logger ?? console);

  return config;
}

const defaultVisualConfig = {
  scene: {
    horizontalPadding: 48,
    topPadding: 94,
    bottomPadding: 136,
    maxScale: 1,
  },
  machine: {
    bodyY: 54,
    bodyBottomPadding: 126,
    bodyRadius: 8,
    bodyFill: '#222738',
    bodyStroke: '#394158',
    bodyStrokeWidth: 3,
    windowPadding: 14,
    windowRadius: 8,
    windowFill: '#151927',
    windowStroke: '#56617d',
    windowStrokeWidth: 2,
  },
  symbols: {
    tileRadius: 8,
    strokeColor: '#ffffff',
    strokeAlpha: 0.28,
    strokeWidth: 3,
    shineX: 10,
    shineY: 10,
    shineHeight: 28,
    shinePaddingX: 20,
    shineRadius: 8,
    shineColor: '#ffffff',
    shineAlpha: 0.16,
    fontFamily: 'Arial, sans-serif',
    singleCharacterFontSize: 62,
    multiCharacterFontSize: 44,
    fontWeight: '900',
    labelYOffset: 3,
  },
  text: {
    titleFontSize: 32,
    titleColor: '#f5f7fb',
    titleWeight: 'bold',
    titleY: 10,
    statusFontSize: 18,
    statusColor: '#b8bfd8',
    fontFamily: 'Arial, sans-serif',
    idleMessage: 'Top row match pays. Press SPIN.',
    spinningMessage: 'Spinning...',
    loseMessage: 'No win. Try again.',
    winMessageSuffix: 'across the top row',
    statusGapBelowGrid: 35,
  },
  button: {
    label: 'SPIN',
    width: 154,
    height: 54,
    radius: 8,
    fill: '#f5c542',
    stroke: '#fff0a8',
    strokeWidth: 2,
    textColor: '#261c05',
    fontFamily: 'Arial, sans-serif',
    fontSize: 22,
    fontWeight: '900',
    disabledAlpha: 0.55,
    gapBelowGrid: 76,
  },
};

export function normalizeConfig(rawConfig, visualConfig) {
  return normalizeConfigWithDiagnostics(rawConfig, visualConfig).config;
}

export function normalizeConfigWithDiagnostics(rawConfig, visualConfig) {
  const mergedRawConfig = mergeRawConfig(rawConfig, visualConfig);
  const reelCount = Math.max(1, mergedRawConfig.game.reels);
  const symbolIds = mergedRawConfig.symbols.map((symbol) => symbol.id);
  const diagnostics = [];

  if (symbolIds.length === 0) {
    throw new Error('slot-config.json must define at least one symbol.');
  }

  const reelStrips = Array.from({ length: reelCount }, (_, reelIndex) => {
    const configuredStrip = mergedRawConfig.reelStrips[reelIndex];
    const strip = Array.isArray(configuredStrip) && configuredStrip.length > 0
      ? configuredStrip
      : symbolIds;

    return strip.map((symbolId) => {
      if (symbolIds.includes(symbolId)) {
        return symbolId;
      }

      diagnostics.push({
        level: 'warning',
        message: `Unknown symbol "${symbolId}" in reel ${reelIndex + 1}; using "${symbolIds[0]}".`,
      });
      return symbolIds[0];
    });
  });

  return {
    config: {
      ...mergedRawConfig,
      game: {
        ...mergedRawConfig.game,
        reels: reelCount,
        symbolWidth: mergedRawConfig.game.symbolWidth ?? mergedRawConfig.game.symbolSize,
        symbolHeight: mergedRawConfig.game.symbolHeight ?? mergedRawConfig.game.symbolSize,
      },
      visual: mergeVisualConfig(mergedRawConfig.visual),
      reelStrips,
    },
    diagnostics,
  };
}

export function reportConfigDiagnostics(diagnostics, logger = console) {
  diagnostics.forEach((diagnostic) => {
    if (diagnostic.level === 'warning') {
      logger.warn(diagnostic.message);
    }
  });
}

function mergeVisualConfig(visual = {}) {
  return Object.fromEntries(
    Object.entries(defaultVisualConfig).map(([section, defaults]) => [
      section,
      {
        ...defaults,
        ...visual[section],
      },
    ]),
  );
}

function mergeRawConfig(rawConfig, visualConfig) {
  if (visualConfig === undefined) {
    return rawConfig;
  }

  return {
    ...rawConfig,
    visual: visualConfig.visual ?? visualConfig,
  };
}
