import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class SymbolTileNode extends Container {
  constructor(symbol, layout, visualConfig) {
    super();
    this.addChild(
      createPlate(symbol, layout, visualConfig),
      createShine(layout, visualConfig),
      createSymbolLabel(symbol, layout, visualConfig),
    );
  }
}

function createPlate(symbol, layout, visualConfig) {
  const plate = new Graphics();

  plate.roundRect(0, 0, layout.symbolWidth, layout.symbolHeight, scaleValue(visualConfig.tileRadius, layout));
  plate.fill(symbol.color);
  plate.stroke({
    width: scaleValue(visualConfig.strokeWidth, layout),
    color: visualConfig.strokeColor,
    alpha: visualConfig.strokeAlpha,
  });

  return plate;
}

function createShine(layout, visualConfig) {
  const shine = new Graphics();

  shine.roundRect(
    scaleValue(visualConfig.shineX, layout),
    scaleValue(visualConfig.shineY, layout),
    Math.max(layout.symbolWidth - scaleValue(visualConfig.shinePaddingX, layout), 1),
    scaleValue(visualConfig.shineHeight, layout),
    scaleValue(visualConfig.shineRadius, layout),
  );
  shine.fill({ color: visualConfig.shineColor, alpha: visualConfig.shineAlpha });

  return shine;
}

function createSymbolLabel(symbol, layout, visualConfig) {
  const label = new Text({
    text: symbol.label,
    style: new TextStyle({
      fill: symbol.textColor,
      fontFamily: visualConfig.fontFamily,
      fontSize: scaleValue(
        symbol.label.length === 1
          ? visualConfig.singleCharacterFontSize
          : visualConfig.multiCharacterFontSize,
        layout,
      ),
      fontWeight: visualConfig.fontWeight,
    }),
  });

  label.anchor.set(0.5);
  label.x = layout.symbolWidth / 2;
  label.y = layout.symbolHeight / 2 + scaleValue(visualConfig.labelYOffset, layout);

  return label;
}

function scaleValue(value, layout) {
  return Math.max(value * (layout.visualScale ?? 1), 1);
}
