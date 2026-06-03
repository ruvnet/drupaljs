/**
 * Access checks for the `book` module.
 *
 * Ports the permission-based access logic used by the book routes and outline
 * forms (`book_access` / the `_permission` requirements in book.routing.yml).
 * Cacheability metadata from `AccessResult` is out of scope for this slice; the
 * verdict is reduced to a string.
 */

import type { AccountInterface } from './types.js';

/** Result of an access check, mirroring AccessResult's boolean verdict. */
export type AccessVerdict = 'allowed' | 'forbidden' | 'neutral';

export class BookAccess {
  /**
   * Access to outline-management routes (admin overview, edit, outline form).
   * Gated by `administer book outlines`.
   */
  accessOutline(account: AccountInterface): AccessVerdict {
    return account.hasPermission('administer book outlines') ? 'allowed' : 'forbidden';
  }

  /**
   * Access to add a node to a book. Administrators may always do so; otherwise
   * the user needs `add content to books`.
   */
  accessAddToBook(account: AccountInterface): AccessVerdict {
    if (account.hasPermission('administer book outlines')) {
      return 'allowed';
    }
    return account.hasPermission('add content to books') ? 'allowed' : 'forbidden';
  }

  /** Access to the printer-friendly export route. */
  accessExport(account: AccountInterface): AccessVerdict {
    return account.hasPermission('access printer-friendly version') ? 'allowed' : 'forbidden';
  }
}
