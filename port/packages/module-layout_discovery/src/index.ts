/**
 * @drupaljs/module-layout_discovery — TypeScript port of Drupal core's
 * `layout_discovery` module plus the `Drupal\Core\Layout` plugin it relies on.
 *
 * Vertical slice:
 * - {@link LayoutDefinition}: layout plugin metadata (regions, template, etc.).
 * - {@link LayoutDefault}/{@link LayoutInterface}: the default layout plugin and
 *   its `build()` render-array contract.
 * - {@link LayoutPluginManager}: definition processing, sorting/grouping,
 *   layout options, and `getThemeImplementations()`.
 * - {@link coreLayoutDefinitions}: the five core layouts from the module's
 *   `*.layouts.yml`.
 * - hook implementations (`hook_help`, `hook_theme`, `preprocessLayout`) and
 *   {@link registerLayoutDiscoveryHooks} to register them on a
 *   `@drupaljs/hook` ModuleHandler.
 */
export {
  LayoutDefinition,
  type LayoutDefinitionValues,
  type LayoutRegion,
  type LayoutRegions,
} from './layout-definition.js';

export {
  LayoutDefault,
  type LayoutInterface,
  type LayoutConfiguration,
  type RenderArray,
} from './layout-default.js';

export {
  LayoutPluginManager,
  type ExtensionResolver,
  type ThemeHookEntry,
} from './layout-plugin-manager.js';

export {
  coreLayoutDefinitions,
  LAYOUT_DISCOVERY_PROVIDER,
} from './layouts.js';

export {
  MODULE_NAME,
  layoutDiscoveryHelp,
  layoutDiscoveryTheme,
  preprocessLayout,
  registerLayoutDiscoveryHooks,
  type LayoutTemplateVariables,
} from './hooks.js';
