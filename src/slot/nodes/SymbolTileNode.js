import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { getLoadedSymbolTexture, getSymbolImagePath } from '../symbolTextures.js';

export class SymbolTileNode extends Container {
  constructor(symbol, layout, visualConfig) {
    super();

    this.plate = new Graphics();
    this.shine = new Graphics();
    this.label = new Text({ text: '' });
    this.sprite = new Sprite(Texture.EMPTY);
    this.sprite.anchor.set(0.5);
    this.label.anchor.set(0.5);

    this.addChild(this.plate, this.shine, this.label, this.sprite);
    this.setSymbol(symbol, layout, visualConfig);
  }

  setSymbol(symbol, layout, visualConfig) {
    this.symbol = symbol;
    this.layout = layout;
    this.visualConfig = visualConfig;

    drawPlate(this.plate, symbol, layout, visualConfig);
    drawShine(this.shine, layout, visualConfig);
    updateSymbolLabel(this.label, symbol, layout, visualConfig);
    updateSymbolImage(this.sprite, symbol, layout, visualConfig);

    const hasImage = Boolean(getSymbolImagePath(symbol));
    this.shine.visible = !hasImage;
    this.label.visible = !hasImage || Boolean(symbol.label);
    this.sprite.visible = hasImage;
  }
}

function drawPlate(plate, symbol, layout, visualConfig) {
  plate.clear();
  plate.roundRect(0, 0, layout.symbolWidth, layout.symbolHeight, scaleValue(visualConfig.tileRadius, layout));
  plate.fill(symbol.color ?? '#202638');
  plate.stroke({
    width: scaleValue(visualConfig.strokeWidth, layout),
    color: visualConfig.strokeColor,
    alpha: visualConfig.strokeAlpha,
  });

}

function drawShine(shine, layout, visualConfig) {
  shine.clear();
  shine.roundRect(
    scaleValue(visualConfig.shineX, layout),
    scaleValue(visualConfig.shineY, layout),
    Math.max(layout.symbolWidth - scaleValue(visualConfig.shinePaddingX, layout), 1),
    scaleValue(visualConfig.shineHeight, layout),
    scaleValue(visualConfig.shineRadius, layout),
  );
  shine.fill({ color: visualConfig.shineColor, alpha: visualConfig.shineAlpha });
}

function updateSymbolImage(sprite, symbol, layout, visualConfig) {
  const image = getSymbolImagePath(symbol);

  if (!image) {
    sprite.texture = Texture.EMPTY;
    return;
  }

  sprite.texture = getLoadedSymbolTexture(image);
  const padding = scaleNonNegativeValue(symbol.imagePadding ?? visualConfig.imagePadding, layout);
  const maxWidth = Math.max(layout.symbolWidth - padding * 2, 1);
  const maxHeight = Math.max(layout.symbolHeight - padding * 2, 1);

  sprite.x = layout.symbolWidth / 2;
  sprite.y = layout.symbolHeight / 2;
  fitSymbolImage(sprite, maxWidth, maxHeight);
}

function fitSymbolImage(sprite, maxWidth, maxHeight) {
  const textureWidth = sprite.texture.width;
  const textureHeight = sprite.texture.height;

  if (!textureWidth || !textureHeight) {
    return;
  }

  sprite.scale.set(Math.min(maxWidth / textureWidth, maxHeight / textureHeight));
}

function updateSymbolLabel(label, symbol, layout, visualConfig) {
  const labelText = String(symbol.label ?? '');

  label.text = labelText;
  label.style = new TextStyle({
    fill: symbol.textColor ?? '#ffffff',
    fontFamily: visualConfig.fontFamily,
    fontSize: scaleValue(
      labelText.length === 1
        ? visualConfig.singleCharacterFontSize
        : visualConfig.multiCharacterFontSize,
      layout,
    ),
    fontWeight: visualConfig.fontWeight,
  });
  label.x = layout.symbolWidth / 2;
  label.y = layout.symbolHeight / 2 + scaleValue(visualConfig.labelYOffset, layout);
}

function scaleValue(value, layout) {
  return Math.max(value * (layout.visualScale ?? 1), 1);
}

function scaleNonNegativeValue(value, layout) {
  return Math.max(value * (layout.visualScale ?? 1), 0);
}
