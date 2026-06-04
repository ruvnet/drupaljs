/**
 * Ports `Drupal\layout_builder\LayoutBuilderEvents` and
 * `Drupal\layout_builder\Event\SectionComponentBuildRenderArrayEvent`.
 */
import type { RenderArray } from './layout/layout-plugin.js';
import type { SectionComponent } from './section-component.js';

/** Event names. Ports the LayoutBuilderEvents constants. */
export const LayoutBuilderEvents = {
  /** Fired when a SectionComponent's render array is built. */
  SECTION_COMPONENT_BUILD_RENDER_ARRAY: 'section_component.build.render_array',
  /** Fired when preparing a layout-builder element. */
  PREPARE_LAYOUT: 'prepare_layout',
} as const;

/**
 * Available contexts during a build, e.g. `layout_builder.entity`.
 * TODO(@drupaljs/plugin-context): replace with the shared Context type.
 */
export type Contexts = Record<string, unknown>;

/**
 * Event allowing modules to collaborate on building a SectionComponent's render
 * array. Ports `SectionComponentBuildRenderArrayEvent`.
 */
export class SectionComponentBuildRenderArrayEvent {
  private build: RenderArray = {};

  constructor(
    public readonly component: SectionComponent,
    public readonly contexts: Contexts,
    public readonly inPreview: boolean,
  ) {}

  getBuild(): RenderArray {
    return this.build;
  }

  setBuild(build: RenderArray): void {
    this.build = build;
  }
}
