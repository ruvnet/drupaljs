/**
 * Cache merge helpers.
 *
 * Port of the relevant parts of Drupal\Core\Cache\Cache. The cache-tag checksum
 * and invalidation machinery are out of scope here (see ADR-0015 — checksum is
 * a Rust/WASM candidate); this only covers the merge primitives the render
 * system needs.
 */

/** Item should never expire unless explicitly deleted. Drupal's Cache::PERMANENT. */
export const CACHE_PERMANENT = -1;

/** Merge lists, de-duplicating while preserving first-seen order. */
function mergeUnique(lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!seen.has(item)) {
        seen.add(item);
        out.push(item);
      }
    }
  }
  return out;
}

export const Cache = {
  /** Merges lists of cache contexts and removes duplicates. */
  mergeContexts(...contexts: string[][]): string[] {
    return mergeUnique(contexts);
  },

  /** Merges lists of cache tags and removes duplicates. */
  mergeTags(...tags: string[][]): string[] {
    return mergeUnique(tags);
  },

  /**
   * Merges max-age values (in seconds), returning the lowest.
   *
   * PERMANENT (-1) means "infinite" and is ignored unless every value is
   * PERMANENT, in which case PERMANENT is returned.
   */
  mergeMaxAges(...maxAges: number[]): number {
    const finite = maxAges.filter((age) => age !== CACHE_PERMANENT);
    return finite.length === 0 ? CACHE_PERMANENT : Math.min(...finite);
  },
} as const;
