import { InvalidDeriverException } from '../exception.js';
import type {
  CachedDiscoveryInterface,
  DeriverConstructor,
  DeriverInterface,
  DiscoveryInterface,
  PluginDefinition,
} from '../types.js';
import { doGetDefinition } from './discovery-trait.js';

const DERIVATIVE_SEPARATOR = ':';

/**
 * Makes a plugin discovery derivative-aware.
 *
 * Port of `Drupal\Component\Plugin\Discovery\DerivativeDiscoveryDecorator`.
 * A base definition that declares a `deriver` is expanded into one definition
 * per derivative, keyed `base:derivative`. Derivers are instantiated once each
 * and cached until {@link clearCachedDefinitions}.
 */
export class DerivativeDiscoveryDecorator implements CachedDiscoveryInterface {
  protected decorated: DiscoveryInterface;
  protected derivers: Record<string, DeriverInterface | false> = {};

  constructor(decorated: DiscoveryInterface) {
    this.decorated = decorated;
  }

  getDefinitions(): Record<string, PluginDefinition> {
    return this.getDerivatives(this.decorated.getDefinitions());
  }

  getDefinition(pluginId: string, exceptionOnInvalid = true): PluginDefinition | null {
    // Explicitly-provided derivative IDs are uncommon; opt out of the throw and
    // let the base-id resolution surface any real error.
    let pluginDefinition = this.decorated.getDefinition(pluginId, false);

    const [basePluginId, derivativeId] = this.decodePluginId(pluginId);
    const baseDefinition = this.decorated.getDefinition(basePluginId, exceptionOnInvalid);
    if (baseDefinition) {
      const deriver = this.getDeriver(basePluginId, baseDefinition);
      if (deriver) {
        const derivativeDefinition = deriver.getDerivativeDefinition(
          derivativeId,
          baseDefinition,
        );
        if (derivativeId && pluginDefinition) {
          pluginDefinition = this.mergeDerivativeDefinition(
            pluginDefinition,
            derivativeDefinition,
          );
        } else {
          pluginDefinition = derivativeDefinition;
        }
      }
    }

    return pluginDefinition;
  }

  hasDefinition(pluginId: string): boolean {
    return doGetDefinition(this.getDefinitions(), pluginId, false, this.constructor.name) !== null;
  }

  clearCachedDefinitions(): void {
    this.derivers = {};
    // Also clear the inner discovery's cache so re-discovery re-invokes the manifest thunk.
    if ('reset' in this.decorated && typeof (this.decorated as { reset?: () => void }).reset === 'function') {
      (this.decorated as { reset: () => void }).reset();
    } else if ('clearCachedDefinitions' in this.decorated && typeof (this.decorated as { clearCachedDefinitions?: () => void }).clearCachedDefinitions === 'function') {
      (this.decorated as { clearCachedDefinitions: () => void }).clearCachedDefinitions();
    }
  }

  useCaches(useCaches = false): void {
    if (!useCaches) {
      this.clearCachedDefinitions();
    }
  }

  /** Expands base definitions into their derivatives. */
  protected getDerivatives(
    baseDefinitions: Record<string, PluginDefinition>,
  ): Record<string, PluginDefinition> {
    const out: Record<string, PluginDefinition> = {};
    for (const [basePluginId, definition] of Object.entries(baseDefinitions)) {
      const deriver = this.getDeriver(basePluginId, definition);
      if (deriver) {
        const derivativeDefinitions = deriver.getDerivativeDefinitions(definition);
        for (const [derivativeId, derivativeDefinition] of Object.entries(
          derivativeDefinitions,
        )) {
          const pluginId = this.encodePluginId(basePluginId, derivativeId);
          let merged = derivativeDefinition;
          const existing = baseDefinitions[pluginId];
          if (derivativeId && existing) {
            merged = this.mergeDerivativeDefinition(existing, derivativeDefinition);
          }
          out[pluginId] = merged;
        }
      } else if (out[basePluginId] === undefined) {
        out[basePluginId] = definition;
      }
    }
    return out;
  }

  protected decodePluginId(pluginId: string): [string, string] {
    const index = pluginId.indexOf(DERIVATIVE_SEPARATOR);
    // A leading separator is invalid, mirroring Drupal's `strpos` truthy check.
    if (index > 0) {
      return [pluginId.slice(0, index), pluginId.slice(index + 1)];
    }
    return [pluginId, ''];
  }

  protected encodePluginId(basePluginId: string, derivativeId: string): string {
    return derivativeId ? `${basePluginId}${DERIVATIVE_SEPARATOR}${derivativeId}` : basePluginId;
  }

  protected getDeriver(
    basePluginId: string,
    baseDefinition: PluginDefinition,
  ): DeriverInterface | null {
    if (!(basePluginId in this.derivers)) {
      this.derivers[basePluginId] = false;
      const resolved = this.resolveDeriver(baseDefinition);
      if (resolved) {
        this.derivers[basePluginId] = resolved(basePluginId);
      }
    }
    return this.derivers[basePluginId] || null;
  }

  /**
   * Resolves the deriver declaration into a factory `(baseId) => DeriverInterface`.
   *
   * Accepts either a deriver constructor or a pre-built instance.
   *
   * @throws {InvalidDeriverException} if the declaration is not constructable
   *   and not a usable instance.
   */
  protected resolveDeriver(
    baseDefinition: PluginDefinition,
  ): ((basePluginId: string) => DeriverInterface) | null {
    const deriver = baseDefinition.deriver;
    if (!deriver) {
      return null;
    }

    if (this.isDeriverInstance(deriver)) {
      return () => deriver;
    }

    if (typeof deriver === 'function') {
      const ctor = deriver as DeriverConstructor;
      return (basePluginId: string) => new ctor(basePluginId);
    }

    throw new InvalidDeriverException(
      `Plugin (${String(baseDefinition.id)}) deriver must be a DeriverInterface constructor or instance.`,
    );
  }

  private isDeriverInstance(value: unknown): value is DeriverInterface {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as DeriverInterface).getDerivativeDefinitions === 'function'
    );
  }

  protected mergeDerivativeDefinition(
    base: PluginDefinition,
    derivative: PluginDefinition | null,
  ): PluginDefinition {
    // Non-empty base values win; missing keys fall back to the derivative.
    const filteredBase: PluginDefinition = {};
    for (const [k, v] of Object.entries(base)) {
      if (v !== undefined && v !== null && v !== '' && v !== false && v !== 0) {
        filteredBase[k] = v;
      }
    }
    return { ...base, ...(derivative ?? {}), ...filteredBase };
  }
}
