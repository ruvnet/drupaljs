/**
 * Help controller — TypeScript port of
 * `core/modules/help/src/Controller/HelpController.php`.
 *
 * Two routes are served:
 *  - `helpMain()` — builds the `/admin/help` page from the registered
 *    {@link HelpSectionManager} section plugins, skipping sections whose
 *    `permission` the current user lacks, ordered by the manager's weight sort.
 *  - `helpPage(name)` — builds a module's help page by invoking that module's
 *    `hook_help` for `help.page.<name>`; throws {@link NotFoundError} when the
 *    module implements no help.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { HelpSectionManager, TopicLink } from './help-section.js';

/** Thrown in place of Symfony's `NotFoundHttpException`. */
export class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** A rendered help-section element (`#theme => help_section`). */
export interface HelpSectionRenderElement {
  '#theme': 'help_section';
  '#plugin_id': string;
  '#title': string;
  '#description': string;
  '#empty': string;
  '#links': TopicLink[];
  '#weight': number;
}

/** The render array for a single module's help page. */
export interface HelpPageRenderArray {
  '#title'?: string;
  top?: { '#markup': string } | Record<string, unknown>;
}

/** The current user surface the controller consults for permission checks. */
export interface CurrentUser {
  hasPermission(permission: string): boolean;
}

/**
 * Resolves a module's human-readable name (ModuleExtensionList::getName()).
 * Defaults to the machine name.
 */
export type ModuleNameResolver = (module: string) => string;

export class HelpController {
  constructor(
    private readonly helpManager: HelpSectionManager,
    private readonly moduleHandler: ModuleHandlerInterface,
    private readonly currentUser: CurrentUser,
    private readonly getModuleName: ModuleNameResolver = (m) => m,
  ) {}

  /**
   * Builds the `/admin/help` page: one render element per visible section,
   * keyed by plugin id, in the manager's weight order.
   */
  helpMain(): Record<string, HelpSectionRenderElement> {
    const output: Record<string, HelpSectionRenderElement> = {};
    const definitions = this.helpManager.getDefinitions();

    for (const [pluginId, definition] of Object.entries(definitions)) {
      // Honour the plugin's optional permission gate.
      if (definition.permission && !this.currentUser.hasPermission(definition.permission)) {
        continue;
      }
      const plugin = this.helpManager.createInstance(pluginId);
      const links = plugin.listTopics();
      output[pluginId] = {
        '#theme': 'help_section',
        '#plugin_id': pluginId,
        '#title': plugin.getTitle(),
        '#description': plugin.getDescription(),
        '#empty': 'There is currently nothing in this section.',
        '#links': Array.isArray(links) && links.length > 0 ? links : [],
        '#weight': definition.weight ?? 0,
      };
    }
    return output;
  }

  /**
   * Builds a module's help page by invoking its `hook_help` for
   * `help.page.<name>`. Throws {@link NotFoundError} when the module has no
   * help implementation.
   */
  helpPage(name: string): HelpPageRenderArray {
    if (!this.moduleHandler.hasImplementations('help', name)) {
      throw new NotFoundError();
    }
    const moduleName = this.getModuleName(name);
    const build: HelpPageRenderArray = { '#title': moduleName };

    const help = this.moduleHandler.invoke(name, 'help', [`help.page.${name}`]);
    if (help === null || help === undefined || help === '') {
      build.top = { '#markup': `No help is available for module ${moduleName}.` };
    } else if (typeof help === 'object') {
      build.top = help as Record<string, unknown>;
    } else {
      build.top = { '#markup': String(help) };
    }
    return build;
  }
}
