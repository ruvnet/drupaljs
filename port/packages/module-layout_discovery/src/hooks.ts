/**
 * layout_discovery hook implementations — TypeScript port of
 * `core/modules/layout_discovery/src/Hook/LayoutDiscoveryHooks.php` and
 * `LayoutDiscoveryThemeHooks.php`.
 *
 * Drupal 11 declares these with `#[Hook('...')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so we expose plain functions
 * plus {@link registerLayoutDiscoveryHooks}, which registers them on a
 * `@drupaljs/hook` ModuleHandler via its explicit `implement()` API.
 *
 * Ported hooks:
 * - `hook_help` (LayoutDiscoveryHooks::help)
 * - `hook_theme` (LayoutDiscoveryThemeHooks::theme — delegates to the manager)
 * - `preprocessLayout` (template_preprocess_layout, registered as the layout
 *   hook's initial preprocess).
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { LayoutPluginManager, ThemeHookEntry } from './layout-plugin-manager.js';
import type { RenderArray } from './layout-default.js';

/** This module's machine name. */
export const MODULE_NAME = 'layout_discovery';

/**
 * Implements hook_help(): returns help markup for a route, or null when the
 * module has no help for it (faithful to the PHP `?string` return).
 */
export function layoutDiscoveryHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.layout_discovery': {
      let output = '<h2>About</h2>';
      output +=
        '<p>Layout Discovery allows modules or themes to register layouts, and ' +
        'for other modules to list the available layouts and render them.</p>';
      output +=
        '<p>For more information, see the ' +
        '<a href="https://www.drupal.org/docs/8/api/layout-api">online documentation ' +
        'for the Layout Discovery module</a>.</p>';
      return output;
    }
    default:
      return null;
  }
}

/**
 * Implements hook_theme(): delegates to the layout plugin manager, exactly like
 * LayoutDiscoveryThemeHooks::theme().
 */
export function layoutDiscoveryTheme(
  manager: LayoutPluginManager,
): Record<string, ThemeHookEntry> {
  return manager.getThemeImplementations();
}

/**
 * Variables passed to layout templates, after preprocessing.
 * Faithful to the keys set by template_preprocess_layout().
 */
export interface LayoutTemplateVariables {
  content: RenderArray;
  settings?: unknown;
  layout?: unknown;
  in_preview?: boolean;
  region_attributes?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Prepares variables for layout templates — port of
 * LayoutDiscoveryThemeHooks::preprocessLayout().
 *
 * Mutates `variables` in place (Drupal passes `&$variables`):
 * - lifts `#settings`, `#layout`, `#in_preview` off `content`,
 * - builds a `region_attributes` entry for each child region from its
 *   `#attributes` (defaulting missing attributes to `{}`).
 *
 * `Element::children()` is ported as "non-`#`-prefixed keys of content"; the
 * Attribute object is represented as the plain attributes record.
 */
export function preprocessLayout(variables: LayoutTemplateVariables): void {
  const content = variables.content;
  variables.settings = (content['#settings'] as unknown) ?? {};
  variables.layout = (content['#layout'] as unknown) ?? {};
  variables.in_preview = (content['#in_preview'] as boolean) ?? false;

  variables.region_attributes ??= {};
  for (const name of elementChildren(content)) {
    const child = content[name] as RenderArray;
    if (child['#attributes'] === undefined) {
      child['#attributes'] = {};
    }
    variables.region_attributes[name] = child['#attributes'] as Record<string, unknown>;
  }
}

/**
 * Returns the child element keys of a render array — every key that is not a
 * `#`-prefixed render property. Ports `Element::children()` (without weight
 * sorting, which layout regions do not use).
 */
function elementChildren(element: RenderArray): string[] {
  return Object.keys(element).filter((key) => !key.startsWith('#'));
}

/**
 * Registers the layout_discovery module's hook implementations on a
 * ModuleHandler. `hook_theme` is wired to the provided plugin manager.
 */
export function registerLayoutDiscoveryHooks(
  handler: ModuleHandlerInterface,
  manager: LayoutPluginManager,
): void {
  handler.implement(MODULE_NAME, 'help', (routeName: unknown) =>
    layoutDiscoveryHelp(routeName as string),
  );
  handler.implement(MODULE_NAME, 'theme', () => layoutDiscoveryTheme(manager));
}
