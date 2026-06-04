/**
 * Hook implementations for the `book` module.
 *
 * Ports the procedural hooks from `book.module` (Drupal 11 moved these onto a
 * `Drupal\book\Hook\BookHooks` class with `#[Hook]` attributes). In the TS port
 * hooks are registered explicitly against a `ModuleHandler` (see
 * `@drupaljs/hook`) by {@link registerBookHooks}.
 *
 * Covered hooks:
 *  - hook_help()
 *  - hook_node_load()      — attach `$node->book` onto loaded nodes
 *  - hook_node_insert()    — add a new outline link
 *  - hook_node_update()    — update an existing outline link
 *  - hook_node_predelete() — remove a deleted node from its outline
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { BookManager } from './book-manager.js';
import type { BookNode, BookOutlineStorageInterface } from './types.js';

/** This module's machine name. */
export const MODULE_NAME = 'book';

export class BookHooks {
  constructor(
    private readonly bookManager: BookManager,
    private readonly outlineStorage: BookOutlineStorageInterface,
  ) {}

  /**
   * Implements hook_help().
   *
   * Returns help markup for this module's help route, or null otherwise.
   */
  help(routeName: string): string | null {
    if (routeName === 'help.page.book') {
      return (
        '<h2>About</h2>' +
        '<p>The Book module is used for creating structured, multi-page ' +
        'documentation sections that have a defined structure and a ' +
        'table of contents. It lets you organise content into a hierarchy ' +
        'so readers can navigate from page to page.</p>'
      );
    }
    return null;
  }

  /**
   * Implements hook_node_load().
   *
   * Attaches the stored outline link onto each loaded node that is in a book.
   */
  nodeLoad(nodes: BookNode[]): void {
    for (const node of nodes) {
      const link = this.outlineStorage.load(node.id());
      if (link !== undefined) {
        node.book = link;
      }
    }
  }

  /**
   * Implements hook_node_insert().
   *
   * Saves a new outline link for a node that was created with book data.
   */
  nodeInsert(node: BookNode): void {
    if (this.hasOutline(node)) {
      this.bookManager.saveBookLink(node.book!, true);
    }
  }

  /**
   * Implements hook_node_update().
   *
   * Updates the outline link for a node already in a book.
   */
  nodeUpdate(node: BookNode): void {
    if (this.hasOutline(node)) {
      const existing = this.outlineStorage.load(node.id());
      this.bookManager.saveBookLink(node.book!, existing === undefined);
    }
  }

  /**
   * Implements hook_node_predelete().
   *
   * Removes a node from its book outline before the node is deleted.
   */
  nodePredelete(node: BookNode): void {
    if (this.outlineStorage.load(node.id()) !== undefined) {
      this.bookManager.deleteFromBook(node.id());
    }
  }

  /** A node participates in a book when it carries outline data with a bid. */
  private hasOutline(node: BookNode): boolean {
    return node.book !== undefined && node.book.bid !== 0;
  }
}

/**
 * Registers this module's hook implementations against a module handler,
 * mirroring Drupal's `#[Hook]` attribute discovery.
 */
export function registerBookHooks(
  moduleHandler: ModuleHandlerInterface,
  hooks: BookHooks,
): void {
  moduleHandler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));
  moduleHandler.implement(MODULE_NAME, 'node_load', (nodes) =>
    hooks.nodeLoad(nodes as BookNode[]),
  );
  moduleHandler.implement(MODULE_NAME, 'node_insert', (node) =>
    hooks.nodeInsert(node as BookNode),
  );
  moduleHandler.implement(MODULE_NAME, 'node_update', (node) =>
    hooks.nodeUpdate(node as BookNode),
  );
  moduleHandler.implement(MODULE_NAME, 'node_predelete', (node) =>
    hooks.nodePredelete(node as BookNode),
  );
}
