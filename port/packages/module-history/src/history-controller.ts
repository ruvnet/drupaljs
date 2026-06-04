/**
 * HistoryController. Ports `Drupal\history\Controller\HistoryController`.
 *
 * The original returns Symfony JsonResponse objects and throws Access/NotFound
 * HTTP exceptions. Here the controller returns plain JSON-serialisable values
 * and throws the ported {@link AccessDeniedHttpException} /
 * {@link NotFoundHttpException}; an HTTP layer maps these to 403/404 responses.
 *
 * Scope: getNodeReadTimestamps and readNode are fully ported (self-contained).
 * renderNewCommentsNodeLinks depends on comment storage page-number logic that
 * lives in another package and is left as a TODO.
 */

import type { HistoryRepository, HistoryAccount } from './history-repository.js';

/** Ports Symfony's AccessDeniedHttpException (HTTP 403). */
export class AccessDeniedHttpException extends Error {
  readonly statusCode = 403;
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedHttpException';
  }
}

/** Ports Symfony's NotFoundHttpException (HTTP 404). */
export class NotFoundHttpException extends Error {
  readonly statusCode = 404;
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundHttpException';
  }
}

export class HistoryController {
  constructor(
    private readonly repository: HistoryRepository,
    private readonly currentUser: HistoryAccount,
  ) {}

  /**
   * Ports getNodeReadTimestamps(). Returns last-read timestamps keyed by nid.
   *
   * @throws {AccessDeniedHttpException} For anonymous users.
   * @throws {NotFoundHttpException} When `nodeIds` is missing.
   */
  getNodeReadTimestamps(nodeIds: readonly number[] | undefined): Record<number, number> {
    if (!this.currentUser.isAuthenticated()) {
      throw new AccessDeniedHttpException();
    }
    if (nodeIds === undefined) {
      throw new NotFoundHttpException();
    }
    return this.repository.readMultiple(nodeIds);
  }

  /**
   * Ports readNode(). Marks the node as read now and returns the new timestamp.
   *
   * @throws {AccessDeniedHttpException} For anonymous users.
   */
  readNode(nodeId: number): number {
    if (!this.currentUser.isAuthenticated()) {
      throw new AccessDeniedHttpException();
    }
    this.repository.write(nodeId);
    return this.repository.read(nodeId);
  }
}
