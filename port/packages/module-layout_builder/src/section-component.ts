/**
 * Ports `Drupal\layout_builder\SectionComponent`.
 *
 * A value object for the smallest part of a layout (e.g. a block): a UUID, the
 * region it sits in, a weight, the wrapped plugin's configuration (whose `id`
 * is the plugin id), plus an `additional` bag for arbitrary properties.
 */
import {
  LayoutBuilderEvents,
  SectionComponentBuildRenderArrayEvent,
  type Contexts,
} from './events.js';
import type { RenderArray } from './layout/layout-plugin.js';

/** Thrown when a component has no plugin id. Ports PluginException. */
export class PluginException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginException';
  }
}

/**
 * Dispatches an event to a single listener, mutating it in place.
 *
 * The render-array build is driven by an event in Drupal
 * (`section_component.build.render_array`). To keep this value object free of a
 * hard dependency on the event-dispatcher package, the dispatcher is supplied as
 * a collaborator (London-school seam).
 *
 * TODO(@drupaljs/event-dispatcher): accept the shared EventDispatcherInterface
 * directly once cross-package wiring lands.
 */
export type ComponentEventDispatcher = (
  event: SectionComponentBuildRenderArrayEvent,
  eventName: string,
) => void;

export interface SectionComponentData {
  readonly uuid: string;
  readonly region: string;
  readonly configuration?: Record<string, unknown>;
  readonly weight?: number;
  readonly additional?: Record<string, unknown>;
}

export class SectionComponent {
  private region: string;
  private configuration: Record<string, unknown>;
  private weight: number;
  private readonly additional: Record<string, unknown>;

  constructor(
    private readonly uuid: string,
    region: string,
    configuration: Record<string, unknown> = {},
    additional: Record<string, unknown> = {},
  ) {
    this.region = region;
    this.configuration = configuration;
    this.weight = 0;
    this.additional = { ...additional };
  }

  getUuid(): string {
    return this.uuid;
  }

  getRegion(): string {
    return this.region;
  }

  setRegion(region: string): this {
    this.region = region;
    return this;
  }

  getWeight(): number {
    return this.weight;
  }

  setWeight(weight: number): this {
    this.weight = weight;
    return this;
  }

  getConfiguration(): Record<string, unknown> {
    return this.configuration;
  }

  setConfiguration(configuration: Record<string, unknown>): this {
    this.configuration = configuration;
    return this;
  }

  /** Ports getPluginId(): the wrapped plugin id lives in `configuration.id`. */
  getPluginId(): string {
    const id = this.configuration['id'];
    if (typeof id !== 'string' || id === '') {
      throw new PluginException(
        `No plugin ID specified for component with "${this.uuid}" UUID`,
      );
    }
    return id;
  }

  /** Gets a known property or an arbitrary `additional` value. */
  get(property: string): unknown {
    switch (property) {
      case 'uuid':
        return this.uuid;
      case 'region':
        return this.region;
      case 'weight':
        return this.weight;
      case 'configuration':
        return this.configuration;
      default:
        return this.additional[property] ?? null;
    }
  }

  /** Sets a known property or an arbitrary `additional` value. */
  set(property: string, value: unknown): this {
    switch (property) {
      case 'region':
        this.region = value as string;
        break;
      case 'weight':
        this.weight = value as number;
        break;
      case 'configuration':
        this.configuration = value as Record<string, unknown>;
        break;
      default:
        this.additional[property] = value;
    }
    return this;
  }

  /**
   * Builds the renderable array by dispatching the build event. Ports
   * `SectionComponent::toRenderArray()`.
   */
  toRenderArray(
    dispatch: ComponentEventDispatcher,
    contexts: Contexts = {},
    inPreview = false,
  ): RenderArray {
    const event = new SectionComponentBuildRenderArrayEvent(this, contexts, inPreview);
    dispatch(event, LayoutBuilderEvents.SECTION_COMPONENT_BUILD_RENDER_ARRAY);
    return event.getBuild();
  }

  toArray(): Required<SectionComponentData> {
    return {
      uuid: this.uuid,
      region: this.region,
      configuration: this.configuration,
      weight: this.weight,
      additional: this.additional,
    };
  }

  static fromArray(data: SectionComponentData): SectionComponent {
    return new SectionComponent(
      data.uuid,
      data.region,
      data.configuration ?? {},
      data.additional ?? {},
    ).setWeight(data.weight ?? 0);
  }

  /** Deep clone (the additional bag is copied). Ports __clone semantics. */
  clone(): SectionComponent {
    return SectionComponent.fromArray(structuredClone(this.toArray()));
  }
}
