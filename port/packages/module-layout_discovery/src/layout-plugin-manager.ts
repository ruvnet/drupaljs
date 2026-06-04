/**
 * LayoutPluginManager — TypeScript port of
 * `core/lib/Drupal/Core/Layout/LayoutPluginManager.php`.
 *
 * The PHP manager extends DefaultPluginManager and discovers layouts via
 * attribute + YAML discovery decorators. This port has no PHP/YAML scanning, so
 * raw definitions are supplied explicitly (e.g. {@link coreLayoutDefinitions})
 * and `addDefinition()` runs the faithful `processDefinition()` pipeline:
 *
 * - default the category to the provider name,
 * - prefix `path` (and icon path) with the extension base path,
 * - derive `template`, `theme_hook`, and `template_path` from `template`,
 * - default `default_region` to the first region,
 * - add a config dependency on the library provider.
 *
 * Ported query methods: getDefinition(s), getCategories, getSortedDefinitions,
 * getGroupedDefinitions, getLayoutOptions, getThemeImplementations, and
 * createInstance (returning a {@link LayoutDefault}).
 */
import { LayoutDefinition, type LayoutDefinitionValues } from './layout-definition.js';
import { LayoutDefault, type LayoutConfiguration } from './layout-default.js';

/** Theme hook entry, matching hook_theme()'s shape (minimal). */
export interface ThemeHookEntry {
  'render element': string;
  'initial preprocess'?: string;
  'base hook'?: string;
  template?: string;
  path?: string;
}

/**
 * Resolves an extension (module/theme) base path and human-readable name for a
 * provider machine name, used when defaulting category and prefixing paths.
 *
 * In Drupal this is the ModuleHandler/ThemeHandler pair. Here it is a tiny
 * injected lookup so the manager stays pure and testable.
 *
 * TODO(@drupaljs/extension): replace with the shared extension handlers.
 */
export interface ExtensionResolver {
  /** Returns `{ name, path }` for a provider, or null when unknown. */
  resolve(provider: string): { name: string; path: string } | null;
}

/** A no-op resolver: providers are unknown, paths stay relative. */
const NULL_RESOLVER: ExtensionResolver = { resolve: () => null };

export class LayoutPluginManager {
  private readonly definitions = new Map<string, LayoutDefinition>();

  constructor(private readonly extensionResolver: ExtensionResolver = NULL_RESOLVER) {}

  /** The plugin type (DefaultPluginManager::getType()). */
  getType(): string {
    return 'layout';
  }

  /**
   * Adds (and processes) a raw layout definition. The TS-idiomatic stand-in for
   * discovery: callers feed in the data, this runs `processDefinition`.
   */
  addDefinition(values: LayoutDefinitionValues): LayoutDefinition {
    const definition = new LayoutDefinition(values);
    this.processDefinition(definition);
    this.definitions.set(definition.getId()!, definition);
    return definition;
  }

  /** Bulk-adds raw definitions keyed by id (e.g. {@link coreLayoutDefinitions}). */
  addDefinitions(values: Record<string, LayoutDefinitionValues>): void {
    for (const [id, def] of Object.entries(values)) {
      this.addDefinition({ id, ...def });
    }
  }

  /**
   * {@inheritdoc} — faithful port of LayoutPluginManager::processDefinition().
   */
  processDefinition(definition: LayoutDefinition): void {
    const provider = definition.getProvider();
    const extension = provider ? this.extensionResolver.resolve(provider) : null;

    // Ensure that every plugin has a category.
    if (!definition.getCategory()) {
      definition.setCategory(extension ? extension.name : (provider ?? ''));
    }

    // Add the module or theme path to the 'path'. When no extension resolves
    // (base path empty) the own path is used verbatim — avoiding the leading
    // slash PHP would produce — since there is no base to prefix.
    const basePath = extension ? extension.path : '';
    const ownPath = definition.getPath();
    const path = ownPath ? (basePath ? `${basePath}/${ownPath}` : ownPath) : basePath;
    definition.setPath(path);

    // Add the base path to the icon path.
    const iconPath = definition.getIconPath();
    if (iconPath) {
      definition.setIconPath(`${path}/${iconPath}`);
    }

    // Add a dependency on the provider of the library.
    const library = definition.getLibrary();
    if (library) {
      const deps = definition.getConfigDependencies();
      const libraryProvider = library.split('/', 1)[0]!;
      const resolvedLib = this.extensionResolver.resolve(libraryProvider);
      if (resolvedLib) {
        (deps['module'] ??= []).push(libraryProvider);
      }
      definition.setConfigDependencies(deps);
    }

    // If 'template' is set, derive 'template_path' and 'theme_hook'.
    const template = definition.getTemplate();
    if (template) {
      const parts = template.split('/');
      const file = parts.pop()!;
      let templatePath = path;
      if (parts.length > 0) {
        templatePath += `/${parts.join('/')}`;
      }
      definition.setTemplate(file);
      definition.setThemeHook(file.replace(/-/g, '_'));
      definition.setTemplatePath(templatePath);
    }

    // Default the default region to the first region.
    if (!definition.getDefaultRegion()) {
      const first = definition.getRegionNames()[0];
      if (first !== undefined) {
        definition.setDefaultRegion(first);
      }
    }
  }

  /** Returns a definition by id, or null when missing (PHP returns NULL). */
  getDefinition(pluginId: string): LayoutDefinition | null {
    return this.definitions.get(pluginId) ?? null;
  }

  /** Returns all definitions keyed by plugin id. */
  getDefinitions(): Record<string, LayoutDefinition> {
    return Object.fromEntries(this.definitions);
  }

  /** True when a layout plugin with the given id exists. */
  hasDefinition(pluginId: string): boolean {
    return this.definitions.has(pluginId);
  }

  /**
   * {@inheritdoc} — instantiates a {@link LayoutDefault} for a plugin id.
   *
   * Faithful simplification: core resolves the plugin class from the
   * definition; the layout_discovery layouts all use the default class, so this
   * slice always returns a LayoutDefault.
   */
  createInstance(pluginId: string, configuration: LayoutConfiguration = {}): LayoutDefault {
    const definition = this.getDefinition(pluginId);
    if (!definition) {
      throw new Error(`The "${pluginId}" plugin does not exist.`);
    }
    return new LayoutDefault(definition, configuration);
  }

  /** Returns the unique categories, natural-case sorted (natcasesort). */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const def of this.definitions.values()) {
      categories.add(def.getCategory() ?? '');
    }
    return [...categories].sort(natCaseCmp);
  }

  /**
   * {@inheritdoc} — definitions sorted by category, then label
   * (strnatcasecmp on both).
   */
  getSortedDefinitions(
    definitions?: Record<string, LayoutDefinition>,
  ): Record<string, LayoutDefinition> {
    const source = definitions ?? this.getDefinitions();
    const entries = Object.entries(source).sort(([, a], [, b]) => {
      const ca = a.getCategory() ?? '';
      const cb = b.getCategory() ?? '';
      if (ca !== cb) return natCaseCmp(ca, cb);
      return natCaseCmp(a.getLabel() ?? '', b.getLabel() ?? '');
    });
    return Object.fromEntries(entries);
  }

  /**
   * {@inheritdoc} — definitions grouped by category (sorted within group).
   */
  getGroupedDefinitions(
    definitions?: Record<string, LayoutDefinition>,
  ): Record<string, Record<string, LayoutDefinition>> {
    const sorted = this.getSortedDefinitions(definitions ?? this.getDefinitions());
    const grouped: Record<string, Record<string, LayoutDefinition>> = {};
    for (const [id, def] of Object.entries(sorted)) {
      const category = def.getCategory() ?? '';
      (grouped[category] ??= {})[id] = def;
    }
    return grouped;
  }

  /**
   * {@inheritdoc} — labels grouped by category, suitable for select #options.
   */
  getLayoutOptions(): Record<string, Record<string, string>> {
    const options: Record<string, Record<string, string>> = {};
    for (const [category, defs] of Object.entries(this.getGroupedDefinitions())) {
      for (const [name, def] of Object.entries(defs)) {
        (options[category] ??= {})[name] = def.getLabel() ?? '';
      }
    }
    return options;
  }

  /**
   * {@inheritdoc} — theme implementations for hook_theme().
   *
   * Always provides the base `layout` hook; each layout with a template adds a
   * derived theme hook that uses `layout` as its base hook.
   */
  getThemeImplementations(): Record<string, ThemeHookEntry> {
    const hooks: Record<string, ThemeHookEntry> = {
      layout: {
        'render element': 'content',
        'initial preprocess': 'LayoutDiscoveryThemeHooks:preprocessLayout',
      },
    };
    for (const def of this.definitions.values()) {
      const template = def.getTemplate();
      if (template) {
        hooks[def.getThemeHook()!] = {
          'render element': 'content',
          'base hook': 'layout',
          template,
          path: def.getTemplatePath(),
        };
      }
    }
    return hooks;
  }
}

/**
 * Case-insensitive natural-order comparison, the JS analogue of PHP's
 * `strnatcasecmp` / `natcasesort` used to order layout categories and labels.
 */
function natCaseCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'accent' });
}
