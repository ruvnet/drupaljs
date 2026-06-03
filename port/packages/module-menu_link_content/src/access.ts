/**
 * Access control handler for the `menu_link_content` entity type.
 *
 * Ports `Drupal\menu_link_content\MenuLinkContentAccessControlHandler`. The
 * cacheability metadata of `AccessResult` is reduced here to a plain verdict
 * (`allowed` / `forbidden` / `neutral`); the verdict logic is preserved exactly.
 */

import type { MenuLinkContent } from './entity.js';
import type { AccessManagerInterface, AccessVerdict, AccountInterface } from './types.js';

export type MenuLinkContentOperation = 'view' | 'update' | 'delete' | string;

export class MenuLinkContentAccessControlHandler {
  constructor(private readonly accessManager: AccessManagerInterface) {}

  /** Ports `checkAccess()`. */
  checkAccess(
    entity: MenuLinkContent,
    operation: MenuLinkContentOperation,
    account: AccountInterface,
  ): AccessVerdict {
    switch (operation) {
      case 'view':
        // No direct viewing, but content_translation needs a generic check.
        return account.hasPermission('administer menu') ? 'allowed' : 'neutral';

      case 'update': {
        if (!account.hasPermission('administer menu')) {
          return 'neutral';
        }
        // If the link is routed, also require route access unless the account
        // holds the "link to any page" permission.
        if (!account.hasPermission('link to any page')) {
          let routed = false;
          let routeName = '';
          try {
            const url = entity.getUrlObject();
            // In this slice an internal: URI stands in for a routed link.
            routed = !url.isExternal();
            routeName = url.getUri();
          } catch {
            routed = false;
          }
          if (routed) {
            const ok = this.accessManager.checkNamedRoute(routeName, {}, account);
            return ok ? 'allowed' : 'forbidden';
          }
        }
        return 'allowed';
      }

      case 'delete':
        if (!account.hasPermission('administer menu')) {
          return 'neutral';
        }
        return entity.isNew() ? 'forbidden' : 'allowed';

      default:
        return 'neutral';
    }
  }
}
