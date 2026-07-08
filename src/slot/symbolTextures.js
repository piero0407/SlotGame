import { Assets, Texture } from 'pixi.js';

const loadedTextures = new Map();

export function getSymbolImagePath(symbol) {
  return normalizeSymbolImagePath(symbol.image ?? symbol.imageUrl ?? symbol.imageSrc);
}

export async function preloadSymbolImages(config, options = {}) {
  const allowedSymbolIds = options.symbolIds ? new Set(options.symbolIds) : null;
  const imagePaths = [
    ...new Set(config.symbols
      .filter((symbol) => !allowedSymbolIds || allowedSymbolIds.has(symbol.id))
      .map(getSymbolImagePath)
      .filter(Boolean)),
  ];

  await Promise.all(imagePaths.map(async (image) => {
    try {
      loadedTextures.set(image, await Assets.load(image));
    } catch (error) {
      console.warn(`Unable to preload symbol image "${image}".`, error);
    }
  }));
}

export function getLoadedSymbolTexture(image) {
  return loadedTextures.get(image) ?? Texture.from(image);
}

function normalizeSymbolImagePath(image) {
  if (
    !image?.startsWith('/')
    || typeof window === 'undefined'
    || !window.location.protocol.startsWith('file')
  ) {
    return image;
  }

  return `.${image}`;
}
