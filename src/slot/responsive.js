const DEFAULT_SCREEN_PADDING = 16;

export function fitLayoutToScreen(target, layout, width, height, options = {}) {
  const padding = options.padding ?? DEFAULT_SCREEN_PADDING;
  const availableWidth = Math.max(width - padding * 2, 1);
  const availableHeight = Math.max(height - padding * 2, 1);
  const maxScale = Number.isFinite(layout.maxScale) ? layout.maxScale : Infinity;
  const scaleX = availableWidth / layout.sceneWidth;
  const scaleY = availableHeight / layout.sceneHeight;
  const scale = Math.min(scaleX, scaleY, maxScale);

  target.scale.set(scale);
  target.x = Math.round((width - layout.sceneWidth * scale) / 2);
  target.y = Math.round((height - layout.sceneHeight * scale) / 2);
}
