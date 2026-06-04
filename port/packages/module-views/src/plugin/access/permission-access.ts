import { AccessResult } from '../../contracts.js';
import type { AccountInterface } from '../../contracts.js';

/**
 * The "Permission" access plugin for a view display.
 *
 * Ports `Drupal\views\Plugin\views\access\Permission`: a display is accessible
 * when the account holds a single configured permission (default
 * `access content`). The "Role" and "None" access plugins are deferred.
 */
export class PermissionAccess {
  /** The required permission (ports `$this->options['perm']`). */
  readonly perm: string;

  constructor(options: { perm?: string } = {}) {
    this.perm = options.perm ?? 'access content';
  }

  /** Ports access(): allowed if the account has the permission, else neutral. */
  access(account: AccountInterface): AccessResult {
    return AccessResult.allowedIfHasPermission(account, this.perm);
  }
}
