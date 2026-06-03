/**
 * Ports `Drupal\Core\Layout\LayoutDefinition` (the relevant surface).
 *
 * A layout definition describes a layout plugin: its machine id, label,
 * category, the named regions it exposes, the default region, and the theme
 * hook / template / library used to render it. Sourced in Drupal from each
 * module's `*.layouts.yml`; here it is a plain value object.
 */

/** A single region within a layout, e.g. `first`, `second`. */
export interface LayoutRegionDefinition {
  /** Human-readable label. */
  readonly label: string;
}

/** Raw data used to construct a {@link LayoutDefinition}. */
export interface LayoutDefinitionData {
  readonly id: string;
  readonly label?: string;
  readonly category?: string;
  /** Regions keyed by machine name, in declaration order. */
  readonly regions?: Record<string, LayoutRegionDefinition>;
  /** Default region machine name. Falls back to the first region. */
  readonly default_region?: string;
  /** Theme hook used to render the layout (e.g. `layout__twocol_section`). */
  readonly theme_hook?: string;
  /** Template file basename. */
  readonly template?: string;
  /** Attached library, e.g. `layout_builder/twocol_section`. */
  readonly library?: string;
}

export class LayoutDefinition {
  private readonly data: LayoutDefinitionData;

  constructor(data: LayoutDefinitionData) {
    this.data = data;
  }

  getId(): string {
    return this.data.id;
  }

  getLabel(): string {
    return this.data.label ?? this.data.id;
  }

  getCategory(): string {
    return this.data.category ?? '';
  }

  getRegions(): Record<string, LayoutRegionDefinition> {
    return this.data.regions ?? {};
  }

  /** Region machine names in declaration order. Ports getRegionNames(). */
  getRegionNames(): string[] {
    return Object.keys(this.getRegions());
  }

  getRegionLabels(): Record<string, string> {
    const labels: Record<string, string> = {};
    for (const [name, region] of Object.entries(this.getRegions())) {
      labels[name] = region.label;
    }
    return labels;
  }

  /** Default region; falls back to the first declared region. */
  getDefaultRegion(): string {
    if (this.data.default_region !== undefined) {
      return this.data.default_region;
    }
    return this.getRegionNames()[0] ?? '';
  }

  getThemeHook(): string | undefined {
    return this.data.theme_hook;
  }

  getTemplate(): string | undefined {
    return this.data.template;
  }

  getLibrary(): string | undefined {
    return this.data.library;
  }
}
