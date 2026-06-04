import type { UrlLike } from '../contracts.js';
import type { ShortcutInterface } from './interfaces.js';

/** Plain values used to construct a {@link Shortcut}. Ports its base fields. */
export interface ShortcutValues {
  /** Numeric id; null until the entity is saved. */
  id?: number | null;
  /** Owning shortcut set machine name (the entity bundle). */
  shortcut_set: string;
  /** Display name (`title` base field). */
  title: string;
  /** Weight among shortcuts in the same set. */
  weight: number;
  /** Target URL (`link` base field). */
  link: UrlLike;
  /** Language code (`langcode` base field). Defaults to `und`. */
  langcode?: string;
}

/**
 * Case-insensitive natural-order string comparison.
 *
 * Ports PHP's `strnatcasecmp()` closely enough for shortcut sorting: compares
 * runs of digits numerically and other runs lexically, ignoring case.
 *
 * TODO(@drupaljs/util): move to the shared util package alongside other PHP
 * string-function ports.
 */
export function strnatcasecmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'accent' });
}

/**
 * Defines the shortcut content entity class.
 *
 * Ports `Drupal\shortcut\Entity\Shortcut`. The content-entity field machinery is
 * collapsed to plain typed fields for this slice; persistence and cache
 * invalidation are delegated to storage/services in other files.
 */
export class Shortcut implements ShortcutInterface {
  private values: Required<Omit<ShortcutValues, 'id'>> & { id: number | null };

  constructor(values: ShortcutValues) {
    this.values = {
      id: values.id ?? null,
      shortcut_set: values.shortcut_set,
      title: values.title,
      weight: values.weight,
      link: values.link,
      langcode: values.langcode ?? 'und',
    };
  }

  id(): number | null {
    return this.values.id;
  }

  bundle(): string {
    return this.values.shortcut_set;
  }

  getTitle(): string {
    return this.values.title;
  }

  setTitle(title: string): this {
    this.values.title = title;
    return this;
  }

  getWeight(): number {
    return this.values.weight;
  }

  setWeight(weight: number): this {
    this.values.weight = weight;
    return this;
  }

  getUrl(): UrlLike {
    return this.values.link;
  }

  /**
   * Cache tags to invalidate. In core this returns the owning set's cache tags;
   * the canonical config-entity tag for a set is `config:shortcut.set.<id>`.
   */
  getCacheTagsToInvalidate(): string[] {
    return [`config:shortcut.set.${this.values.shortcut_set}`];
  }

  /**
   * Sort callback for shortcut objects. Ports `Shortcut::sort()`: ascending by
   * weight, ties broken by case-insensitive natural-order title comparison.
   */
  static sort(a: ShortcutInterface, b: ShortcutInterface): number {
    const aw = a.getWeight();
    const bw = b.getWeight();
    if (aw === bw) {
      return strnatcasecmp(a.getTitle(), b.getTitle());
    }
    return aw < bw ? -1 : 1;
  }
}
