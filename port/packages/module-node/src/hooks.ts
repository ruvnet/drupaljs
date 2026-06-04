/**
 * Node module hook implementations and their registration against the
 * `@drupaljs/hook` ModuleHandler.
 *
 * Ports the node-access-relevant hooks documented in node.api.php / the Hook/*
 * classes: `hook_node_access` and `hook_node_grants`. In Drupal these are
 * discovered via the `#[Hook]` attribute; per @drupaljs/hook's design they are
 * registered explicitly through `ModuleHandler.implement()`.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { AccessVerdict, AccountInterface } from './contracts.js';
import type { NodeInterface } from './entity/node.js';

/**
 * Implements hook_node_access() for the node module.
 *
 * Returns a verdict mirroring `Drupal\Core\Access\AccessResult`: the node module
 * grants the owner of an unpublished node the ability to view it when they hold
 * the 'view own unpublished content' permission. All other cases are neutral
 * (deferring to grants / other modules). Anonymous users never qualify, for
 * security.
 */
export function nodeNodeAccess(
  node: NodeInterface,
  operation: string,
  account: AccountInterface,
): AccessVerdict {
  if (operation !== 'view') {
    return 'neutral';
  }
  if (node.isPublished()) {
    return 'neutral';
  }
  if (!account.hasPermission('view own unpublished content')) {
    return 'neutral';
  }
  if (!account.isAuthenticated()) {
    return 'neutral';
  }
  if (account.id() !== node.getOwnerId()) {
    return 'neutral';
  }
  return 'allowed';
}

/**
 * Implements hook_node_grants(). Ports the default node grant: every account is
 * a member of gid 0 in the 'all' realm for the 'view' operation.
 */
export function nodeNodeGrants(
  _account: AccountInterface,
  operation: string,
): Record<string, number[]> {
  if (operation === 'view') {
    return { all: [0] };
  }
  return {};
}

/**
 * Registers the node module's hook implementations on a ModuleHandler. Mirrors
 * what hook discovery would do at module-install time.
 */
export function registerNodeHooks(moduleHandler: ModuleHandlerInterface): void {
  moduleHandler.implement('node', 'node_access', (...args: unknown[]) =>
    nodeNodeAccess(
      args[0] as NodeInterface,
      args[1] as string,
      args[2] as AccountInterface,
    ),
  );
  moduleHandler.implement('node', 'node_grants', (...args: unknown[]) =>
    nodeNodeGrants(args[0] as AccountInterface, args[1] as string),
  );
}
