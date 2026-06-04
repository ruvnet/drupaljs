import { SetSubtreesCommand } from '../Ajax/SetSubtreesCommand.js';
import {
  accessAllowedIf,
  type AccessResult,
  type AccountInterface,
  type RenderArray,
} from '../contracts.js';

/**
 * Minimal menu-tree contract the administration tray needs. Mirrors the subset
 * of `Drupal\Core\Menu\MenuLinkTreeInterface` the controller calls.
 *
 * TODO(@drupaljs/menu): replace with the shared MenuLinkTree service.
 */
export interface MenuTreeLike {
  load(menuName: string, parameters: MenuTreeParameters): unknown[];
  transform(tree: unknown[], manipulators: unknown[]): unknown[];
  build(tree: unknown[]): RenderArray;
}

/** Ports the fields of `Drupal\Core\Menu\MenuTreeParameters` the toolbar sets. */
export interface MenuTreeParameters {
  minDepth: number;
  maxDepth: number;
  onlyEnabledLinks: boolean;
}

/** The AJAX response shape returned by {@link ToolbarController.subtreesAjax}. */
export interface ToolbarAjaxResponse {
  commands: SetSubtreesCommand[];
  private: boolean;
  maxAge: number;
  /** Absolute expiry timestamp (seconds). */
  expires: number;
}

/**
 * Collaborators injected into the controller.
 *
 * In core these come from the service container and the procedural
 * `toolbar_get_rendered_subtrees()` / `_toolbar_get_subtrees_hash()` helpers
 * defined in `toolbar.module`; here they are passed in so the controller is
 * unit-testable in isolation.
 */
export interface ToolbarControllerDeps {
  currentUser: AccountInterface;
  /** Returns the current hash of the rendered subtrees (`_toolbar_get_subtrees_hash`). */
  getSubtreesHash: () => string;
  /** Returns the rendered subtrees map (`toolbar_get_rendered_subtrees`). */
  getRenderedSubtrees?: () => Record<string, unknown>;
  /** Current request time in seconds (ports TimeInterface::getRequestTime). */
  getRequestTime?: () => number;
  /** The toolbar.menu_tree service. */
  menuTree?: MenuTreeLike;
}

/** One year, in seconds — the toolbar subtree response max-age. */
const SUBTREES_MAX_AGE = 365 * 24 * 60 * 60;

/** Permission gating subtree access. */
const ACCESS_TOOLBAR = 'access toolbar';

/**
 * Controller for the toolbar module.
 *
 * Ports `Drupal\toolbar\Controller\ToolbarController`.
 */
export class ToolbarController {
  constructor(private readonly deps: ToolbarControllerDeps) {}

  /**
   * Checks access for the subtree controller (`checkSubTreeAccess`).
   *
   * Allowed only when the current user has `access toolbar` AND the supplied
   * hash equals the expected subtrees hash.
   */
  checkSubTreeAccess(hash: string): AccessResult {
    const expected = this.deps.getSubtreesHash();
    const allowed = this.deps.currentUser.hasPermission(ACCESS_TOOLBAR) && timingSafeEqual(expected, hash);
    return accessAllowedIf(allowed);
  }

  /**
   * Returns an AJAX response rendering the toolbar subtrees (`subtreesAjax`).
   *
   * The response is private with a one-year max-age and a matching Expires
   * timestamp — the heart of the client-side HTTP caching.
   */
  subtreesAjax(): ToolbarAjaxResponse {
    const subtrees = this.deps.getRenderedSubtrees?.() ?? {};
    const requestTime = this.deps.getRequestTime?.() ?? 0;
    return {
      commands: [new SetSubtreesCommand(subtrees)],
      private: true,
      maxAge: SUBTREES_MAX_AGE,
      expires: requestTime + SUBTREES_MAX_AGE,
    };
  }

  /**
   * Pre-render: renders the toolbar's administration tray
   * (`preRenderAdministrationTray`).
   *
   * Loads the admin menu starting/ending at the second level (the children of
   * the top-level "Administration" link), applies the standard manipulators
   * plus `toolbar_menu_navigation_links`, and builds it into the element.
   */
  preRenderAdministrationTray(element: RenderArray): RenderArray {
    const menuTree = this.deps.menuTree;
    if (menuTree === undefined) {
      // No menu service wired in this slice; nothing to build.
      return element;
    }
    const parameters: MenuTreeParameters = { minDepth: 2, maxDepth: 2, onlyEnabledLinks: true };
    let tree = menuTree.load('admin', parameters);
    tree = menuTree.transform(tree, [
      { callable: 'menu.default_tree_manipulators:checkAccess' },
      { callable: 'menu.default_tree_manipulators:generateIndexAndSort' },
      { callable: 'toolbar_menu_navigation_links' },
    ]);
    element['administration_menu'] = menuTree.build(tree);
    return element;
  }
}

/**
 * Constant-time string comparison, ports PHP's `hash_equals()` used in the
 * access check to avoid leaking the expected hash via timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
