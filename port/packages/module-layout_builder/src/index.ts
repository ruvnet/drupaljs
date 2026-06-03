/**
 * @drupaljs/module-layout_builder — TypeScript port of Drupal core's
 * `layout_builder` module (vertical slice).
 *
 * Ports the module's domain core:
 *   - {@link Section} / {@link SectionComponent} — the layout data model.
 *   - The layout plugin system ({@link LayoutDefinition},
 *     {@link LayoutPluginManager}, {@link LayoutDefault}) and the built-in
 *     one/two/three/four-column layouts.
 *   - {@link LayoutBuilderEvents} + the component build-render event.
 *   - Static + dynamic {@link allPermissions permissions}.
 *   - The {@link ROUTES route table}.
 *   - Hook implementations ({@link registerHooks}) registered via @drupaljs/hook.
 *
 * Deep dependencies (entity storage, tempstore, forms, controllers, render
 * pipeline) are stubbed with local types + TODOs per ADR-0017.
 */

// Domain model
export { Section, type SectionData } from './section.js';
export {
  SectionComponent,
  PluginException,
  type SectionComponentData,
  type ComponentEventDispatcher,
} from './section-component.js';

// Layout plugin system
export {
  LayoutDefinition,
  type LayoutDefinitionData,
  type LayoutRegionDefinition,
} from './layout/layout-definition.js';
export {
  LayoutDefault,
  type LayoutInterface,
  type RenderArray,
  type RenderedRegions,
} from './layout/layout-plugin.js';
export {
  LayoutPluginManager,
  LayoutPluginNotFoundException,
  type LayoutPluginManagerInterface,
} from './layout/layout-plugin-manager.js';
export { BUILTIN_LAYOUTS, registerBuiltinLayouts } from './layout/builtin-layouts.js';

// Events
export {
  LayoutBuilderEvents,
  SectionComponentBuildRenderArrayEvent,
  type Contexts,
} from './events.js';

// Permissions
export {
  STATIC_PERMISSIONS,
  allPermissions,
  overridesPermissions,
  type PermissionDefinition,
  type OverridableDisplay,
} from './permissions.js';

// Routes
export {
  ROUTES,
  getRoute,
  type LayoutBuilderRoute,
  type LayoutBuilderAccessOp,
} from './routes.js';

// Hooks
export {
  MODULE_NAME,
  registerHooks,
  help,
  pluginFilterLayoutLayoutBuilderAlter,
  type FilterableLayoutDefinition,
} from './hooks.js';
