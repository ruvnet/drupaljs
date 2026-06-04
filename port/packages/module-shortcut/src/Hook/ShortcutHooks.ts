import type {
  AccountInterface,
  RenderArray,
  ShortcutModuleHandler,
} from '../contracts.js';
import { ACCESS_SHORTCUTS, SWITCH_SHORTCUT_SETS } from '../permissions.js';
import type { ShortcutSetStorageInterface } from '../ShortcutSetStorage.js';

/**
 * Collaborators injected into the shortcut hooks.
 *
 * In core these are resolved from the global container (`\Drupal::currentUser()`,
 * the `shortcut_set` storage, the module handler); here they are grouped so the
 * hooks are unit-testable.
 */
export interface ShortcutHooksDeps {
  currentUser: AccountInterface;
  moduleHandler: ShortcutModuleHandler;
  shortcutSetStorage: ShortcutSetStorageInterface;
}

/**
 * Hook implementations for the shortcut module.
 *
 * Ports `Drupal\shortcut\Hook\ShortcutHooks` (help, toolbar, user_delete). The
 * jsonapi/query-alter hooks depend on packages not yet ported and are omitted
 * from this slice. String translation is rendered as plain text (no `t()`
 * runtime yet).
 */
export class ShortcutHooks {
  constructor(private readonly deps: ShortcutHooksDeps) {}

  /** Implements hook_help(). */
  help(routeName: string): string | null {
    switch (routeName) {
      case 'help.page.shortcut': {
        let output = '<h2>About</h2>';
        output +=
          '<p>The Shortcut module allows users to create sets of <em>shortcut</em> ' +
          'links to commonly-visited pages of the site. Shortcuts are contained ' +
          'within <em>sets</em>. Each user with <em>Select any shortcut set</em> ' +
          'permission can select a shortcut set created by anyone at the site.</p>';
        output += '<h2>Uses</h2>';
        output += '<dl><dt>Administering shortcuts</dt>';
        output +=
          '<dd>Users with the <em>Administer shortcuts</em> permission can manage ' +
          'shortcut sets and edit the shortcuts within sets.</dd>';
        output += '<dt>Choosing shortcut sets</dt>';
        output +=
          '<dd>Users with permission to switch shortcut sets can choose a shortcut ' +
          'set to use from the Shortcuts tab of their user account page.</dd>';
        output += '</dl>';
        return output;
      }

      case 'entity.shortcut_set.collection':
      case 'shortcut.set_add':
      case 'entity.shortcut_set.edit_form': {
        const user = this.deps.currentUser;
        if (
          user.hasPermission(ACCESS_SHORTCUTS) &&
          user.hasPermission(SWITCH_SHORTCUT_SETS)
        ) {
          return (
            '<p>Define which shortcut set you are using on the Shortcuts tab of ' +
            'your account page.</p>'
          );
        }
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Implements hook_toolbar(). Returns the shortcuts toolbar item for users with
   * `access shortcuts`, else just the cache-context shell.
   */
  toolbar(): Record<string, RenderArray> {
    const user = this.deps.currentUser;
    const items: Record<string, RenderArray> = {};
    items['shortcuts'] = { '#cache': { contexts: ['user.permissions'] } };

    if (user.hasPermission(ACCESS_SHORTCUTS)) {
      const shortcutSet = this.deps.shortcutSetStorage.getDisplayedToUser(user);
      items['shortcuts'] = {
        ...items['shortcuts'],
        '#type': 'toolbar_item',
        tab: {
          '#type': 'link',
          '#title': 'Shortcuts',
          '#url': { route: 'entity.shortcut_set.collection', parameters: { shortcut_set: shortcutSet.id() } },
          '#attributes': {
            title: 'Shortcuts',
            class: ['toolbar-icon', 'toolbar-icon-shortcut'],
          },
        },
        tray: {
          '#heading': 'User-defined shortcuts',
        },
        '#weight': -10,
        '#attached': {
          library: ['shortcut/drupal.shortcut'],
        },
      };
    }
    return items;
  }

  /**
   * Implements hook_ENTITY_TYPE_delete() for user: clean up the deleted user's
   * shortcut-set assignment.
   */
  userDelete(account: AccountInterface): void {
    this.deps.shortcutSetStorage.unassignUser(account);
  }
}
