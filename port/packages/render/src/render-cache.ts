/**
 * Render-cache collaborator contract.
 *
 * Port of the seam exposed by Drupal\Core\Render\RenderCacheInterface that the
 * renderer uses. The full caching backend (cache bins, tag checksums) is out of
 * scope; here we model only get/set so the renderer can be tested with a mock
 * and wired to a real cache later.
 *
 * TODO: replace with @drupaljs/cache's RenderCacheInterface when it lands.
 */

import type { RenderArray } from './render-array.js';

export interface RenderCacheInterface {
  /**
   * Gets a cached render array for `elements` (which carries #cache.keys), or
   * `false` on a miss.
   */
  get(elements: RenderArray): RenderArray | false;

  /**
   * Caches a fully-rendered element. `preBubblingElements` is the element's
   * pre-bubbling #cache metadata used to compute the original cache ID.
   */
  set(elements: RenderArray, preBubblingElements: RenderArray): void;
}

/** Default no-op render cache: always misses, never stores. */
export class NullRenderCache implements RenderCacheInterface {
  get(): RenderArray | false {
    return false;
  }

  set(): void {
    // No-op.
  }
}
