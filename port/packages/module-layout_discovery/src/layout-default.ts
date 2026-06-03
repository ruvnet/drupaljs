/**
 * LayoutDefault — TypeScript port of
 * `core/lib/Drupal/Core/Layout/LayoutDefault.php` (the default Layout plugin).
 *
 * Only the rendering contract (`build()`) plus the configuration/preview state
 * needed to drive it is ported. Form building (`buildConfigurationForm` etc.)
 * and context-aware traits are intentionally omitted — they depend on the Form
 * API and plugin-context subsystems not present in this slice.
 */
import type { LayoutDefinition } from './layout-definition.js';

/**
 * A Drupal render array. Faithful-but-minimal: a plain object where `#`-prefixed
 * keys are render properties and non-`#` keys are child elements (regions).
 *
 * TODO(@drupaljs/render): replace with the shared RenderArray type once the
 * render package lands.
 */
export type RenderArray = Record<string, unknown>;

/** Plugin configuration for {@link LayoutDefault}. */
export interface LayoutConfiguration {
  /** Administrative label. */
  label?: string;
  [key: string]: unknown;
}

/**
 * The interface a layout plugin must satisfy. Ports the rendering surface of
 * `Drupal\Core\Layout\LayoutInterface`.
 */
export interface LayoutInterface {
  /** Builds a render array for the layout given region content. */
  build(regions: Record<string, unknown>): RenderArray;
  /** Toggles preview mode. */
  setInPreview(inPreview: boolean): void;
  /** Returns the plugin definition. */
  getPluginDefinition(): LayoutDefinition;
}

export class LayoutDefault implements LayoutInterface {
  protected inPreview = false;

  constructor(
    protected readonly pluginDefinition: LayoutDefinition,
    protected configuration: LayoutConfiguration = {},
  ) {
    // Merge defaults under any supplied configuration.
    this.configuration = { ...this.defaultConfiguration(), ...configuration };
  }

  /** {@inheritdoc} */
  defaultConfiguration(): LayoutConfiguration {
    return { label: '' };
  }

  getConfiguration(): LayoutConfiguration {
    return this.configuration;
  }

  getPluginDefinition(): LayoutDefinition {
    return this.pluginDefinition;
  }

  setInPreview(inPreview: boolean): void {
    this.inPreview = inPreview;
  }

  /**
   * {@inheritdoc}
   *
   * Filters `regions` down to the layout's defined regions, in definition
   * order, then attaches render metadata (`#in_preview`, `#settings`,
   * `#layout`, `#theme`, optional `#attached` library).
   */
  build(regions: Record<string, unknown>): RenderArray {
    const build: RenderArray = {};
    for (const regionName of this.pluginDefinition.getRegionNames()) {
      if (Object.prototype.hasOwnProperty.call(regions, regionName)) {
        build[regionName] = regions[regionName];
      }
    }
    build['#in_preview'] = this.inPreview;
    build['#settings'] = this.getConfiguration();
    build['#layout'] = this.pluginDefinition;
    build['#theme'] = this.pluginDefinition.getThemeHook();
    const library = this.pluginDefinition.getLibrary();
    if (library) {
      build['#attached'] = { library: [library] };
    }
    return build;
  }
}
