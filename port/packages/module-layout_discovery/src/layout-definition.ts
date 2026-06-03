/**
 * LayoutDefinition — TypeScript port of
 * `core/lib/Drupal/Core/Layout/LayoutDefinition.php`.
 *
 * Holds the metadata for a single layout plugin (label, category, regions,
 * template/theme hook, asset library, icon map, etc.). The PHP class extends
 * `PluginDefinition` and mixes in dependent/context-aware traits; this port
 * models the layout-specific surface only and stubs deep plugin-system traits
 * with the minimal fields actually exercised by the layout_discovery slice.
 *
 * The `get`/`set` accessors faithfully mirror the PHP arbitrary-property
 * behaviour: known properties read/write the typed field, unknown ones spill
 * into an `additional` bag.
 */

/** A region in a layout: machine name -> { label, ... }. */
export interface LayoutRegion {
  /** Human-readable region name. */
  label: string;
  /** Any layout-plugin-specific extra keys (undefined here). */
  [key: string]: unknown;
}

/** Map of region machine name -> region definition. */
export type LayoutRegions = Record<string, LayoutRegion>;

/**
 * Raw layout definition values, as produced by YAML discovery / a plugin
 * attribute. Mirrors the keys read by {@link LayoutDefinition}'s constructor.
 */
export interface LayoutDefinitionValues {
  id?: string;
  label?: string;
  description?: string;
  category?: string;
  template?: string | null;
  template_path?: string;
  theme_hook?: string | null;
  path?: string;
  library?: string | null;
  icon?: string | null;
  icon_map?: string[][] | null;
  regions?: LayoutRegions;
  default_region?: string;
  /** Plugin provider (module/theme machine name). */
  provider?: string;
  /** Deriver class/id, if any. */
  deriver?: string | null;
  /** Anything else spills into `additional`. */
  [key: string]: unknown;
}

/** Known typed properties of {@link LayoutDefinition}. */
const KNOWN_PROPERTIES = new Set<string>([
  'id',
  'label',
  'description',
  'category',
  'template',
  'templatePath',
  'theme_hook',
  'path',
  'library',
  'icon',
  'icon_map',
  'regions',
  'default_region',
  'provider',
  'deriver',
]);

export class LayoutDefinition {
  id?: string;
  protected label?: string;
  protected description?: string;
  protected category?: string;
  protected template?: string | null;
  protected templatePath?: string;
  protected theme_hook?: string | null;
  protected path = '';
  protected library?: string | null;
  protected icon?: string | null;
  protected icon_map?: string[][] | null;
  protected regions: LayoutRegions = {};
  protected default_region?: string;
  protected provider?: string;
  protected deriver?: string | null;

  /** Arbitrary additional properties (PHP `$additional`). */
  protected additional: Record<string, unknown> = {};

  /** Config dependencies bag (DependentPluginDefinitionTrait, minimal). */
  protected dependencies: Record<string, string[]> = {};

  constructor(definition: LayoutDefinitionValues = {}) {
    for (const [property, value] of Object.entries(definition)) {
      this.set(property, value);
    }
  }

  /** Gets any property; unknown names read from the `additional` bag. */
  get(property: string): unknown {
    if (KNOWN_PROPERTIES.has(property)) {
      // template_path in YAML maps to templatePath field.
      return (this as Record<string, unknown>)[property] ?? null;
    }
    if (property === 'template_path') return this.templatePath ?? null;
    return this.additional[property] ?? null;
  }

  /** Sets any property; unknown names spill into the `additional` bag. */
  set(property: string, value: unknown): this {
    if (property === 'template_path') {
      this.templatePath = value as string;
      return this;
    }
    if (KNOWN_PROPERTIES.has(property)) {
      (this as Record<string, unknown>)[property] = value;
    } else {
      this.additional[property] = value;
    }
    return this;
  }

  getId(): string | undefined {
    return this.id;
  }

  getLabel(): string | undefined {
    return this.label;
  }

  setLabel(label: string): this {
    this.label = label;
    return this;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  getCategory(): string | undefined {
    return this.category;
  }

  setCategory(category: string): this {
    this.category = category;
    return this;
  }

  getTemplate(): string | null | undefined {
    return this.template;
  }

  setTemplate(template: string | null): this {
    this.template = template;
    return this;
  }

  getTemplatePath(): string | undefined {
    return this.templatePath;
  }

  setTemplatePath(templatePath: string): this {
    this.templatePath = templatePath;
    return this;
  }

  getThemeHook(): string | null | undefined {
    return this.theme_hook;
  }

  setThemeHook(themeHook: string): this {
    this.theme_hook = themeHook;
    return this;
  }

  getPath(): string {
    return this.path;
  }

  setPath(path: string): this {
    this.path = path;
    return this;
  }

  getLibrary(): string | null | undefined {
    return this.library;
  }

  setLibrary(library: string | null): this {
    this.library = library;
    return this;
  }

  getIconPath(): string | null | undefined {
    return this.icon;
  }

  setIconPath(icon: string | null): this {
    this.icon = icon;
    return this;
  }

  getIconMap(): string[][] | null | undefined {
    return this.icon_map;
  }

  setIconMap(iconMap: string[][] | null): this {
    this.icon_map = iconMap;
    return this;
  }

  getRegions(): LayoutRegions {
    return this.regions;
  }

  setRegions(regions: LayoutRegions): this {
    this.regions = regions;
    return this;
  }

  /** Gets the machine-readable region names, in definition order. */
  getRegionNames(): string[] {
    return Object.keys(this.regions);
  }

  /** Gets region labels keyed by region machine name. */
  getRegionLabels(): Record<string, string> {
    const labels: Record<string, string> = {};
    for (const [name, region] of Object.entries(this.regions)) {
      labels[name] = region.label;
    }
    return labels;
  }

  getDefaultRegion(): string | undefined {
    return this.default_region;
  }

  setDefaultRegion(defaultRegion: string): this {
    this.default_region = defaultRegion;
    return this;
  }

  getProvider(): string | undefined {
    return this.provider;
  }

  setProvider(provider: string): this {
    this.provider = provider;
    return this;
  }

  getDeriver(): string | null | undefined {
    return this.deriver;
  }

  setDeriver(deriver: string | null): this {
    this.deriver = deriver;
    return this;
  }

  /**
   * Returns the config dependencies bag.
   *
   * TODO(@drupaljs/plugin): replace with the shared
   * DependentPluginDefinitionTrait once it lands.
   */
  getConfigDependencies(): Record<string, string[]> {
    return this.dependencies;
  }

  setConfigDependencies(dependencies: Record<string, string[]>): this {
    this.dependencies = dependencies;
    return this;
  }
}
