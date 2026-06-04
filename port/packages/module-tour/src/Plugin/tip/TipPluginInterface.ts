/**
 * Tip plugin contracts, ported from
 * `Drupal\tour\TipPluginInterface` and `Drupal\tour\TipPluginBase`.
 *
 * A "tip" is a single step of a tour. Drupal ships a `text` tip
 * (`TipPluginText`); contrib/custom modules may add others (e.g. image, video).
 * The original is an annotated `@Tip` plugin; here a tip is a plain class
 * constructed from its configuration.
 */

import type { RenderArray } from '../../contracts.js';

/** Configuration for a tip, mirroring a tour entity's `tips.*` config block. */
export interface TipConfiguration {
  /** Unique tip id within its tour. */
  id: string;
  /** The tip plugin id (the `plugin` key in config), e.g. "text". */
  plugin: string;
  /** Human-readable label shown as the tip heading. */
  label: string;
  /** Ordering weight; lower runs earlier. Defaults to 0. */
  weight?: number;
  /**
   * CSS selector / placement the tip attaches to (the `selector` /`location`
   * key in Drupal's joyride attributes).
   */
  location?: string;
  /** Plugin-specific extra keys (e.g. `body` for text tips). */
  [key: string]: unknown;
}

/**
 * Port of `Drupal\tour\TipPluginInterface`.
 *
 * Methods are the read side used by the renderer/manager. PHP's
 * `getAttributes()` / form handling are out of scope for this slice.
 */
export interface TipPluginInterface {
  /** The tip's unique id (`TipPluginBase::getId`). */
  getId(): string;
  /** The tip plugin id, e.g. "text" (`PluginBase::getPluginId`). */
  getPluginId(): string;
  /** The tip label (`TipPluginBase::getLabel`). */
  getLabel(): string;
  /** The tip weight (`TipPluginBase::getWeight`). */
  getWeight(): number;
  /** The CSS selector / placement, or undefined. */
  getLocation(): string | undefined;
  /** Returns the render array for this tip (`TipPluginInterface::getOutput`). */
  getOutput(): RenderArray;
  /** Returns the tip's full configuration (`PluginBase` round-trip). */
  getConfiguration(): TipConfiguration;
}

/**
 * Shared base, port of `Drupal\tour\TipPluginBase`. Holds configuration and
 * implements the common getters; subclasses provide `getOutput()` and declare
 * their `getPluginId()`.
 */
export abstract class TipPluginBase implements TipPluginInterface {
  protected readonly configuration: TipConfiguration;

  constructor(configuration: TipConfiguration) {
    this.configuration = configuration;
  }

  getId(): string {
    return this.configuration.id;
  }

  abstract getPluginId(): string;

  getLabel(): string {
    return this.configuration.label;
  }

  getWeight(): number {
    return this.configuration.weight ?? 0;
  }

  getLocation(): string | undefined {
    return this.configuration.location;
  }

  abstract getOutput(): RenderArray;

  getConfiguration(): TipConfiguration {
    return { ...this.configuration };
  }
}
