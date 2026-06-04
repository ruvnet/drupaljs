/**
 * Thrown when a string cannot be saved to or deleted from storage.
 *
 * Port of \Drupal\locale\StringStorageException.
 */
export class StringStorageException extends Error {
  override readonly name = 'StringStorageException';

  constructor(message: string) {
    super(message);
    // Restore the prototype chain for instanceof to work across the
    // ES2022 / down-level boundary.
    Object.setPrototypeOf(this, StringStorageException.prototype);
  }
}
