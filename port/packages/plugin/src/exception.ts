/**
 * Plugin exception hierarchy.
 *
 * Port of `Drupal\Component\Plugin\Exception\*`. PHP's exception classes all
 * implement a marker `ExceptionInterface`; in TypeScript we model that with a
 * shared base class and `instanceof` checks (there is no structural marker for
 * thrown errors at runtime otherwise).
 */

/**
 * Base class for all plugin exceptions.
 *
 * @see \Drupal\Component\Plugin\Exception\PluginException
 */
export class PluginException extends Error {
  constructor(message = '', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PluginException';
    // Restore prototype chain for downlevel/transpiled environments.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a plugin ID could not be found.
 *
 * @see \Drupal\Component\Plugin\Exception\PluginNotFoundException
 */
export class PluginNotFoundException extends PluginException {
  readonly pluginId: string;

  constructor(pluginId: string, message = '', options?: { cause?: unknown }) {
    super(message || `Plugin ID '${pluginId}' was not found.`, options);
    this.name = 'PluginNotFoundException';
    this.pluginId = pluginId;
  }
}

/**
 * Thrown when a plugin definition is invalid.
 *
 * @see \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
 */
export class InvalidPluginDefinitionException extends PluginException {
  readonly pluginId: string;

  constructor(pluginId: string, message = '', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'InvalidPluginDefinitionException';
    this.pluginId = pluginId;
  }
}

/**
 * Thrown if a plugin tries to use an invalid deriver.
 *
 * @see \Drupal\Component\Plugin\Exception\InvalidDeriverException
 */
export class InvalidDeriverException extends PluginException {
  constructor(message = '', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'InvalidDeriverException';
  }
}
