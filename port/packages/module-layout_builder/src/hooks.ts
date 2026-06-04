/**
 * Hook implementations for the layout_builder module, registered with
 * `@drupaljs/hook`'s ModuleHandler. Ports a faithful subset of
 * `Drupal\layout_builder\Hook\LayoutBuilderHooks`:
 *
 *   - `help`                         — help text for the module's routes.
 *   - `plugin_filter_layout_alter`   — removes the blank layout from the UI.
 *
 * The original discovers these via `#[Hook(...)]` attributes; the TS port uses
 * the explicit `implement()` registration API.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

export const MODULE_NAME = 'layout_builder';

/**
 * A layout definition as seen by `plugin_filter_layout_alter`. Only the `id` is
 * needed to filter; other keys are passed through untouched.
 */
export interface FilterableLayoutDefinition {
  readonly id: string;
  readonly [key: string]: unknown;
}

/**
 * Ports `LayoutBuilderHooks::help()`: returns help markup for known routes, or
 * null otherwise.
 */
export function help(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.layout_builder':
      return (
        'The Layout Builder module provides layout management for content ' +
        'displays, allowing the placement of blocks and fields within ' +
        'configurable sections.'
      );
    default:
      return null;
  }
}

/**
 * Ports `LayoutBuilderHooks::pluginFilterLayoutLayoutBuilderAlter()`: the blank
 * layout (`layout_builder_blank`) is internal and must not be offered in the
 * "choose a layout" UI. Mutates the definitions map in place.
 */
export function pluginFilterLayoutLayoutBuilderAlter(
  definitions: Record<string, FilterableLayoutDefinition>,
): void {
  delete definitions['layout_builder_blank'];
}

/**
 * Registers all layout_builder hook implementations on a ModuleHandler.
 * Mirrors how Drupal would discover the `#[Hook]`-attributed methods.
 */
export function registerHooks(moduleHandler: ModuleHandlerInterface): void {
  moduleHandler.implement(MODULE_NAME, 'help', (routeName: string) => help(routeName));
  moduleHandler.implement(
    MODULE_NAME,
    'plugin_filter_layout__layout_builder_alter',
    (definitions: Record<string, FilterableLayoutDefinition>) =>
      pluginFilterLayoutLayoutBuilderAlter(definitions),
  );
}
