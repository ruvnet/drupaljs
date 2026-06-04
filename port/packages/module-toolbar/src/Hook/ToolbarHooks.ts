import type { AccountInterface, RenderArray, ToolbarModuleHandler } from '../contracts.js';

/**
 * Collaborators injected into the toolbar hooks.
 *
 * In core these are constructor-injected services (`ModuleHandlerInterface`,
 * `AccountInterface`) plus the procedural `_toolbar_get_subtrees_hash()` helper;
 * here they are grouped so the hooks are unit-testable.
 */
export interface ToolbarHooksDeps {
  currentUser: AccountInterface;
  moduleHandler: ToolbarModuleHandler;
  /** Returns the current rendered-subtrees hash (`_toolbar_get_subtrees_hash`). */
  getSubtreesHash: () => string;
}

const ACCESS_TOOLBAR = 'access toolbar';
const ACCESS_NAVIGATION = 'access navigation';

/**
 * Hook implementations for the toolbar module.
 *
 * Ports `Drupal\toolbar\Hook\ToolbarHooks` (help, page_top, toolbar). String
 * translation is rendered as plain text in this slice (no `t()` runtime yet).
 */
export class ToolbarHooks {
  constructor(private readonly deps: ToolbarHooksDeps) {}

  /**
   * Implements hook_help(). Returns help markup for `help.page.toolbar`, else
   * null.
   */
  help(routeName: string): string | null {
    if (routeName === 'help.page.toolbar') {
      let output = '';
      output += '<h2>About</h2>';
      output +=
        '<p>The Toolbar module provides a toolbar for site administrators, ' +
        'which displays tabs and trays provided by the Toolbar module itself ' +
        'and other modules.</p>';
      output += '<h4>Terminology</h4>';
      output += '<dl>';
      output += '<dt>Tabs</dt>';
      output +=
        '<dd>Tabs are buttons, displayed in a bar across the top of the screen. ' +
        'Some tabs execute an action, while other tabs toggle which tray is open.</dd>';
      output += '<dt>Trays</dt>';
      output +=
        '<dd>Trays are usually lists of links, which can be hierarchical like a ' +
        'menu. Only one tray may be open at a time.</dd>';
      output += '</dl>';
      return output;
    }
    return null;
  }

  /**
   * Implements hook_page_top(). Adds the admin toolbar to the top of the page,
   * unless the navigation module is enabled and the user can access it.
   * Mutates `pageTop` by reference.
   */
  pageTop(pageTop: RenderArray): void {
    if (
      this.deps.currentUser.hasPermission(ACCESS_NAVIGATION) &&
      this.deps.moduleHandler.moduleExists('navigation')
    ) {
      return;
    }
    pageTop['toolbar'] = {
      '#type': 'toolbar',
      '#access': this.deps.currentUser.hasPermission(ACCESS_TOOLBAR),
      '#cache': {
        keys: ['toolbar'],
        contexts: ['user.permissions'],
      },
    };
  }

  /**
   * Implements hook_toolbar(). Provides the 'Home' (Back to site) tab and the
   * 'Administration' tab + tray. The administration tray carries the subtrees
   * hash in `drupalSettings` so the client can fetch deferred subtrees.
   */
  toolbar(): Record<string, RenderArray> {
    const items: Record<string, RenderArray> = {};

    // The 'Home' tab is a simple link, with no corresponding tray.
    items['home'] = {
      '#type': 'toolbar_item',
      tab: {
        '#type': 'link',
        '#title': 'Back to site',
        '#url': { route: '<front>' },
        '#attributes': {
          title: 'Return to site content',
          class: ['toolbar-icon', 'toolbar-icon-escape-admin'],
          'data-toolbar-escape-admin': true,
        },
      },
      '#wrapper_attributes': {
        class: ['home-toolbar-tab'],
      },
      '#attached': {
        library: ['toolbar/toolbar.escapeAdmin'],
      },
      '#weight': -20,
    };

    // Only top-level links are inlined; subtrees are fetched via the
    // toolbar.subtrees route using this hash.
    const hash = this.deps.getSubtreesHash();
    items['administration'] = {
      '#type': 'toolbar_item',
      tab: {
        '#type': 'link',
        '#title': 'Manage',
        '#url': { route: 'system.admin' },
        '#attributes': {
          title: 'Admin menu',
          class: ['toolbar-icon', 'toolbar-icon-menu'],
          // Presence (not value) defers loading the admin subtrees.
          'data-drupal-subtrees': '',
        },
      },
      tray: {
        '#heading': 'Administration menu',
        '#attached': {
          drupalSettings: {
            toolbar: { subtreesHash: hash },
          },
        },
        toolbar_administration: {
          '#type': 'container',
          '#attributes': {
            class: ['toolbar-menu-administration'],
          },
        },
      },
      '#weight': -15,
    };

    return items;
  }
}
