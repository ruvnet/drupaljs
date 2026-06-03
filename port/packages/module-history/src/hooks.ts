/**
 * History module hook implementations, registered through `@drupaljs/hook`.
 *
 * Ports `Drupal\history\Hook\HistoryHooks`. In Drupal these are
 * `#[Hook(...)]`-attributed methods discovered by scanning; here they are
 * registered explicitly via ModuleHandler::implement() — the TS-idiomatic
 * equivalent (see @drupaljs/hook's module docblock).
 *
 * Ported (self-contained) hooks: help, cron, node_view_alter, node_delete,
 * user_cancel, user_delete, comment_view. Render/library wiring is reduced to
 * the data each hook would attach (so it is testable without a render layer).
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type {
  HistoryStorage,
  HistoryAccount,
  HistoryRepository,
} from './history-repository.js';

/** The module machine name. */
export const MODULE_NAME = 'history';

/** Method used by hook_user_cancel that triggers history deletion. */
export const USER_CANCEL_REASSIGN = 'user_cancel_reassign';

/**
 * Minimal node view "build" array. Ports the slice of the render array that
 * HistoryHooks::nodeViewAlter() mutates.
 */
export interface NodeViewBuild {
  attributes?: Record<string, unknown>;
  cache?: { contexts?: string[] };
  attached?: { library?: string[]; drupalSettings?: Record<string, unknown> };
}

/** Node slice used by node hooks. */
export interface NodeLike {
  id(): number;
  isNew(): boolean;
  inPreview?: boolean;
}

/** Entity-view display slice used by node_view_alter. */
export interface ViewDisplay {
  /** The display mode, e.g. "full" / "teaser". */
  getOriginalMode(): string;
}

/**
 * Ports HistoryHooks::help(). Returns the history module's help-page text, or
 * null for other routes. (Markup simplified; informational content matches.)
 */
export function historyHelp(routeName: string): string | null {
  if (routeName === 'help.page.history') {
    return (
      'The History module keeps track of which content a user has read. It marks ' +
      'content as new or updated depending on the last time the user viewed it. ' +
      'History records older than one month are removed during cron, so content ' +
      'older than one month is always considered read. The History module has no ' +
      'user interface but provides a filter to Views to show new or updated content.'
    );
  }
  return null;
}

/**
 * Ports HistoryHooks::cron(): deletes history rows older than the read limit
 * (30 days ago).
 */
export function historyCron(storage: HistoryStorage, repository: HistoryRepository): void {
  storage.deleteOlderThan(repository.readLimit());
}

/**
 * Ports HistoryHooks::nodeViewAlter(). Mutates the build array in place:
 * - tags the node with `data-history-node-id` when comment is installed;
 * - on the "full" display for authenticated users, attaches the mark-as-read
 *   library + the `nodesToMarkAsRead` setting and a roles cache context.
 */
export function historyNodeViewAlter(
  build: NodeViewBuild,
  node: NodeLike,
  display: ViewDisplay,
  currentUser: HistoryAccount,
  commentInstalled: boolean,
): void {
  if (commentInstalled) {
    build.attributes ??= {};
    build.attributes['data-history-node-id'] = node.id();
  }

  if (node.isNew() || node.inPreview) {
    return;
  }

  if (display.getOriginalMode() === 'full') {
    build.cache ??= {};
    build.cache.contexts ??= [];
    build.cache.contexts.push('user.roles:authenticated');

    if (currentUser.isAuthenticated()) {
      build.attached ??= {};
      build.attached.library ??= [];
      build.attached.library.push('history/mark-as-read');
      build.attached.drupalSettings ??= {};
      const history = (build.attached.drupalSettings['history'] ??= {}) as Record<
        string,
        unknown
      >;
      const toMark = (history['nodesToMarkAsRead'] ??= {}) as Record<number, boolean>;
      toMark[node.id()] = true;
    }
  }
}

/** Ports HistoryHooks::nodeDelete(): removes all history rows for the node. */
export function historyNodeDelete(storage: HistoryStorage, node: NodeLike): void {
  storage.deleteByNid(node.id());
}

/**
 * Ports HistoryHooks::userCancel(): on the "reassign" method, removes all
 * history rows for the cancelled user.
 */
export function historyUserCancel(
  storage: HistoryStorage,
  uid: number,
  method: string,
): void {
  if (method === USER_CANCEL_REASSIGN) {
    storage.deleteByUid(uid);
  }
}

/** Ports HistoryHooks::userDelete(): removes all history rows for the user. */
export function historyUserDelete(storage: HistoryStorage, uid: number): void {
  storage.deleteByUid(uid);
}

/**
 * Registers the history module's hook implementations on a ModuleHandler.
 *
 * Collaborators (storage, current user, repository, and a comment-installed
 * probe) are supplied here so the registered callbacks are closures over the
 * wired services — mirroring Drupal's constructor-injected hook object.
 */
export function registerHistoryHooks(
  moduleHandler: ModuleHandlerInterface,
  deps: {
    storage: HistoryStorage;
    repository: HistoryRepository;
    currentUser: HistoryAccount;
    commentInstalled: () => boolean;
  },
): void {
  const { storage, repository, currentUser, commentInstalled } = deps;

  moduleHandler.implement(MODULE_NAME, 'help', (routeName: string) => historyHelp(routeName));
  moduleHandler.implement(MODULE_NAME, 'cron', () => historyCron(storage, repository));
  moduleHandler.implement(
    MODULE_NAME,
    'node_view_alter',
    (build: NodeViewBuild, node: NodeLike, display: ViewDisplay) =>
      historyNodeViewAlter(build, node, display, currentUser, commentInstalled()),
  );
  moduleHandler.implement(MODULE_NAME, 'node_delete', (node: NodeLike) =>
    historyNodeDelete(storage, node),
  );
  moduleHandler.implement(MODULE_NAME, 'user_cancel', (uid: number, method: string) =>
    historyUserCancel(storage, uid, method),
  );
  moduleHandler.implement(MODULE_NAME, 'user_delete', (uid: number) =>
    historyUserDelete(storage, uid),
  );
}
