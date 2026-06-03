/**
 * `@drupaljs/module-book` — public API barrel.
 *
 * TypeScript port of Drupal core's `book` module (originally
 * core/modules/book; now a contrib-bound module, ported here from its known
 * core structure). Provides the book-outline manager, outline storage, hook
 * implementations (registered via `@drupaljs/hook`), access checks, routes and
 * permissions for organising nodes into a navigable, multi-page hierarchy.
 *
 * This is a faithful but minimal vertical slice. Deep collaborators (node entity
 * loading, SQL storage, render arrays, forms) are modelled as local contracts in
 * `./types` with TODO markers until the corresponding `@drupaljs/*` packages
 * land. The nested-set tree algorithms are the module's true core and are ported
 * directly here (candidate for a Rust/WASM crate per ADR-0015 if profiling warrants).
 */

// Book manager (nested-set outline algorithms)
export { BookManager } from './book-manager.js';
export type { BookTreeNode, ParentDepthInput } from './book-manager.js';

// Outline storage
export { InMemoryBookOutlineStorage } from './book-outline-storage.js';

// Hooks
export { BookHooks, registerBookHooks, MODULE_NAME } from './hooks.js';

// Access control
export { BookAccess } from './access.js';
export type { AccessVerdict } from './access.js';

// Routes & permissions
export { bookRoutes } from './routing.js';
export type { RouteDefinition } from './routing.js';
export { bookPermissions } from './permissions.js';
export type { PermissionDefinition, PermissionMap } from './permissions.js';

// Shared contracts
export { BOOK_MAX_DEPTH } from './types.js';
export type {
  BookLink,
  BookNode,
  BookOutlineStorageInterface,
  NodeStorageInterface,
  EntityTypeManagerInterface,
  AccountInterface,
} from './types.js';
