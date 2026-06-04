/**
 * Ports `Drupal\Core\Layout\LayoutInterface` + `LayoutDefault::build()`.
 *
 * A layout plugin takes a map of rendered regions and produces a render array,
 * filtering/ordering the regions to those declared by the layout definition and
 * attaching theme/settings/library metadata — exactly as `LayoutDefault::build`.
 */
import { LayoutDefinition } from './layout-definition.js';

/** Rendered output keyed by region machine name. */
export type RenderedRegions = Record<string, unknown>;

/**
 * A Drupal render array (untyped bag of `#`-prefixed keys plus child elements).
 * TODO(@drupaljs/render): replace with the shared render-array type once the
 * render package exposes one.
 */
export type RenderArray = Record<string, unknown>;

export interface LayoutInterface {
  getPluginDefinition(): LayoutDefinition;
  getConfiguration(): Record<string, unknown>;
  setInPreview(inPreview: boolean): void;
  build(regions: RenderedRegions): RenderArray;
}

/**
 * Default layout plugin. Ports `Drupal\Core\Layout\LayoutDefault`.
 */
export class LayoutDefault implements LayoutInterface {
  private inPreview = false;

  constructor(
    private readonly definition: LayoutDefinition,
    private readonly configuration: Record<string, unknown> = {},
  ) {}

  getPluginDefinition(): LayoutDefinition {
    return this.definition;
  }

  getConfiguration(): Record<string, unknown> {
    return { label: '', ...this.configuration };
  }

  setInPreview(inPreview: boolean): void {
    this.inPreview = inPreview;
  }

  /**
   * Ports `LayoutDefault::build()`: keep only defined regions, in the order the
   * definition declares them, then attach metadata.
   */
  build(regions: RenderedRegions): RenderArray {
    const build: RenderArray = {};
    for (const regionName of this.definition.getRegionNames()) {
      if (Object.prototype.hasOwnProperty.call(regions, regionName)) {
        build[regionName] = regions[regionName];
      }
    }
    build['#in_preview'] = this.inPreview;
    build['#settings'] = this.getConfiguration();
    build['#layout'] = this.definition;
    const themeHook = this.definition.getThemeHook();
    if (themeHook !== undefined) {
      build['#theme'] = themeHook;
    }
    const library = this.definition.getLibrary();
    if (library !== undefined) {
      build['#attached'] = { library: [library] };
    }
    return build;
  }
}
