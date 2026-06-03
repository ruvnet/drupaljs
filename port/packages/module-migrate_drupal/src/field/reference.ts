/**
 * Reference field plugins.
 *
 * Ports `Drupal\migrate_drupal\Plugin\migrate\field\ReferenceBase` and its
 * concrete subclasses (d6/d7 NodeReference and UserReference). The original
 * declares its definition via the `#[MigrateField]` attribute; the TS port
 * declares it inline (there is no PHP attribute discovery — the plugin manager's
 * `register()` is the idiomatic equivalent).
 */

import { FieldPluginBase } from './field-plugin-base.js';
import type { MigrateFieldDefinition } from '../contracts.js';

/**
 * Base for reference fields. Subclasses identify the migration that supplies the
 * referenced entity ids and the source-row id property.
 *
 * Ports `ReferenceBase`.
 */
export abstract class ReferenceBase extends FieldPluginBase {
  /** Plugin id of the migration that creates the referenced entities. */
  protected abstract getEntityTypeMigrationId(): string;
  /** Source-row property holding the referenced entity id (e.g. 'nid'). */
  protected abstract entityId(): string;
}

/**
 * Drupal 6 node reference field plugin.
 *
 * Ports `Plugin/migrate/field/d6/NodeReference`.
 */
export class NodeReference extends ReferenceBase {
  constructor() {
    super('nodereference', {
      id: 'nodereference',
      core: [6],
      type_map: { nodereference: 'entity_reference' },
      source_module: 'nodereference',
      destination_module: 'core',
    });
  }

  protected getEntityTypeMigrationId(): string {
    return 'd6_node_type';
  }

  protected entityId(): string {
    return 'nid';
  }
}

/**
 * Drupal 7 user reference field plugin.
 *
 * Ports `Plugin/migrate/field/d7/UserReference`.
 */
export class UserReference extends ReferenceBase {
  constructor() {
    super('userreference', {
      id: 'userreference',
      core: [7],
      type_map: { userreference: 'entity_reference' },
      source_module: 'user_reference',
      destination_module: 'core',
    });
  }

  protected getEntityTypeMigrationId(): string {
    return 'user';
  }

  protected entityId(): string {
    return 'uid';
  }
}

/** Pre-built definition handle used by callers/tests that want a singleton. */
export const USER_REFERENCE_D7: UserReference = new UserReference();

/** Default field-plugin definitions shipped with migrate_drupal. */
export const DEFAULT_FIELD_PLUGINS: Array<{
  definition: MigrateFieldDefinition;
  create: () => ReferenceBase;
}> = [
  { definition: new NodeReference().getPluginDefinition(), create: () => new NodeReference() },
  { definition: new UserReference().getPluginDefinition(), create: () => new UserReference() },
];
