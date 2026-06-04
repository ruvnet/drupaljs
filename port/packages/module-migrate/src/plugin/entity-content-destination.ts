/**
 * `entity:*` content destination plugin. A minimal port of
 * `Drupal\migrate\Plugin\migrate\destination\EntityContentBase`.
 *
 * The Drupal original resolves the entity storage from the entity-type manager
 * and saves a populated entity. Here the entity storage is injected (so the port
 * stays pure and testable); `import()` persists the row's destination values and
 * returns the new entity IDs, and `rollback()` deletes by destination id.
 *
 * TODO(@drupaljs/entity): swap the local EntityStorage seam for the shared
 * EntityStorageInterface once the entity package exposes a save/delete contract.
 */

import {
  RollbackAction,
  type FieldDefinitions,
  type MigrateDestinationInterface,
} from '../contracts.js';
import type { Row } from '../row.js';

/** Minimal storage seam: persist destination values, delete by id. */
export interface EntityStorage {
  /** Saves the entity values; returns the destination ID values. */
  save(values: Record<string, unknown>): unknown[];
  /** Deletes by destination identifier. */
  delete(identifier: Record<string, unknown>): void;
}

export interface EntityContentConfig {
  /** Plugin id, e.g. "entity:node". */
  plugin: string;
  /** Optional default bundle applied to created entities. */
  default_bundle?: string;
}

export class EntityContentDestination implements MigrateDestinationInterface {
  private readonly config: EntityContentConfig;
  private readonly storage: EntityStorage;

  constructor(config: EntityContentConfig, storage: EntityStorage) {
    this.config = config;
    this.storage = storage;
  }

  getIds(): FieldDefinitions {
    // Content entities are keyed by an integer id in the map table.
    return { id: { type: 'integer' } };
  }

  fields(): Record<string, string> {
    return {};
  }

  import(row: Row, _oldDestinationIdValues: unknown[] = []): unknown[] | boolean {
    // Persist exactly the row's resolved destination values. (The Drupal
    // original would hydrate an entity here; the entity-construction step is
    // delegated to the injected storage seam.)
    return this.storage.save(row.getDestination());
  }

  rollback(destinationIdentifier: Record<string, unknown>): void {
    this.storage.delete(destinationIdentifier);
  }

  supportsRollback(): boolean {
    return true;
  }

  rollbackAction(): RollbackAction {
    return RollbackAction.DELETE;
  }

  getPluginId(): string {
    return this.config.plugin;
  }
}
