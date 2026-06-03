/**
 * Field API exceptions.
 *
 * @see \Drupal\Core\Field\FieldException
 */

/**
 * Base class for exceptions thrown by the Field API.
 *
 * @see \Drupal\Core\Field\FieldException
 */
export class FieldException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldException';
  }
}
