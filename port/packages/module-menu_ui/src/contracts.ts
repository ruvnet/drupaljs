/**
 * Local minimal contracts for `@drupaljs/module-menu_ui`.
 *
 * These mirror the slices of Drupal core APIs that menu_ui depends on. Each is
 * a thin LOCAL definition because the upstream `@drupaljs/*` packages that will
 * own these types are still scaffolds (no `src/` yet). When they land, replace
 * these with imports.
 */

// ---------------------------------------------------------------------------
// Access (Drupal\Core\Access\AccessResult / AccessResultInterface)
// ---------------------------------------------------------------------------

/**
 * Minimal access-result contract.
 *
 * TODO(@drupaljs/access): replace with the shared AccessResultInterface once
 * the access package ships a `src/`.
 */
export interface AccessResultInterface {
  isAllowed(): boolean;
}

/**
 * Minimal AccessResult factory mirroring `Drupal\Core\Access\AccessResult`.
 *
 * TODO(@drupaljs/access): replace with the real AccessResult implementation.
 */
export const AccessResult = {
  allowed(): AccessResultInterface {
    return { isAllowed: () => true };
  },
  forbidden(): AccessResultInterface {
    return { isAllowed: () => false };
  },
};

// ---------------------------------------------------------------------------
// Menu link tree (Drupal\Core\Menu\MenuLinkTreeElement)
// ---------------------------------------------------------------------------

/**
 * A single element of a menu link tree.
 *
 * Ports the surface of `Drupal\Core\Menu\MenuLinkTreeElement` that
 * MenuUiMenuTreeManipulators touches: a mutable `access` result and a `subtree`
 * of child elements.
 *
 * TODO(@drupaljs/menu): replace with the shared MenuLinkTreeElement type.
 */
export interface MenuLinkTreeElement {
  /** Access result for this element; manipulators may overwrite it. */
  access: AccessResultInterface | null;
  /** Child elements (may be empty). */
  subtree: MenuLinkTreeElement[];
  /** The menu link plugin id, when known (unused by the manipulator). */
  link?: { getPluginId?: () => string } | undefined;
}

// ---------------------------------------------------------------------------
// Menu parent form selector (Drupal\Core\Menu\MenuParentFormSelectorInterface)
// ---------------------------------------------------------------------------

/**
 * Maps a menu-link plugin id (or '') to a human-readable indented label.
 * e.g. `{ "main:": "<Main navigation>", "main:menu_link_content:uuid": "-- Home" }`.
 */
export type ParentSelectOptions = Record<string, string>;

/**
 * Minimal menu-parent selector contract used by {@link MenuController}.
 *
 * TODO(@drupaljs/menu): replace with the shared MenuParentFormSelectorInterface.
 */
export interface MenuParentFormSelectorInterface {
  /**
   * Returns parent-select options.
   *
   * @param id The id of the link to exclude (its own subtree cannot be a parent).
   * @param menus A map of allowed menu name -> menu title to restrict options.
   */
  getParentSelectOptions(id: string, menus?: Record<string, string>): ParentSelectOptions;
}

// ---------------------------------------------------------------------------
// Menu entity (Drupal\system\MenuInterface, a config entity)
// ---------------------------------------------------------------------------

/**
 * Minimal config-entity contract for a menu.
 *
 * TODO(@drupaljs/system): replace with the shared MenuInterface.
 */
export interface MenuInterface {
  id(): string;
  label(): string;
}

// ---------------------------------------------------------------------------
// Xss (Drupal\Component\Utility\Xss)
// ---------------------------------------------------------------------------

/**
 * The default list of HTML tags allowed by `Xss::getHtmlTagList()`. Mirrors the
 * tags Drupal permits in admin labels.
 *
 * TODO(@drupaljs/filter): replace with Xss.getHtmlTagList() once the filter
 * package ships its Xss port.
 */
export const HTML_TAG_LIST: readonly string[] = [
  'a',
  'em',
  'strong',
  'cite',
  'blockquote',
  'code',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
];

// ---------------------------------------------------------------------------
// Render array (Drupal render API)
// ---------------------------------------------------------------------------

/** A minimal Drupal render array. */
export interface RenderArray {
  '#markup'?: string;
  '#allowed_tags'?: readonly string[];
  [key: string]: unknown;
}
