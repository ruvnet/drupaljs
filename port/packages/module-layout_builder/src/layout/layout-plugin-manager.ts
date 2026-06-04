/**
 * Ports `Drupal\Core\Layout\LayoutPluginManagerInterface` (relevant surface).
 *
 * Drupal discovers layout definitions by scanning each module's `*.layouts.yml`.
 * The TS port replaces discovery with an explicit registration API
 * (`addDefinition`) — the same approach `@drupaljs/hook` takes for hook
 * discovery. `createInstance` builds a {@link LayoutDefault} plugin for a
 * definition id.
 */
import { LayoutDefinition, type LayoutDefinitionData } from './layout-definition.js';
import { LayoutDefault, type LayoutInterface } from './layout-plugin.js';

/** Thrown when a layout id is not registered. Ports PluginNotFoundException. */
export class LayoutPluginNotFoundException extends Error {
  constructor(id: string) {
    super(`The "${id}" layout plugin does not exist.`);
    this.name = 'LayoutPluginNotFoundException';
  }
}

export interface LayoutPluginManagerInterface {
  addDefinition(data: LayoutDefinitionData): void;
  hasDefinition(id: string): boolean;
  getDefinition(id: string): LayoutDefinition;
  getDefinitions(): Record<string, LayoutDefinition>;
  createInstance(id: string, configuration?: Record<string, unknown>): LayoutInterface;
  /** Definitions grouped by category, for the "choose a layout" UI. */
  getCategories(): string[];
}

export class LayoutPluginManager implements LayoutPluginManagerInterface {
  private readonly definitions = new Map<string, LayoutDefinition>();

  addDefinition(data: LayoutDefinitionData): void {
    this.definitions.set(data.id, new LayoutDefinition(data));
  }

  hasDefinition(id: string): boolean {
    return this.definitions.has(id);
  }

  getDefinition(id: string): LayoutDefinition {
    const definition = this.definitions.get(id);
    if (definition === undefined) {
      throw new LayoutPluginNotFoundException(id);
    }
    return definition;
  }

  getDefinitions(): Record<string, LayoutDefinition> {
    return Object.fromEntries(this.definitions);
  }

  createInstance(id: string, configuration: Record<string, unknown> = {}): LayoutInterface {
    return new LayoutDefault(this.getDefinition(id), configuration);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const definition of this.definitions.values()) {
      const category = definition.getCategory();
      if (category !== '') {
        categories.add(category);
      }
    }
    return [...categories].sort();
  }
}
