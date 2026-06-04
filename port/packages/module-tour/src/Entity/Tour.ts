/**
 * Port of `Drupal\tour\Entity\Tour` — the `tour` config entity.
 *
 * A Tour groups an ordered set of tips and the routes on which it appears.
 * In Drupal this is a `@ConfigEntityType` with id `tour`; here it is a plain
 * class constructed from its config array. The entity owns instantiation of its
 * tip plugins (Drupal lazily builds them via a `TipsPluginCollection`).
 */

import {
  type TipPluginInterface,
  type TipConfiguration,
} from '../Plugin/tip/TipPluginInterface.js';
import { TipPluginText } from '../Plugin/tip/TipPluginText.js';

/** A route binding entry, mirroring the `routes:` list in tour config. */
export interface TourRoute {
  /** The route machine name the tour appears on. */
  route_name: string;
  /** Optional route parameters constraining the match. */
  route_params?: Record<string, string>;
}

/** The full tour config array, mirroring `tour.tour.*.yml`. */
export interface TourConfiguration {
  id: string;
  label: string;
  /** Providing module machine name. */
  module: string;
  /** Routes the tour is shown on. */
  routes?: TourRoute[];
  /** Tip configs keyed by tip id. */
  tips?: Record<string, TipConfiguration>;
  /** Ordering weight among tours on the same route. */
  weight?: number;
}

/**
 * Factory mapping a tip's `plugin` id to its concrete class.
 *
 * Mirrors how `tour` resolves tip plugins through the `tip` plugin manager.
 * Only the core `text` tip is ported; unknown plugins fall back to text.
 *
 * TODO(@drupaljs/plugin): replace with a real plugin-manager lookup once the
 * plugin discovery package lands.
 */
function createTip(config: TipConfiguration): TipPluginInterface {
  switch (config.plugin) {
    case 'text':
    default:
      return new TipPluginText(config);
  }
}

export class Tour {
  private readonly configuration: TourConfiguration;

  constructor(configuration: TourConfiguration) {
    this.configuration = configuration;
  }

  /** The entity id (`ConfigEntityBase::id`). */
  id(): string {
    return this.configuration.id;
  }

  /** The entity label (`ConfigEntityBase::label`). */
  label(): string {
    return this.configuration.label;
  }

  /** The providing module machine name (`Tour::getModule`). */
  getModule(): string {
    return this.configuration.module;
  }

  /** Ordering weight among tours. Defaults to 0. */
  getWeight(): number {
    return this.configuration.weight ?? 0;
  }

  /** The route machine names this tour is bound to (`Tour::getRoutes`). */
  getRouteNames(): string[] {
    return (this.configuration.routes ?? []).map((r) => r.route_name);
  }

  /** True when this tour applies to the given route (`Tour::hasMatchingRoute`). */
  hasMatchingRoute(routeName: string): boolean {
    return this.getRouteNames().includes(routeName);
  }

  /**
   * Instantiates and returns the tip plugins, sorted by ascending weight then
   * tip id (`Tour::getTips`, which sorts the plugin collection by weight).
   */
  getTips(): TipPluginInterface[] {
    const tips = Object.values(this.configuration.tips ?? {}).map(createTip);
    return tips.sort((a, b) => {
      const w = a.getWeight() - b.getWeight();
      return w !== 0 ? w : a.getId() < b.getId() ? -1 : a.getId() > b.getId() ? 1 : 0;
    });
  }

  /** Returns a single tip plugin by id, or undefined (`Tour::getTip`). */
  getTip(id: string): TipPluginInterface | undefined {
    const config = this.configuration.tips?.[id];
    return config !== undefined ? createTip(config) : undefined;
  }
}
