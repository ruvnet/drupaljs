import type { MediaLibraryState } from './media-library-state.js';
import type { AccessResultInterface, AccountInterface } from './types.js';

/**
 * Defines an interface for media library openers.
 *
 * Opener services let modules check access to the selection dialog and respond
 * to selections (e.g. an entity-reference field widget, or a text editor).
 *
 * Source: drupal-core/core/modules/media_library/src/MediaLibraryOpenerInterface.php
 */
export interface MediaLibraryOpenerInterface {
  /** Checks media library access for the given state and account. */
  checkAccess(state: MediaLibraryState, account: AccountInterface): AccessResultInterface;
  /** Generates a response after media items are selected. */
  getSelectionResponse(state: MediaLibraryState, selectedIds: Array<number | string>): unknown;
}

/** Resolves the opener service for a state. Ports `OpenerResolverInterface`. */
export interface OpenerResolverInterface {
  get(state: MediaLibraryState): MediaLibraryOpenerInterface;
}

/**
 * Resolves media library openers.
 *
 * A thin, interface-verifying wrapper around services implementing
 * {@link MediaLibraryOpenerInterface}. Ports `Drupal\media_library\OpenerResolver`.
 *
 * @internal
 *   Internal to the modal media library dialog; not a public extension point.
 */
export class OpenerResolver implements OpenerResolverInterface {
  private readonly openers = new Map<string, MediaLibraryOpenerInterface>();

  /** Registers an opener under a service id. Ports `::addOpener()`. */
  addOpener(opener: MediaLibraryOpenerInterface, id: string): void {
    this.openers.set(id, opener);
  }

  /**
   * Returns the opener for a state's opener id. Ports `::get()`.
   *
   * @throws {Error} when no opener is registered for the id.
   */
  get(state: MediaLibraryState): MediaLibraryOpenerInterface {
    const serviceId = state.getOpenerId();
    const service = this.openers.get(serviceId);
    if (service) {
      return service;
    }
    throw new Error(`${serviceId} must be an instance of MediaLibraryOpenerInterface`);
  }
}
