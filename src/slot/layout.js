export function createSlotLayout(config) {
  const { rows, reels, symbolWidth, symbolHeight, symbolGap, reelGap } = config.game;
  const scene = config.visual.scene;
  const symbolPitch = symbolHeight + symbolGap;
  const gridWidth = reels * symbolWidth + (reels - 1) * reelGap;
  const gridHeight = rows * symbolHeight + (rows - 1) * symbolGap;

  return {
    rows,
    reels,
    symbolWidth,
    symbolHeight,
    symbolGap,
    symbolPitch,
    reelGap,
    gridWidth,
    gridHeight,
    sceneWidth: gridWidth + scene.horizontalPadding * 2,
    sceneHeight: gridHeight + scene.topPadding + scene.bottomPadding,
    gridX: scene.horizontalPadding,
    gridY: scene.topPadding,
    maxScale: scene.maxScale,
  };
}
