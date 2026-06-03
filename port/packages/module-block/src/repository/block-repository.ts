/**
 * `block.repository` service.
 *
 * Ports `Drupal\block\BlockRepository` (+ its interface): assembles the visible
 * blocks for the active theme grouped by region, and derives unique machine
 * names for new placements. The Drupal version depends on the entity query
 * builder, theme manager and a context handler; here those collaborators are
 * narrowed to the minimal interfaces this slice needs and injected.
 */
import { sortBlocks, type BlockInterface } from '../entity/block.js';

/** Active theme descriptor (subset of `Drupal\Core\Theme\ActiveTheme`). */
export interface ActiveTheme {
  getName(): string;
  /** Region machine names in display order. */
  getRegions(): string[];
}

/** Theme manager (subset of `Drupal\Core\Theme\ThemeManagerInterface`). */
export interface ThemeManager {
  getActiveTheme(): ActiveTheme;
}

/**
 * Block storage (subset of `EntityStorageInterface` + the entity query the
 * repository uses). `loadByProperties` returns a map keyed by block id.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityStorageInterface +
 * query builder once the entity package exposes them.
 */
export interface BlockStorage {
  loadByProperties(properties: { theme: string }): Record<string, BlockInterface>;
  /** All existing block ids matching the `CONTAINS` query in core. */
  getExistingIds?(suggestion: string): string[];
}

/** region machine name -> (block id -> block entity). */
export type RegionAssignments = Record<string, Record<string, BlockInterface>>;

export class BlockRepository {
  constructor(
    private readonly blockStorage: BlockStorage,
    private readonly themeManager: ThemeManager,
  ) {}

  /**
   * Returns blocks grouped by region for the active theme, access-filtered and
   * sorted within each region. Ports BlockRepository::getVisibleBlocksPerRegion().
   */
  getVisibleBlocksPerRegion(): RegionAssignments {
    const activeTheme = this.themeManager.getActiveTheme();

    // Seed every region (in theme order) so empty regions are preserved.
    const result: RegionAssignments = {};
    for (const region of activeTheme.getRegions()) {
      result[region] = {};
    }

    const blocks = this.blockStorage.loadByProperties({ theme: activeTheme.getName() });
    for (const [blockId, block] of Object.entries(blocks)) {
      if (!block.access('view')) {
        continue;
      }
      const region = block.getRegion();
      if (region === undefined || result[region] === undefined) {
        // A block placed in a region the theme no longer defines is skipped,
        // mirroring core's array_intersect_key against the theme regions.
        continue;
      }
      result[region][blockId] = block;
    }

    // Sort each region's blocks by the ported Block::sort comparator.
    for (const region of Object.keys(result)) {
      const sorted = Object.entries(result[region]!).sort(([, a], [, b]) => sortBlocks(a, b));
      result[region] = Object.fromEntries(sorted);
    }

    return result;
  }

  /**
   * Generates a unique machine name from a suggestion, prefixed by the theme.
   * Ports BlockRepository::getUniqueMachineName().
   */
  getUniqueMachineName(suggestion: string, theme?: string): string {
    const base = theme ? `${theme}_${suggestion}` : suggestion;
    const existing = new Set(this.blockStorage.getExistingIds?.(base) ?? []);
    if (!existing.has(base)) {
      return base;
    }
    let count = 1;
    let candidate = base;
    while (existing.has(candidate)) {
      candidate = `${base}_${++count}`;
    }
    return candidate;
  }
}
