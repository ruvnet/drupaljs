/**
 * Help page section plugins — TypeScript port of the help module's
 * `Plugin/HelpSection` system:
 *
 *   - `HelpSectionPluginInterface`     -> {@link HelpSectionPluginInterface}
 *   - `Plugin\HelpSection\HelpSectionPluginBase` -> {@link HelpSectionPluginBase}
 *   - `Plugin\HelpSection\HookHelpSection`       -> {@link HookHelpSection}
 *   - `HelpSectionManager` (DefaultPluginManager) -> {@link HelpSectionManager}
 *
 * The `/admin/help` page is built from these section plugins. Each section has
 * a title, a description and a list of topic links. Drupal discovers plugins via
 * the `#[HelpSection]` attribute + `DefaultPluginManager`; the TS port has no
 * attribute scanning, so {@link HelpSectionManager} takes an explicit registry
 * of definitions+factories — the idiomatic equivalent (cf. @drupaljs/hook docs).
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

/**
 * A topic link shown inside a help section.
 *
 * Drupal returns `\Drupal\Core\Link` objects (or render arrays). We model the
 * minimal link surface.
 *
 * TODO(@drupaljs/link): replace with the shared Link value object once the link
 * package lands; for now a section emits plain `{ title, routeName, params }`.
 */
export interface TopicLink {
  readonly title: string;
  readonly routeName: string;
  readonly routeParameters?: Record<string, string>;
}

/**
 * Definition metadata for a help-section plugin, ported from the
 * `#[HelpSection]` attribute (id/title/description/weight/permission).
 */
export interface HelpSectionDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Lower weights sort first on the help page. Defaults to 0. */
  readonly weight?: number;
  /** Optional permission gating visibility of the whole section. */
  readonly permission?: string;
}

/**
 * Ports `Drupal\help\HelpSectionPluginInterface`.
 *
 * `CacheableDependencyInterface` members from the original are reduced to the
 * unchanging defaults that {@link HelpSectionPluginBase} provides; the help
 * sections shipped here are not cache-context sensitive.
 */
export interface HelpSectionPluginInterface {
  /** Returns the title of the help section. */
  getTitle(): string;
  /** Returns the description text for the help section. */
  getDescription(): string;
  /** Returns a sorted list of topic links to show in the section. */
  listTopics(): TopicLink[];
}

/**
 * Ports `Plugin\HelpSection\HelpSectionPluginBase`: title/description come from
 * the plugin definition. Subclasses implement {@link listTopics}.
 */
export abstract class HelpSectionPluginBase implements HelpSectionPluginInterface {
  constructor(protected readonly definition: HelpSectionDefinition) {}

  getTitle(): string {
    return this.definition.title;
  }

  getDescription(): string {
    return this.definition.description;
  }

  abstract listTopics(): TopicLink[];
}

/**
 * Ports `Plugin\HelpSection\HookHelpSection`: lists one topic per module that
 * implements `hook_help`, each linking to `help.page` for that module, sorted
 * by the module's human-readable name.
 *
 * The PHP original resolves the human name via `ModuleExtensionList::getName()`;
 * we accept an optional name resolver and fall back to the machine name.
 */
export class HookHelpSection extends HelpSectionPluginBase {
  constructor(
    definition: HelpSectionDefinition,
    private readonly moduleHandler: ModuleHandlerInterface,
    private readonly getModuleName: (module: string) => string = (m) => m,
  ) {
    super(definition);
  }

  listTopics(): TopicLink[] {
    const topics: { title: string; link: TopicLink }[] = [];
    this.moduleHandler.invokeAllWith('help', (_listener, module) => {
      const title = this.getModuleName(module);
      topics.push({
        title,
        link: { title, routeName: 'help.page', routeParameters: { name: module } },
      });
    });
    // Sort topics by title (Drupal: ksort on the title-keyed array).
    topics.sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
    return topics.map((t) => t.link);
  }
}

/** A factory that instantiates a section plugin from its definition. */
export type HelpSectionFactory = () => HelpSectionPluginInterface;

interface SectionRegistration {
  readonly definition: HelpSectionDefinition;
  readonly factory: HelpSectionFactory;
}

/**
 * Ports `Drupal\help\HelpSectionManager` (a `DefaultPluginManager`).
 *
 * PHP discovers section plugins by attribute and caches definitions; here
 * sections are registered explicitly. {@link getDefinitions} returns them
 * sorted by weight (then id) — the order the help page renders sections in.
 * `alterInfo('help_section_info')` is honoured: if a `help_section_info` alter
 * hook is registered on the module handler, definitions are passed through it.
 */
export class HelpSectionManager {
  private readonly registrations = new Map<string, SectionRegistration>();

  constructor(private readonly moduleHandler?: ModuleHandlerInterface) {}

  /** Registers a section plugin (definition + factory). */
  register(definition: HelpSectionDefinition, factory: HelpSectionFactory): void {
    this.registrations.set(definition.id, { definition, factory });
  }

  /**
   * Returns plugin definitions keyed by id, sorted by weight then id, after
   * running the `help_section_info` alter hook (if any).
   */
  getDefinitions(): Record<string, HelpSectionDefinition> {
    const defs: Record<string, HelpSectionDefinition> = {};
    for (const { definition } of this.registrations.values()) {
      defs[definition.id] = definition;
    }
    // alterInfo('help_section_info') — let modules mutate the definition map.
    this.moduleHandler?.alter('help_section_info', defs);

    const sorted: Record<string, HelpSectionDefinition> = {};
    for (const id of Object.keys(defs).sort((a, b) => {
      const wa = defs[a]!.weight ?? 0;
      const wb = defs[b]!.weight ?? 0;
      return wa !== wb ? wa - wb : a < b ? -1 : a > b ? 1 : 0;
    })) {
      sorted[id] = defs[id]!;
    }
    return sorted;
  }

  /** Instantiates a section plugin by id (DefaultPluginManager::createInstance). */
  createInstance(id: string): HelpSectionPluginInterface {
    const registration = this.registrations.get(id);
    if (registration === undefined) {
      throw new Error(`The "${id}" plugin does not exist.`);
    }
    return registration.factory();
  }
}
