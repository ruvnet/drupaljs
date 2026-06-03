import { AccessResult } from '../contracts.js';
import type { MenuLinkTreeElement } from '../contracts.js';

/**
 * Provides menu tree manipulators used when managing menu links.
 *
 * Ports `Drupal\menu_ui\Menu\MenuUiMenuTreeManipulators`.
 */
export class MenuUiMenuTreeManipulators {
  /**
   * Grants access to a menu tree when used in the menu management form.
   *
   * This manipulator allows access to menu links with inaccessible routes (e.g.
   * a `user.login` link for an authenticated user, or a link to a not-yet-built
   * Views page). It recurses through the entire tree, overwriting each
   * element's access result with {@link AccessResult.allowed}.
   *
   * @internal Intended only for the menu management form, where the permission
   * to administer links has already been checked.
   */
  checkAccess(tree: MenuLinkTreeElement[]): MenuLinkTreeElement[] {
    for (const element of tree) {
      element.access = AccessResult.allowed();
      if (element.subtree.length > 0) {
        element.subtree = this.checkAccess(element.subtree);
      }
    }
    return tree;
  }
}
