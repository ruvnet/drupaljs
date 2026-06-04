/**
 * Port of tour's hook implementations, originally the `#[Hook]`-attributed
 * methods on `Drupal\tour\Hook\TourHooks` (formerly procedural `tour.module`):
 *
 * - `hook_help()` — module help text.
 * - `hook_page_attachments()` — attaches the tour library + tour data on
 *   routes that have a viewable tour (the `tour_page_bottom()` logic).
 *
 * Collaborators (the {@link TourManager} read service and the current
 * {@link RouteMatchLike}) are injected so the hooks stay pure and testable.
 */

import type { RenderArray, RouteMatchLike } from '../contracts.js';
import type { TourManager } from '../TourManager.js';

/** `#attached` payload shape (subset). */
interface AttachedLibraries {
  library?: string[];
  drupalSettings?: Record<string, unknown>;
}

export class TourHooks {
  constructor(
    private readonly tourManager: TourManager,
    private readonly routeMatch: RouteMatchLike,
  ) {}

  /**
   * `hook_help()` — returns help markup for the tour module's help page.
   * Returns an empty string for unrelated routes (Drupal returns nothing).
   */
  help(routeName: string): string {
    if (routeName === 'help.page.tour') {
      return (
        '<h2>About</h2><p>The Tour module provides users with guided tours of ' +
        'the site interface, presenting a series of tips that highlight elements ' +
        'of the page.</p>'
      );
    }
    return '';
  }

  /**
   * `hook_page_attachments()` — when the current route has at least one tour the
   * user may view, attach the tour library and the list of applicable tour ids.
   * Mirrors `tour_page_bottom()` gating on access + route binding.
   */
  pageAttachments(page: RenderArray): void {
    const routeName = this.routeMatch.getRouteName();
    if (routeName === null) {
      return;
    }
    const tours = this.tourManager.getToursForRoute(routeName);
    if (tours.length === 0) {
      return;
    }

    const attached = (page['#attached'] ??= {}) as AttachedLibraries;
    attached.library ??= [];
    if (!attached.library.includes('tour/tour')) {
      attached.library.push('tour/tour');
    }
    attached.drupalSettings ??= {};
    (attached.drupalSettings as Record<string, unknown>)['tour'] = {
      ids: tours.map((t) => t.id()),
    };
  }
}
