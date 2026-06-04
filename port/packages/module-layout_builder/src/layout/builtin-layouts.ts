/**
 * Built-in layout definitions shipped by the layout_builder module.
 *
 * Faithful port of `layout_builder.layouts.yml` (twocol/threecol/fourcol). The
 * single-column `layout_onecol` ships from core's `layout_discovery` module in
 * Drupal; it is included here so the vertical slice has a default layout.
 *
 * TODO(@drupaljs/module-layout_discovery): move `layout_onecol` to the
 * layout_discovery package once it exists.
 */
import type { LayoutDefinitionData } from './layout-definition.js';
import type { LayoutPluginManagerInterface } from './layout-plugin-manager.js';

export const BUILTIN_LAYOUTS: readonly LayoutDefinitionData[] = [
  {
    id: 'layout_onecol',
    label: 'One column',
    category: 'Columns: 1',
    template: 'layout--onecol',
    theme_hook: 'layout__onecol',
    default_region: 'content',
    regions: { content: { label: 'Content' } },
  },
  {
    id: 'layout_twocol_section',
    label: 'Two column',
    category: 'Columns: 2',
    template: 'layout--twocol-section',
    theme_hook: 'layout__twocol_section',
    library: 'layout_builder/twocol_section',
    default_region: 'first',
    regions: {
      first: { label: 'First' },
      second: { label: 'Second' },
    },
  },
  {
    id: 'layout_threecol_section',
    label: 'Three column',
    category: 'Columns: 3',
    template: 'layout--threecol-section',
    theme_hook: 'layout__threecol_section',
    library: 'layout_builder/threecol_section',
    default_region: 'second',
    regions: {
      first: { label: 'First' },
      second: { label: 'Second' },
      third: { label: 'Third' },
    },
  },
  {
    id: 'layout_fourcol_section',
    label: 'Four column',
    category: 'Columns: 4',
    template: 'layout--fourcol-section',
    theme_hook: 'layout__fourcol_section',
    library: 'layout_builder/fourcol_section',
    default_region: 'first',
    regions: {
      first: { label: 'First' },
      second: { label: 'Second' },
      third: { label: 'Third' },
      fourth: { label: 'Fourth' },
    },
  },
] as const;

/** Registers all built-in layout definitions on a plugin manager. */
export function registerBuiltinLayouts(manager: LayoutPluginManagerInterface): void {
  for (const definition of BUILTIN_LAYOUTS) {
    manager.addDefinition(definition);
  }
}
