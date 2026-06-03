/**
 * @drupaljs/module-help — TypeScript port of Drupal core's `help` module.
 *
 * Ports the core vertical slice of `core/modules/help`:
 *
 *   - **Permissions** (`help.permissions.yml`) -> {@link helpPermissions}
 *   - **Routes / menu links** (`help.routing.yml`, `help.links.menu.yml`)
 *       -> {@link helpRoutes}, {@link helpMenuLinks}
 *   - **Hook implementations** (`src/Hook/HelpHooks.php`) -> {@link helpHelp},
 *       {@link helpTheme}, {@link helpBlockViewHelpBlockAlter}, registered on a
 *       `@drupaljs/hook` ModuleHandler via {@link registerHelpHooks}
 *   - **Help-section plugins** (`HelpSectionPluginInterface`,
 *       `HelpSectionPluginBase`, `HookHelpSection`, `HelpSectionManager`)
 *       -> {@link HelpSectionPluginBase}, {@link HookHelpSection},
 *          {@link HelpSectionManager}
 *   - **Help block** (`Plugin/Block/HelpBlock.php`) -> {@link buildHelpBlock},
 *       {@link helpBlockCacheContexts}
 *   - **Controllers** (`Controller/HelpController.php`) -> {@link HelpController}
 *
 * Deep external collaborators (renderer, twig topic plugins, breadcrumb builder,
 * search integration, extension list) are stubbed with local types + TODOs.
 */

export { helpPermissions, type Permission } from './permissions.js';

export {
  helpRoutes,
  helpMenuLinks,
  type MenuLinkDefinition,
} from './routes.js';

export {
  helpHelp,
  helpTheme,
  helpBlockViewHelpBlockAlter,
  registerHelpHooks,
  type HelpContext,
  type MarkupRenderArray,
  type ThemeHookDefinition,
  type BlockBuild,
} from './hooks.js';

export {
  HelpSectionPluginBase,
  HookHelpSection,
  HelpSectionManager,
  type HelpSectionPluginInterface,
  type HelpSectionDefinition,
  type HelpSectionFactory,
  type TopicLink,
} from './help-section.js';

export {
  buildHelpBlock,
  helpBlockCacheContexts,
  type HelpBlockContext,
  type HelpBlockElement,
} from './help-block.js';

export {
  HelpController,
  NotFoundError,
  type CurrentUser,
  type ModuleNameResolver,
  type HelpSectionRenderElement,
  type HelpPageRenderArray,
} from './help-controller.js';
