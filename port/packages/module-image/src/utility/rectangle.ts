/**
 * Rectangle rotation algebra.
 *
 * Ports `Drupal\Component\Utility\Rectangle` from
 * core/lib/Drupal/Component/Utility/Rectangle.php. Computes the bounding box of
 * a rectangle after rotation, matching the GD toolkit's algorithm so the rotate
 * effect can predict derivative dimensions without performing image IO.
 */
export class Rectangle {
  private readonly width: number;
  private readonly height: number;
  private boundingWidth: number;
  private boundingHeight: number;

  constructor(width: number, height: number) {
    if (width > 0 && height > 0) {
      this.width = width;
      this.height = height;
      this.boundingWidth = width;
      this.boundingHeight = height;
    } else {
      throw new Error(`Invalid dimensions (${width}x${height}) specified for a Rectangle object`);
    }
  }

  /** Rotates the rectangle by `angle` degrees, updating the bounding box. */
  rotate(angle: number): this {
    // Convert any negative angle to a positive one between 0 and 360 degrees,
    // mirroring the GD workaround in the original.
    angle -= Math.floor(angle / 360) * 360;

    let imprecision = 0;
    let correction = 0;
    if (Number.isInteger(angle) && angle % 90 === 0) {
      imprecision = 0;
      correction = 0;
    } else {
      imprecision = -0.00001;
      correction = 0.5;
    }

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let a = this.width * cos;
    let b = this.height * sin + correction;
    let c = this.width * sin;
    let d = this.height * cos + correction;
    if (Number.isInteger(angle) && (angle === 60 || angle === 150 || angle === 300)) {
      a = this.fixImprecision(a, imprecision);
      b = this.fixImprecision(b, imprecision);
      c = this.fixImprecision(c, imprecision);
      d = this.fixImprecision(d, imprecision);
    }

    // GD (PHP 5.5+) truncates toward zero before summing absolute values.
    this.boundingWidth = Math.abs(Math.trunc(a)) + Math.abs(Math.trunc(b));
    this.boundingHeight = Math.abs(Math.trunc(c)) + Math.abs(Math.trunc(d));
    return this;
  }

  getBoundingWidth(): number {
    return this.boundingWidth;
  }

  getBoundingHeight(): number {
    return this.boundingHeight;
  }

  private fixImprecision(input: number, imprecision: number): number {
    return this.delta(input) < Math.abs(imprecision) ? input + imprecision : input;
  }

  private fraction(input: number): number {
    return Math.abs(Math.trunc(input) - input);
  }

  private delta(input: number): number {
    const fraction = this.fraction(input);
    return fraction > 0.5 ? 1 - fraction : fraction;
  }
}
