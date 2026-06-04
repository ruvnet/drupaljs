/**
 * Minimal TypedConfigManager contract.
 *
 * TODO: Replace with the full @drupaljs/config typed-data manager (port of
 * Drupal\Core\Config\TypedConfigManagerInterface) once the TypedData subsystem
 * is ported. Schema-based value casting on save() is out of scope here; this
 * placeholder lets Config validate values without a schema.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/TypedConfigManagerInterface.php
 */
export interface TypedConfigManagerInterface {
  /** Whether a configuration schema is defined for the given name. */
  hasConfigSchema(name: string): boolean;
}

/** A no-schema implementation: always reports "no schema". */
export class NullTypedConfigManager implements TypedConfigManagerInterface {
  hasConfigSchema(_name: string): boolean {
    return false;
  }
}
