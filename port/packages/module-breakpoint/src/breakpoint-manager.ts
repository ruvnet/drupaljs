import { DefaultPluginManager } from '@drupaljs/plugin';
import type { Manifest, PluginDefinition } from '@drupaljs/plugin';
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { SortArray } from '@drupaljs/util';
import { Breakpoint } from './breakpoint.js';
import type { BreakpointInterface } from './breakpoint-interface.js';
import type { BreakpointManagerInterface } from './breakpoint-manager-interface.js';

/**
 * Minimal theme handler contract used by the breakpoint manager.
 *
 * Port of the slice of `Drupal\Core\Extension\ThemeHandlerInterface` the manager
 * needs. Themes (like modules) can provide breakpoints; the manager consults the
 * theme handler to resolve providers/groups and their labels.
 *
 * TODO(@drupaljs/extension): replace with the shared ThemeHandler contract once
 * the extension package lands.
 */
export interface ThemeHandlerInterface {
  /** True when the named theme is installed. */
  themeExists(theme: string): boolean;
  /** Returns the human-readable name of a theme (not translatable). */
  getName(theme: string): string;
}

/** Construction-time collaborators for {@link BreakpointManager}. */
export interface BreakpointManagerDependencies {
  moduleHandler: ModuleHandlerInterface;
  themeHandler: ThemeHandlerInterface;
}

/**
 * Defines a breakpoint plugin manager to deal with breakpoints.
 *
 * Port of `Drupal\breakpoint\BreakpointManager`
 * (drupal-core/core/modules/breakpoint/src/BreakpointManager.php).
 *
 * Extensions define breakpoints in an `EXTENSION_NAME.breakpoints.yml` file.
 * Each breakpoint has the structure:
 * ```yaml
 *   MACHINE_NAME:
 *     label: STRING
 *     mediaQuery: STRING
 *     weight: INTEGER
 *     multipliers: [STRING, ...]
 * ```
 * In place of Drupal's `YamlDiscovery`, this port is handed the parsed
 * definitions directly via a {@link Manifest} (see `@drupaljs/plugin`'s
 * ManifestDiscovery). Definition post-processing (group defaulting, ensuring a
 * `1x` multiplier, numeric multiplier sorting) faithfully mirrors
 * `BreakpointManager::processDefinition()`.
 *
 * @see Breakpoint
 * @see BreakpointInterface
 */
export class BreakpointManager
  extends DefaultPluginManager
  implements BreakpointManagerInterface
{
  private readonly moduleHandler: ModuleHandlerInterface;
  private readonly themeHandler: ThemeHandlerInterface;

  /** Static cache of processed definitions. */
  private processedDefinitions: Record<string, PluginDefinition> | null = null;
  /** Static cache of breakpoint instances keyed by plugin id. */
  private instances: Record<string, BreakpointInterface> = {};

  constructor(manifest: Manifest, deps: BreakpointManagerDependencies) {
    super(manifest, {
      defaults: {
        label: '',
        mediaQuery: '',
        weight: 0,
        multipliers: [],
        group: '',
        class: Breakpoint,
        id: '',
      },
      pluginInterface: Breakpoint,
      cacheKey: 'breakpoints',
    });
    this.moduleHandler = deps.moduleHandler;
    this.themeHandler = deps.themeHandler;
  }

  /**
   * Returns processed breakpoint definitions.
   *
   * Wraps the base discovery output with `processDefinition()` so callers and
   * the factory always see normalized definitions.
   */
  override getDefinitions(): Record<string, PluginDefinition> {
    if (this.processedDefinitions !== null) {
      return this.processedDefinitions;
    }
    const raw = super.getDefinitions();
    const processed: Record<string, PluginDefinition> = {};
    for (const [pluginId, definition] of Object.entries(raw)) {
      processed[pluginId] = this.processDefinition({ ...definition }, pluginId);
    }
    this.processedDefinitions = processed;
    return processed;
  }

  override getDefinition(pluginId: string, exceptionOnInvalid = true): PluginDefinition | null {
    const definitions = this.getDefinitions();
    const definition = definitions[pluginId];
    if (definition === undefined) {
      if (exceptionOnInvalid) {
        throw new Error(`The "${pluginId}" plugin does not exist.`);
      }
      return null;
    }
    return definition;
  }

  override hasDefinition(pluginId: string): boolean {
    return this.getDefinition(pluginId, false) !== null;
  }

  /**
   * Normalizes a breakpoint definition.
   *
   * Port of `BreakpointManager::processDefinition()`:
   * - defaults the group to the provider,
   * - guarantees a `1x` multiplier,
   * - sorts multipliers numerically (so `1x, 1.5x, 2x`).
   */
  private processDefinition(
    definition: PluginDefinition,
    _pluginId: string,
  ): PluginDefinition {
    if (!definition['group']) {
      definition['group'] = definition['provider'];
    }
    const multipliers = Array.isArray(definition['multipliers'])
      ? [...(definition['multipliers'] as string[])]
      : [];
    if (!multipliers.includes('1x')) {
      multipliers.push('1x');
    }
    // Sort numerically by the leading number (SORT_NUMERIC over "1x"/"2x").
    multipliers.sort((a, b) => parseFloat(a) - parseFloat(b));
    definition['multipliers'] = multipliers;
    return definition;
  }

  getBreakpointsByGroup(group: string): Record<string, BreakpointInterface> {
    const matching: Record<string, PluginDefinition> = {};
    for (const [pluginId, definition] of Object.entries(this.getDefinitions())) {
      if (definition['group'] === group) {
        matching[pluginId] = definition;
      }
    }

    // Sort by weight (stable), mirroring uasort(SortArray::sortByWeightElement).
    const sortedIds = Object.keys(matching).sort((a, b) =>
      SortArray.sortByWeightElement(matching[a], matching[b]),
    );

    const result: Record<string, BreakpointInterface> = {};
    for (const pluginId of sortedIds) {
      if (this.instances[pluginId] === undefined) {
        this.instances[pluginId] = this.createBreakpointInstance(pluginId, matching[pluginId]!);
      }
      result[pluginId] = this.instances[pluginId]!;
    }
    return result;
  }

  /**
   * Builds a breakpoint plugin instance from a *processed* definition.
   *
   * The base factory reads from the raw (unprocessed) discovery, so instances
   * are created here against the normalized definition to ensure
   * `getGroup()`/`getMultipliers()` reflect `processDefinition()`. The
   * definition's `class` (defaulting to {@link Breakpoint}) is honored.
   */
  private createBreakpointInstance(
    pluginId: string,
    definition: PluginDefinition,
  ): BreakpointInterface {
    const ctor = (typeof definition['class'] === 'function'
      ? definition['class']
      : Breakpoint) as typeof Breakpoint;
    return new ctor({}, pluginId, definition);
  }

  getGroups(): Record<string, string> {
    const groups: Record<string, string> = {};
    for (const definition of Object.values(this.getDefinitions())) {
      const group = String(definition['group'] ?? '');
      if (groups[group] === undefined) {
        groups[group] = group;
      }
    }
    // Resolve labels (not cacheable in Drupal due to translation).
    const labels: Record<string, string> = {};
    for (const group of Object.keys(groups)) {
      labels[group] = this.getGroupLabel(group);
    }
    // asort() — sort by label value.
    const sorted: Record<string, string> = {};
    for (const group of Object.keys(labels).sort((a, b) =>
      SortArray.sortByKeyString({ v: labels[a] }, { v: labels[b] }, 'v'),
    )) {
      sorted[group] = labels[group]!;
    }
    return sorted;
  }

  getGroupProviders(group: string): Record<string, 'module' | 'theme'> {
    const providers: Record<string, 'module' | 'theme'> = {};
    const breakpoints = this.getBreakpointsByGroup(group);
    for (const breakpoint of Object.values(breakpoints)) {
      const provider = breakpoint.getProvider();
      if (this.moduleHandler.moduleExists(provider)) {
        providers[provider] = 'module';
      } else if (this.themeHandler.themeExists(provider)) {
        providers[provider] = 'theme';
      }
    }
    return providers;
  }

  override clearCachedDefinitions(): void {
    super.clearCachedDefinitions();
    this.processedDefinitions = null;
    this.instances = {};
  }

  /**
   * Gets the label for a breakpoint group.
   *
   * Port of `BreakpointManager::getGroupLabel()`. Extension names are not
   * translatable; a custom group label would be (translation is deferred in
   * this port, so the raw group string is returned).
   */
  private getGroupLabel(group: string): string {
    if (this.moduleHandler.moduleExists(group)) {
      return group;
    }
    if (this.themeHandler.themeExists(group)) {
      return this.themeHandler.getName(group);
    }
    // Custom group label (would be translated in Drupal).
    return group;
  }
}
