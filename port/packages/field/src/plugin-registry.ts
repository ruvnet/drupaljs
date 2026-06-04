import { DefaultPluginManager } from '@drupaljs/plugin';
import type { PluginDefinition } from '@drupaljs/plugin';
import type { FieldPluginDefinitionBase } from './contracts.js';

/**
 * A thin, mutable registry wrapping {@link DefaultPluginManager}.
 *
 * `@drupaljs/plugin`'s manifest discovery is read-only once constructed, so this
 * registry owns a mutable definitions map and feeds it to the manager via a
 * thunk manifest. Registering a definition clears the manager's caches so the
 * change is observed immediately. This is the shared backbone of the field
 * type, formatter, and widget plugin registries.
 */
export class PluginRegistry<TDefinition extends FieldPluginDefinitionBase> {
  protected readonly definitions: Record<string, TDefinition> = {};
  protected readonly manager: DefaultPluginManager;

  constructor(initial: Record<string, TDefinition> = {}) {
    Object.assign(this.definitions, initial);
    // The field definitions reference typed constructors rather than the
    // generic plugin `class` union, so feed the manager an untyped view.
    this.manager = new DefaultPluginManager(
      () => this.definitions as unknown as Record<string, PluginDefinition>,
    );
  }

  /** Registers (or replaces) a definition keyed by its ID. */
  setDefinition(id: string, definition: Omit<TDefinition, 'id'>): this {
    this.definitions[id] = { ...definition, id } as TDefinition;
    this.manager.clearCachedDefinitions();
    return this;
  }

  getDefinitions(): Record<string, TDefinition> {
    return this.manager.getDefinitions() as Record<string, TDefinition>;
  }

  getDefinition(id: string, exceptionOnInvalid = true): TDefinition | null {
    return this.manager.getDefinition(id, exceptionOnInvalid) as TDefinition | null;
  }

  hasDefinition(id: string): boolean {
    return this.manager.hasDefinition(id);
  }
}
