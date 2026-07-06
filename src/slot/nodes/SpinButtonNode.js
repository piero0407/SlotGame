import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class SpinButtonNode extends Container {
  constructor(visualConfig) {
    super();
    this.visualConfig = visualConfig;
    this.addChild(this.createBase(), this.createLabel());
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  setEnabled(enabled) {
    this.alpha = enabled ? 1 : this.visualConfig.disabledAlpha;
    this.eventMode = enabled ? 'static' : 'none';
  }

  createBase() {
    const base = new Graphics();

    base.roundRect(0, 0, this.visualConfig.width, this.visualConfig.height, this.visualConfig.radius);
    base.fill(this.visualConfig.fill);
    base.stroke({ width: this.visualConfig.strokeWidth, color: this.visualConfig.stroke });

    return base;
  }

  createLabel() {
    const label = new Text({
      text: this.visualConfig.label,
      style: new TextStyle({
        fill: this.visualConfig.textColor,
        fontFamily: this.visualConfig.fontFamily,
        fontSize: this.visualConfig.fontSize,
        fontWeight: this.visualConfig.fontWeight,
      }),
    });

    label.anchor.set(0.5);
    label.x = this.visualConfig.width / 2;
    label.y = this.visualConfig.height / 2;

    return label;
  }
}
