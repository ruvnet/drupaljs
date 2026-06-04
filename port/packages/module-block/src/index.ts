/**
 * @drupaljs/module-block — TypeScript port of Drupal core's `block` module.
 *
 * A faithful, minimal vertical slice of `core/modules/block`:
 *  - the `block` config entity ({@link Block} / {@link BlockInterface}) with
 *    plugin access, label resolution, region/weight, duplication and the
 *    `Block::sort` comparator ({@link sortBlocks});
 *  - the block plugin contracts and the lazy {@link BlockPluginCollection};
 *  - the `block.repository` service ({@link BlockRepository}) exposing
 *    `getVisibleBlocksPerRegion` and `getUniqueMachineName`;
 *  - the module descriptor, permissions and routes, plus
 *    {@link installBlockModule} which registers the `#[Hook]` implementations of
 *    `Drupal\block\Hook\BlockHooks` through `@drupaljs/hook`.
 *
 * Deep collaborators (entity storage, theme manager, plugin manager, messenger)
 * are modelled as minimal injected interfaces with TODO markers pointing at the
 * shared packages that will replace them.
 */

// Entity
export {
  Block,
  sortBlocks,
  type BlockInterface,
  type BlockConfig,
  type VisibilityConfig,
} from './entity/block.js';

// Plugin contracts
export {
  BlockPluginCollection,
  type BlockPlugin,
  type BlockPluginManager,
  type BlockPluginDefinition,
  type BlockPluginConfiguration,
} from './plugin/block-plugin.js';

// Repository service
export {
  BlockRepository,
  type BlockStorage,
  type ThemeManager,
  type ActiveTheme,
  type RegionAssignments,
} from './repository/block-repository.js';

// Module: definition, permissions, routes, hook wiring
export {
  blockModule,
  blockPermissions,
  blockRoutes,
  installBlockModule,
  BLOCK_LIST_CACHE_TAG,
  type RouteDefinition,
  type BlockHookServices,
} from './module.js';
