/**
 * Field plugin manager.
 *
 * Ports the consumer-facing surface of
 * `Drupal\migrate_drupal\Plugin\MigrateFieldPluginManager`: registration of
 * field-plugin definitions, instantiation by id, and resolving a plugin id from
 * a source field type + core version. PHP plugin discovery (namespace scanning,
 * attribute/annotation parsing, discovery caching) is replaced by an explicit
 * `register()` API — the same approach `@drupaljs/hook` takes for hooks.
 */

import type {
  MigrateFieldDefinition,
  MigrateFieldInterface,
} from '../contracts.js';

/** Factory creating a plugin instance from its id + definition. */
export type FieldPluginFactory = (
  id: string,
  definition: MigrateFieldDefinition,
) => MigrateFieldInterface;

interface RegisteredPlugin {
  readonly definition: MigrateFieldDefinition;
  readonly factory: FieldPluginFactory;
}

export class MigrateFieldPluginManager {
  private readonly plugins = new Map<string, RegisteredPlugin>();

  /** Registers (or overrides) a field plugin definition and its factory. */
  register(definition: MigrateFieldDefinition, factory: FieldPluginFactory): void {
    this.plugins.set(definition.id, { definition, factory });
  }

  hasDefinition(id: string): boolean {
    return this.plugins.has(id);
  }

  getDefinition(id: string): MigrateFieldDefinition {
    const entry = this.plugins.get(id);
    if (entry === undefined) {
      throw new Error(`There is no migrate field plugin with id "${id}".`);
    }
    return entry.definition;
  }

  getDefinitions(): MigrateFieldDefinition[] {
    return [...this.plugins.values()].map((p) => p.definition);
  }

  /** Instantiates the plugin registered under `id`. */
  createInstance(id: string): MigrateFieldInterface {
    const entry = this.plugins.get(id);
    if (entry === undefined) {
      throw new Error(`There is no migrate field plugin with id "${id}".`);
    }
    return entry.factory(entry.definition.id, entry.definition);
  }

  /**
   * Resolves the field plugin id that handles a given source field type for a
   * given source core major version.
   *
   * Ports `MigrateFieldPluginManager::getPluginIdFromFieldType()`. When more than
   * one plugin maps the same type, the lower-weight plugin wins (default 0).
   *
   * @throws when no registered plugin maps the requested type for the version.
   */
  getPluginIdFromFieldType(fieldType: string, configuration: { core: number }): string {
    const core = configuration.core;
    const candidates = this.getDefinitions().filter(
      (def) =>
        def.core.includes(core) &&
        def.type_map !== undefined &&
        Object.prototype.hasOwnProperty.call(def.type_map, fieldType),
    );

    if (candidates.length === 0) {
      throw new Error(
        `No plugin found for migrating field type "${fieldType}" for core version ${core}.`,
      );
    }

    candidates.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
    return candidates[0]!.id;
  }
}
