import type { FilterPluginManager } from './filter-plugin-manager.js';
import {
  FilterType,
  type AttributeRestriction,
  type FilterConfiguration,
  type FilterFormatConfig,
  type FilterInterface,
  type HtmlRestrictions,
} from './types.js';

type AllowedMap = Record<string, boolean | Record<string, AttributeRestriction>>;

/**
 * Represents a text format: an ordered group of configured filter plugins.
 *
 * Port of `Drupal\filter\Entity\FilterFormat` (the runtime-relevant surface).
 * Construction takes the serializable {@link FilterFormatConfig} plus the
 * {@link FilterPluginManager} used to instantiate the configured filters. The
 * instantiated filters are lazily built, weight-sorted, and cached.
 *
 * @see core/modules/filter/src/Entity/FilterFormat.php
 */
export class FilterFormat {
  private readonly config: FilterFormatConfig;
  private readonly manager: FilterPluginManager;
  private filterInstances: FilterInterface[] | null = null;

  constructor(config: FilterFormatConfig, manager: FilterPluginManager) {
    this.config = config;
    this.manager = manager;
  }

  /** The format's machine name. */
  id(): string {
    return this.config.format;
  }

  /** The format's human-readable label. */
  label(): string {
    return this.config.name;
  }

  /** Whether the format is enabled (defaults to true when unset). */
  status(): boolean {
    return this.config.status !== false;
  }

  /**
   * Returns all configured filter instances, weight-sorted (then by id), built
   * lazily and cached. Disabled filters are included here (callers filter by
   * `status`), matching Drupal's `FilterPluginCollection`.
   */
  filters(): FilterInterface[] {
    if (this.filterInstances === null) {
      const configured = this.config.filters ?? {};
      const instances: FilterInterface[] = [];
      for (const [instanceId, instanceConfig] of Object.entries(configured)) {
        if (!this.manager.hasDefinition(instanceId)) continue;
        instances.push(
          this.manager.createInstance(
            instanceId,
            instanceConfig as Record<string, unknown> satisfies FilterConfiguration,
          ),
        );
      }
      instances.sort(
        (a, b) =>
          a.weight - b.weight || a.getPluginId().localeCompare(b.getPluginId()),
      );
      this.filterInstances = instances;
    }
    return this.filterInstances;
  }

  /** Returns a single configured filter instance by ID, or undefined. */
  filter(instanceId: string): FilterInterface | undefined {
    return this.filters().find((f) => f.getPluginId() === instanceId);
  }

  /** The distinct {@link FilterType}s of the enabled filters. */
  getFilterTypes(): FilterType[] {
    const types = new Set<FilterType>();
    for (const f of this.filters()) {
      if (f.status) types.add(f.getType());
    }
    return [...types];
  }

  /**
   * Computes the intersection of HTML restrictions across every enabled
   * {@link FilterType.HTML_RESTRICTOR} filter that declares restrictions.
   * Returns `false` when no such filter applies (any HTML allowed).
   *
   * @see core/modules/filter/src/Entity/FilterFormat.php (getHtmlRestrictions)
   */
  getHtmlRestrictions(): HtmlRestrictions {
    const restrictors = this.filters().filter(
      (f) =>
        f.status &&
        f.getType() === FilterType.HTML_RESTRICTOR &&
        f.getHtmlRestrictions() !== false,
    );

    if (restrictors.length === 0) return false;

    let allowed: AllowedMap | null = null;
    for (const filter of restrictors) {
      const next = filter.getHtmlRestrictions();
      if (next === false) continue;
      allowed =
        allowed === null ? next.allowed : intersectAllowed(allowed, next.allowed);
    }

    return allowed === null ? false : { allowed };
  }
}

/**
 * Intersects two `allowed` maps: keep only tags present in both (the `*`
 * pseudo-tag is always retained), and for shared tags compute the most
 * restrictive attribute set.
 */
function intersectAllowed(current: AllowedMap, next: AllowedMap): AllowedMap {
  const result: AllowedMap = {};
  for (const [tag, attrs] of Object.entries(current)) {
    if (tag === '*') {
      result[tag] = attrs;
      continue;
    }
    if (!(tag in next)) continue;
    result[tag] = intersectAttributes(attrs, next[tag]!);
  }
  // Simplification: if only the wildcard survives, nothing is effectively allowed.
  const keys = Object.keys(result);
  if (keys.length === 1 && keys[0] === '*') return {};
  return result;
}

/** Most-restrictive merge of two attribute restrictions for one tag. */
function intersectAttributes(
  current: boolean | Record<string, AttributeRestriction>,
  next: boolean | Record<string, AttributeRestriction>,
): boolean | Record<string, AttributeRestriction> {
  // No attributes allowed currently => never widen.
  if (current === false) return false;
  // Current allows all; defer to whatever the next filter permits.
  if (current === true) return next;
  // Current is a list; next allows none => none.
  if (next === false) return false;
  // Current is a list; next allows all => keep current.
  if (next === true) return current;
  // Both are records: AND the shared attribute-value flags.
  const merged: Record<string, AttributeRestriction> = {};
  for (const [attr, value] of Object.entries(current)) {
    if (!(attr in next)) continue;
    merged[attr] = andRestriction(value, next[attr]!);
  }
  return merged;
}

/** ANDs two attribute-value restrictions. */
function andRestriction(
  a: AttributeRestriction,
  b: AttributeRestriction,
): AttributeRestriction {
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Boolean(a) && Boolean(b);
  }
  const merged: Record<string, boolean> = {};
  for (const [value, flag] of Object.entries(a)) {
    if (value in b) merged[value] = flag && b[value]!;
  }
  return merged;
}
