import { InvalidPluginDefinitionException } from '../exception.js';
import type { DiscoveryInterface, PluginDefinition } from '../types.js';
import { doGetDefinition } from './discovery-trait.js';

/**
 * A manifest is the TS replacement for PHP annotation/attribute scanning.
 *
 * In Drupal, plugins are discovered by reflecting over PHP classes annotated
 * with `#[Block(...)]`-style attributes ({@link AttributeClassDiscovery}). There
 * is no equivalent reflection in a bundled JS runtime, so instead the host
 * declares an explicit **manifest** of definitions. It can be:
 *
 * - an array of definitions (each must carry an `id`), or
 * - an object keyed by plugin ID (the key backfills `id`), or
 * - a thunk returning either of the above (evaluated lazily, once).
 */
export type Manifest =
  | PluginDefinition[]
  | Record<string, PluginDefinition>
  | (() => PluginDefinition[] | Record<string, PluginDefinition>);

/**
 * Discovers plugin definitions from a declarative manifest.
 *
 * Port intent of `Drupal\Component\Plugin\Discovery\AttributeClassDiscovery`,
 * but driven by an explicit manifest instead of filesystem reflection.
 */
export class ManifestDiscovery implements DiscoveryInterface {
  private readonly manifest: Manifest;
  private readonly defaults: PluginDefinition;
  private resolved: Record<string, PluginDefinition> | null = null;

  /**
   * @param manifest - The declarative source of plugin definitions.
   * @param defaults - Values merged under every definition (definition wins).
   */
  constructor(manifest: Manifest, defaults: PluginDefinition = {}) {
    this.manifest = manifest;
    this.defaults = defaults;
  }

  getDefinitions(): Record<string, PluginDefinition> {
    if (this.resolved === null) {
      this.resolved = this.resolve();
    }
    return this.resolved;
  }

  getDefinition(pluginId: string, exceptionOnInvalid = true): PluginDefinition | null {
    return doGetDefinition(
      this.getDefinitions(),
      pluginId,
      exceptionOnInvalid,
      this.constructor.name,
    );
  }

  hasDefinition(pluginId: string): boolean {
    return this.getDefinition(pluginId, false) !== null;
  }

  /**
   * Discards the resolved-definition cache so the next read re-reads the
   * manifest (re-invoking a thunk manifest). Used by cached managers when
   * caches are cleared/disabled.
   */
  reset(): void {
    this.resolved = null;
  }

  private resolve(): Record<string, PluginDefinition> {
    const raw = typeof this.manifest === 'function' ? this.manifest() : this.manifest;
    const out: Record<string, PluginDefinition> = {};

    if (Array.isArray(raw)) {
      for (const entry of raw) {
        const id = entry.id;
        if (typeof id !== 'string' || id.length === 0) {
          throw new InvalidPluginDefinitionException(
            String(id ?? ''),
            'Manifest entry is missing a string "id".',
          );
        }
        out[id] = { ...this.defaults, ...entry, id };
      }
    } else {
      for (const [id, entry] of Object.entries(raw)) {
        out[id] = { ...this.defaults, ...entry, id };
      }
    }

    return out;
  }
}
