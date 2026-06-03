/**
 * Safe-string wrapper for the render system.
 *
 * Port of Drupal\Core\Render\Markup + Drupal\Component\Render\MarkupTrait.
 *
 * A Markup object marks a string as known-safe so the render/theme system does
 * not XSS-filter or auto-escape it again. It must only ever be constructed from
 * a string that is genuinely safe.
 */

/**
 * Marks an object's string value as already-safe markup.
 *
 * Port of Drupal\Component\Render\MarkupInterface (extends Stringable +
 * JsonSerializable).
 */
export interface MarkupInterface {
  /** Returns the raw safe markup. */
  toString(): string;
  /** Returns the character length of the string (Countable). */
  count(): number;
  /** JSON-serializes to the raw string. */
  toJSON(): string;
}

/** Unique brand so {@link isMarkup} can identify Markup instances structurally. */
const MARKUP_BRAND: unique symbol = Symbol.for('@drupaljs/render.Markup');

class MarkupImpl implements MarkupInterface {
  readonly [MARKUP_BRAND] = true;

  constructor(private readonly string: string) {}

  toString(): string {
    return this.string;
  }

  count(): number {
    // Count Unicode code points to mirror PHP's mb_strlen().
    return [...this.string].length;
  }

  toJSON(): string {
    return this.string;
  }
}

/** Type guard: is the value a Markup (safe-string) object? */
export function isMarkup(value: unknown): value is MarkupInterface {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[MARKUP_BRAND] === true
  );
}

export const Markup = {
  /**
   * Creates a Markup object if necessary.
   *
   * - An existing MarkupInterface is returned unchanged (idempotent).
   * - A value casting to the empty string returns '' (no object needed).
   * - Anything else is cast to a string and wrapped.
   */
  create(value: unknown): string | MarkupInterface {
    if (isMarkup(value)) {
      return value;
    }
    const str = String(value);
    if (str === '') {
      return '';
    }
    return new MarkupImpl(str);
  },
} as const;
