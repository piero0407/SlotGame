import { Text, TextStyle } from 'pixi.js';

export class TextLabelNode extends Text {
  constructor(text, options) {
    super({
      text,
      style: new TextStyle({
        fill: options.fill,
        fontFamily: options.fontFamily,
        fontSize: options.fontSize,
        fontWeight: options.fontWeight ?? 'normal',
      }),
    });

    this.anchor.set(0.5, 0);
  }
}
