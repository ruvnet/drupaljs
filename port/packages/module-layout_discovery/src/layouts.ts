/**
 * Core layout definitions — TypeScript port of
 * `core/modules/layout_discovery/layout_discovery.layouts.yml`.
 *
 * In Drupal these layouts are discovered from the `*.layouts.yml` file by the
 * YamlDiscoveryDecorator. This port has no YAML scanning, so the five core
 * layouts are declared as data here (the TS-idiomatic equivalent of discovery)
 * and registered with the {@link LayoutPluginManager} explicitly.
 *
 * Values are faithful to the YAML: label, path, template, library, category,
 * default_region, icon_map, and regions (with their labels).
 */
import type { LayoutDefinitionValues } from './layout-definition.js';

/** The provider (module machine name) for these core layouts. */
export const LAYOUT_DISCOVERY_PROVIDER = 'layout_discovery';

/**
 * Raw layout definitions keyed by plugin id, mirroring the YAML one-for-one.
 * `provider` is added (the YAML's implicit provider is the declaring module).
 */
export const coreLayoutDefinitions: Readonly<Record<string, LayoutDefinitionValues>> = {
  layout_onecol: {
    id: 'layout_onecol',
    label: 'One column',
    path: 'layouts/onecol',
    template: 'layout--onecol',
    library: 'layout_discovery/onecol',
    category: 'Columns: 1',
    default_region: 'content',
    icon_map: [['content']],
    regions: {
      content: { label: 'Content' },
    },
    provider: LAYOUT_DISCOVERY_PROVIDER,
  },
  layout_twocol: {
    id: 'layout_twocol',
    label: 'Two column',
    path: 'layouts/twocol',
    template: 'layout--twocol',
    library: 'layout_discovery/twocol',
    category: 'Columns: 2',
    default_region: 'first',
    icon_map: [['top'], ['first', 'second'], ['bottom']],
    regions: {
      top: { label: 'Top' },
      first: { label: 'First' },
      second: { label: 'Second' },
      bottom: { label: 'Bottom' },
    },
    provider: LAYOUT_DISCOVERY_PROVIDER,
  },
  layout_twocol_bricks: {
    id: 'layout_twocol_bricks',
    label: 'Two column bricks',
    path: 'layouts/twocol_bricks',
    template: 'layout--twocol-bricks',
    library: 'layout_discovery/twocol_bricks',
    category: 'Columns: 2',
    default_region: 'middle',
    icon_map: [
      ['top'],
      ['first_above', 'second_above'],
      ['middle'],
      ['first_below', 'second_below'],
      ['bottom'],
    ],
    regions: {
      top: { label: 'Top' },
      first_above: { label: 'First above' },
      second_above: { label: 'Second above' },
      middle: { label: 'Middle' },
      first_below: { label: 'First below' },
      second_below: { label: 'Second below' },
      bottom: { label: 'Bottom' },
    },
    provider: LAYOUT_DISCOVERY_PROVIDER,
  },
  layout_threecol_25_50_25: {
    id: 'layout_threecol_25_50_25',
    label: 'Three column 25/50/25',
    path: 'layouts/threecol_25_50_25',
    template: 'layout--threecol-25-50-25',
    library: 'layout_discovery/threecol_25_50_25',
    category: 'Columns: 3',
    default_region: 'second',
    icon_map: [['top'], ['first', 'second', 'second', 'third'], ['bottom']],
    regions: {
      top: { label: 'Top' },
      first: { label: 'First' },
      second: { label: 'Second' },
      third: { label: 'Third' },
      bottom: { label: 'Bottom' },
    },
    provider: LAYOUT_DISCOVERY_PROVIDER,
  },
  layout_threecol_33_34_33: {
    id: 'layout_threecol_33_34_33',
    label: 'Three column 33/34/33',
    path: 'layouts/threecol_33_34_33',
    template: 'layout--threecol-33-34-33',
    library: 'layout_discovery/threecol_33_34_33',
    category: 'Columns: 3',
    default_region: 'first',
    icon_map: [['top'], ['first', 'second', 'third'], ['bottom']],
    regions: {
      top: { label: 'Top' },
      first: { label: 'First' },
      second: { label: 'Second' },
      third: { label: 'Third' },
      bottom: { label: 'Bottom' },
    },
    provider: LAYOUT_DISCOVERY_PROVIDER,
  },
};
