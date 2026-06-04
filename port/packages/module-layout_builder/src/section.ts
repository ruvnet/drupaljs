/**
 * Ports `Drupal\layout_builder\Section`.
 *
 * A section = a layout plugin id + that layout's settings + a set of
 * {@link SectionComponent}s keyed by UUID + third-party settings. It can render
 * itself to a render array via the layout plugin manager.
 */
import type { Contexts } from './events.js';
import type { LayoutInterface, RenderArray } from './layout/layout-plugin.js';
import type { LayoutPluginManagerInterface } from './layout/layout-plugin-manager.js';
import {
  SectionComponent,
  type ComponentEventDispatcher,
  type SectionComponentData,
} from './section-component.js';

export interface SectionData {
  readonly layout_id: string;
  readonly layout_settings?: Record<string, unknown>;
  readonly components?: SectionComponentData[];
  readonly third_party_settings?: Record<string, Record<string, unknown>>;
}

export class Section {
  /** Components keyed by UUID, in insertion order. */
  private readonly components = new Map<string, SectionComponent>();
  private layoutSettings: Record<string, unknown>;
  private readonly thirdPartySettings: Record<string, Record<string, unknown>>;

  constructor(
    private readonly layoutId: string,
    layoutSettings: Record<string, unknown> = {},
    components: SectionComponent[] = [],
    thirdPartySettings: Record<string, Record<string, unknown>> = {},
  ) {
    this.layoutSettings = layoutSettings;
    for (const component of components) {
      this.setComponent(component);
    }
    this.thirdPartySettings = thirdPartySettings;
  }

  getLayoutId(): string {
    return this.layoutId;
  }

  getLayoutSettings(): Record<string, unknown> {
    return this.layoutSettings;
  }

  setLayoutSettings(layoutSettings: Record<string, unknown>): this {
    this.layoutSettings = layoutSettings;
    return this;
  }

  /** Resolves the layout plugin for this section. */
  getLayout(manager: LayoutPluginManagerInterface): LayoutInterface {
    return manager.createInstance(this.layoutId, this.layoutSettings);
  }

  /** Default region of this section's layout. Ports getDefaultRegion(). */
  getDefaultRegion(manager: LayoutPluginManagerInterface): string {
    return manager.getDefinition(this.layoutId).getDefaultRegion();
  }

  // -- Components ----------------------------------------------------------

  /** All components keyed by UUID (insertion order). */
  getComponents(): Record<string, SectionComponent> {
    return Object.fromEntries(this.components);
  }

  getComponent(uuid: string): SectionComponent {
    const component = this.components.get(uuid);
    if (component === undefined) {
      throw new Error(`Invalid UUID "${uuid}"`);
    }
    return component;
  }

  private setComponent(component: SectionComponent): this {
    this.components.set(component.getUuid(), component);
    return this;
  }

  removeComponent(uuid: string): this {
    this.components.delete(uuid);
    return this;
  }

  /** Appends a component to the end of its region (highest weight + 1). */
  appendComponent(component: SectionComponent): this {
    component.setWeight(this.getNextHighestWeight(component.getRegion()));
    return this.setComponent(component);
  }

  private getNextHighestWeight(region: string): number {
    const weights = this.getComponentsByRegion(region).map((c) => c.getWeight());
    return weights.length > 0 ? Math.max(...weights) + 1 : 0;
  }

  /** Components in a region, sorted ascending by weight. */
  getComponentsByRegion(region: string): SectionComponent[] {
    return [...this.components.values()]
      .filter((c) => c.getRegion() === region)
      .sort((a, b) => a.getWeight() - b.getWeight());
  }

  /**
   * Inserts a component at a zero-based delta within its region, shifting the
   * weights of subsequent components. Ports insertComponent().
   */
  insertComponent(delta: number, newComponent: SectionComponent): this {
    const region = this.getComponentsByRegion(newComponent.getRegion());
    const count = region.length;
    if (delta > count) {
      throw new RangeError(
        `Invalid delta "${delta}" for the "${newComponent.getUuid()}" component`,
      );
    }
    if (delta === count) {
      return this.appendComponent(newComponent);
    }
    let weight = region[delta]!.getWeight();
    this.setComponent(newComponent.setWeight(weight++));
    for (const component of region.slice(delta)) {
      component.setWeight(weight++);
    }
    return this;
  }

  /** Inserts after an existing component within its region. */
  insertAfterComponent(precedingUuid: string, component: SectionComponent): this {
    const uuids = this.getComponentsByRegion(component.getRegion()).map((c) => c.getUuid());
    const delta = uuids.indexOf(precedingUuid);
    if (delta === -1) {
      throw new Error(`Invalid preceding UUID "${precedingUuid}"`);
    }
    return this.insertComponent(delta + 1, component);
  }

  // -- Rendering -----------------------------------------------------------

  /**
   * Renders the section: builds each component into its region, then asks the
   * layout plugin to assemble them. Ports `Section::toRenderArray()`.
   *
   * The component event dispatcher is passed through (see SectionComponent).
   */
  toRenderArray(
    manager: LayoutPluginManagerInterface,
    dispatch: ComponentEventDispatcher,
    contexts: Contexts = {},
    inPreview = false,
  ): RenderArray {
    const regions: Record<string, Record<string, RenderArray>> = {};
    for (const component of this.components.values()) {
      const output = component.toRenderArray(dispatch, contexts, inPreview);
      if (output !== undefined && Object.keys(output).length > 0) {
        const region = (regions[component.getRegion()] ??= {});
        region[component.getUuid()] = output;
      }
    }
    const layout = this.getLayout(manager);
    layout.setInPreview(inPreview);
    return layout.build(regions);
  }

  // -- Third-party settings ------------------------------------------------

  getThirdPartySetting<T = unknown>(provider: string, key: string, defaultValue?: T): T {
    const value = this.thirdPartySettings[provider]?.[key];
    return (value ?? defaultValue) as T;
  }

  getThirdPartySettings(provider: string): Record<string, unknown> {
    return this.thirdPartySettings[provider] ?? {};
  }

  setThirdPartySetting(provider: string, key: string, value: unknown): this {
    (this.thirdPartySettings[provider] ??= {})[key] = value;
    return this;
  }

  unsetThirdPartySetting(provider: string, key: string): this {
    const settings = this.thirdPartySettings[provider];
    if (settings !== undefined) {
      delete settings[key];
      if (Object.keys(settings).length === 0) {
        delete this.thirdPartySettings[provider];
      }
    }
    return this;
  }

  getThirdPartyProviders(): string[] {
    return Object.keys(this.thirdPartySettings);
  }

  // -- Serialization -------------------------------------------------------

  toArray(): Required<SectionData> {
    const components: SectionComponentData[] = [];
    for (const component of this.components.values()) {
      components.push(component.toArray());
    }
    return {
      layout_id: this.layoutId,
      layout_settings: this.layoutSettings,
      components,
      third_party_settings: this.thirdPartySettings,
    };
  }

  static fromArray(data: SectionData): Section {
    return new Section(
      data.layout_id,
      data.layout_settings ?? {},
      (data.components ?? []).map((c) => SectionComponent.fromArray(c)),
      data.third_party_settings ?? {},
    );
  }
}
