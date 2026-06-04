/**
 * Exception thrown when trying to write read-only data.
 *
 * @see Drupal\Core\TypedData\Exception\ReadOnlyException
 */
export class ReadOnlyException extends Error {
  constructor(message = 'The data is read-only.') {
    super(message);
    this.name = 'ReadOnlyException';
  }
}

/**
 * Exception thrown when accessing data that is unset.
 *
 * @see Drupal\Core\TypedData\Exception\MissingDataException
 */
export class MissingDataException extends Error {
  constructor(message = 'The data structure is unset.') {
    super(message);
    this.name = 'MissingDataException';
  }
}
