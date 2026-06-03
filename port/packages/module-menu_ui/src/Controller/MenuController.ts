import { HTML_TAG_LIST } from '../contracts.js';
import type {
  MenuParentFormSelectorInterface,
  MenuInterface,
  ParentSelectOptions,
  RenderArray,
} from '../contracts.js';

/**
 * Returns responses for Menu routes.
 *
 * Ports `Drupal\menu_ui\Controller\MenuController`. The PHP version reads the
 * requested menus from the HTTP request; here the already-decoded list of menu
 * machine names is passed in, keeping the controller transport-agnostic.
 */
export class MenuController {
  constructor(private readonly menuParentSelector: MenuParentFormSelectorInterface) {}

  /**
   * Gets all the available menus and menu items as a select-options map.
   *
   * @param menus The requested menu machine names (decoded from the request).
   * @returns The available menu and menu items as `{ optionId: label }`.
   */
  getParentOptions(menus: readonly string[]): ParentSelectOptions {
    const availableMenus: Record<string, string> = {};
    for (const menu of menus) {
      availableMenus[menu] = menu;
    }
    return this.menuParentSelector.getParentSelectOptions('', availableMenus);
  }

  /**
   * Route title callback: renders the menu label.
   */
  menuTitle(menu: MenuInterface): RenderArray {
    return { '#markup': menu.label(), '#allowed_tags': HTML_TAG_LIST };
  }
}
