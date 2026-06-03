/**
 * Port of `Drupal\node\NodeAccessControlHandler`.
 *
 * Faithful to the original control flow for the operations exercised by a
 * minimal slice: `access`, `createAccess`, `checkAccess` (view branch),
 * `checkFieldAccess`, and `acquireGrants`. Cacheability metadata is intentionally
 * dropped (no render cache in this slice). The node-grants database storage and
 * the full revision-operation matrix are stubbed with the documented defaults.
 *
 * TODO(@drupaljs/access): swap the local AccessResult for the shared port.
 * TODO(node.grant_storage): wire real NodeGrantDatabaseStorage when ported; the
 * default-grant behaviour here mirrors `acquireGrants()` fallback only.
 */

import { AccessResult, type AccountInterface } from '../contracts.js';
import type { NodeInterface } from '../entity/node.js';

/** A node access grant record, as produced by hook_node_access_records(). */
export interface NodeAccessGrant {
  realm: string;
  gid: number;
  grant_view: 0 | 1;
  grant_update: 0 | 1;
  grant_delete: 0 | 1;
}

/**
 * Revision operations and the (permission-operation, entity-operation) pair they
 * map to. Ports NodeAccessControlHandler::REVISION_OPERATION_MAP.
 */
const REVISION_OPERATION_MAP: Record<string, [string, string] | undefined> = {
  'view all revisions': ['view', 'view'],
  'view revision': ['view', 'view'],
  'revert revision': ['revert', 'update'],
  'delete revision': ['delete', 'delete'],
};

/** Fields only the 'administer nodes' permission may edit. */
const ADMINISTRATIVE_FIELDS = ['uid', 'created', 'promote', 'sticky'];

/** Fields no user may edit. */
const READ_ONLY_FIELDS = ['revision_timestamp', 'revision_uid'];

export class NodeAccessControlHandler {
  /**
   * Top-level access check. Ports NodeAccessControlHandler::access().
   */
  access(node: NodeInterface, operation: string, account: AccountInterface): AccessResult {
    // bypass node access wins, except for revision operations.
    if (account.hasPermission('bypass node access') && REVISION_OPERATION_MAP[operation] === undefined) {
      return AccessResult.allowed();
    }
    if (!account.hasPermission('access content')) {
      return AccessResult.forbidden();
    }
    return this.checkAccess(node, operation, account);
  }

  /**
   * Create access check. Ports NodeAccessControlHandler::createAccess().
   */
  createAccess(entityBundle: string | null, account: AccountInterface): AccessResult {
    if (account.hasPermission('bypass node access')) {
      return AccessResult.allowed();
    }
    if (!account.hasPermission('access content')) {
      return AccessResult.forbidden();
    }
    return this.checkCreateAccess(account, entityBundle);
  }

  /**
   * Per-operation access. Ports the view + grants branches of
   * NodeAccessControlHandler::checkAccess(). Revision operations beyond
   * 'view all revisions' delegate to entity-operation re-checks; the full matrix
   * is reduced to the documented permission gates.
   */
  protected checkAccess(node: NodeInterface, operation: string, account: AccountInterface): AccessResult {
    if (operation === 'view') {
      const result = this.checkViewAccess(node, account);
      if (result !== null) {
        return result;
      }
    }

    const revisionMapping = REVISION_OPERATION_MAP[operation];
    if (revisionMapping !== undefined) {
      const [revisionPermissionOperation] = revisionMapping;
      const bundle = node.bundle();
      const hasRevisionPermission =
        account.hasPermission(`${revisionPermissionOperation} all revisions`) ||
        account.hasPermission(`${revisionPermissionOperation} ${bundle} revisions`) ||
        account.hasPermission('administer nodes');
      if (!hasRevisionPermission) {
        return AccessResult.neutral();
      }
      if (operation === 'view all revisions') {
        return AccessResult.allowed();
      }
      // Default revision cannot be reverted/deleted as a revision.
      if (node.isDefaultRevision() && (operation === 'revert revision' || operation === 'delete revision')) {
        return AccessResult.forbidden();
      }
      if (account.hasPermission('administer nodes')) {
        return AccessResult.allowed();
      }
      return AccessResult.neutral();
    }

    // Non-revision, non-view: defer to node grants. With no grant storage wired,
    // mirror the published-node default (view-only) as a neutral baseline.
    return AccessResult.neutral();
  }

  /**
   * View-access logic. Ports NodeAccessControlHandler::checkViewAccess().
   * Returns null to signal "no opinion" (fall through to grants/default).
   */
  protected checkViewAccess(node: NodeInterface, account: AccountInterface): AccessResult | null {
    if (node.isPublished()) {
      // Published: defer to grants; with no storage wired the default grant
      // (all/view) applies, so allow.
      return AccessResult.allowed();
    }
    if (!account.hasPermission('view own unpublished content')) {
      return null;
    }
    // Security: never grant own-unpublished view to anonymous users.
    if (!account.isAuthenticated()) {
      return null;
    }
    if (account.id() !== node.getOwnerId()) {
      return null;
    }
    return AccessResult.allowed();
  }

  /**
   * Create-access logic. Ports NodeAccessControlHandler::checkCreateAccess().
   */
  protected checkCreateAccess(account: AccountInterface, entityBundle: string | null): AccessResult {
    return AccessResult.allowedIf(account.hasPermission(`create ${entityBundle} content`));
  }

  /**
   * Field-level edit access. Ports NodeAccessControlHandler::checkFieldAccess().
   */
  checkFieldAccess(operation: string, fieldName: string, account: AccountInterface): AccessResult {
    if (operation === 'edit' && fieldName === 'status') {
      return AccessResult.allowedIf(
        account.hasPermission('administer node published status') ||
          account.hasPermission('administer nodes'),
      );
    }
    if (operation === 'edit' && ADMINISTRATIVE_FIELDS.includes(fieldName)) {
      return AccessResult.allowedIf(account.hasPermission('administer nodes'));
    }
    if (operation === 'edit' && READ_ONLY_FIELDS.includes(fieldName)) {
      return AccessResult.forbidden();
    }
    // No opinion on other fields.
    return AccessResult.neutral();
  }

  /**
   * Computes the grant records for a node. Ports
   * NodeAccessControlHandler::acquireGrants(). Module-provided grants
   * (hook_node_access_records + alter) are accepted via `moduleGrants`; when none
   * are supplied and the node is published, the default all/view grant is used.
   */
  acquireGrants(node: NodeInterface, moduleGrants: NodeAccessGrant[] = []): NodeAccessGrant[] {
    const grants = [...moduleGrants];
    if (grants.length === 0 && node.isPublished()) {
      grants.push({ realm: 'all', gid: 0, grant_view: 1, grant_update: 0, grant_delete: 0 });
    }
    return grants;
  }
}
