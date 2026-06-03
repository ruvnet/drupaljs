/**
 * Configuration system exceptions.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/*Exception.php
 */

/** Base class for all configuration exceptions. Port of ConfigException. */
export class ConfigException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigException';
  }
}

/** Thrown when a configuration object name is invalid. Port of ConfigNameException. */
export class ConfigNameException extends ConfigException {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigNameException';
  }
}

/** Thrown when a configuration value is invalid (e.g. a key contains a dot). */
export class ConfigValueException extends ConfigException {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValueException';
  }
}

/** Thrown when attempting to mutate an immutable configuration object. */
export class ImmutableConfigException extends ConfigException {
  constructor(message: string) {
    super(message);
    this.name = 'ImmutableConfigException';
  }
}

/** Thrown by storage backends on unrecoverable I/O errors. Port of StorageException. */
export class StorageException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageException';
  }
}
