/**
 * Port of the render path in `Drupal\tour\Controller\TourController`
 * (and the `tour_page_bottom()` builder).
 *
 * Builds the `#theme => 'tour'` render array for a tour: a list of its tip
 * outputs in weight order, with the tour library attached. Access checking is
 * performed upstream (route `_permission: access tour`) / by `TourManager`.
 */

import type { Tour } from '../Entity/Tour.js';
import type { RenderArray } from '../contracts.js';

export class TourController {
  /**
   * Builds the render array for a single tour.
   *
   * Each tip's `getOutput()` returns an element keyed by the tip id; those are
   * merged in weight order under `#tour`, matching Drupal's joyride list.
   */
  renderTour(tour: Tour): RenderArray {
    const tips: RenderArray = {};
    for (const tip of tour.getTips()) {
      Object.assign(tips, tip.getOutput());
    }
    return {
      '#theme': 'tour',
      '#id': tour.id(),
      '#tour': tips,
      '#attached': { library: ['tour/tour'] },
    };
  }
}
