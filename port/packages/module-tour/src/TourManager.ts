/**
 * Tour discovery service.
 *
 * Drupal does not ship a single `TourManager` class; the route-aware tour
 * lookup is spread across `tour_page_bottom()` / `tour.module` and the entity
 * query (`\Drupal::entityTypeManager()->getStorage('tour')->loadMultiple()`
 * filtered by route). This service consolidates that read path into one
 * testable seam: given the current route, return the access-checked tours that
 * apply, ordered by weight.
 */

import type { Tour } from './Entity/Tour.js';
import type { AccountLike, TourStorageLike } from './contracts.js';
import { ACCESS_TOUR } from './permissions.js';

export class TourManager {
  constructor(
    private readonly storage: TourStorageLike,
    private readonly currentUser: AccountLike,
  ) {}

  /** Whether the current user may see tours at all. */
  private hasAccess(): boolean {
    return this.currentUser.hasPermission(ACCESS_TOUR);
  }

  /**
   * Returns the tours bound to `routeName` that the current user may view,
   * ordered by ascending tour weight then id. Empty when access is denied.
   *
   * Mirrors the filter Drupal applies before attaching tours to a page.
   */
  getToursForRoute(routeName: string): Tour[] {
    if (!this.hasAccess()) {
      return [];
    }
    const matching = Object.values(this.storage.loadMultiple()).filter((tour) =>
      tour.hasMatchingRoute(routeName),
    );
    return matching.sort((a, b) => {
      const w = a.getWeight() - b.getWeight();
      return w !== 0 ? w : a.id() < b.id() ? -1 : a.id() > b.id() ? 1 : 0;
    });
  }

  /** True when at least one viewable tour applies to the route. */
  hasTourForRoute(routeName: string): boolean {
    return this.getToursForRoute(routeName).length > 0;
  }
}
