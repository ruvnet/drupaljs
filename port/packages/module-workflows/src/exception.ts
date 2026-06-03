/**
 * Port of `Drupal\workflows\Exception\RequiredStateMissingException`.
 *
 * Thrown when a workflow is saved without the states its type plugin requires.
 */
export class RequiredStateMissingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequiredStateMissingException';
  }
}
