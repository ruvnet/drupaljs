import type { AccountInterface } from './contracts.js';
import type { ShortcutInterface, ShortcutSetInterface } from './Entity/interfaces.js';

/**
 * Storage for `shortcut` content entities.
 *
 * Models the slice of `Drupal\Core\Entity\EntityStorageInterface` the shortcut
 * module uses for the `shortcut` entity type. The real storage talks to the
 * `shortcut` / `shortcut_field_data` tables; here it is an interface so the set
 * entity and services can be unit-tested against a fake.
 *
 * TODO(@drupaljs/entity): re-key onto the shared EntityStorageInterface.
 */
export interface ShortcutEntityStorageInterface {
  /** Loads every shortcut whose `shortcut_set` matches the given set id. */
  loadByProperties(properties: { shortcut_set: string }): ShortcutInterface[];
  /** Persists a shortcut (assigns an id on first save). */
  save(shortcut: ShortcutInterface): void;
  /** Deletes the given shortcuts. */
  delete(shortcuts: ShortcutInterface[]): void;
}

/**
 * Defines an interface for `shortcut_set` config-entity storage.
 *
 * Ports `Drupal\shortcut\ShortcutSetStorageInterface`. The config-entity CRUD it
 * inherits in core is reduced to the `load` the module relies on, plus the
 * set/user-assignment operations unique to shortcut.
 */
export interface ShortcutSetStorageInterface {
  /** Loads a shortcut set by machine name, or null. */
  load(id: string): ShortcutSetInterface | null;

  /** Assigns a user to a particular shortcut set. */
  assignUser(shortcutSet: ShortcutSetInterface, account: AccountInterface): void;

  /**
   * Un-assigns a user from any set; returns true if an assignment was removed.
   */
  unassignUser(account: AccountInterface): boolean;

  /** Deletes the user assignments belonging to a shortcut set. */
  deleteAssignedShortcutSets(entity: ShortcutSetInterface): void;

  /** Returns the set name assigned to a user, or null. */
  getAssignedToUser(account: AccountInterface): string | null;

  /** Returns the set displayed to a user (assigned set, else default). */
  getDisplayedToUser(account: AccountInterface): ShortcutSetInterface;

  /** Returns the number of users who have this set assigned. */
  countAssignedUsers(shortcutSet: ShortcutSetInterface): number;

  /** Returns the default set for a user (via `hook_shortcut_default_set`). */
  getDefaultSet(account: AccountInterface): ShortcutSetInterface | null;
}

/** Row in the `shortcut_set_users` mapping table. */
interface SetUserRow {
  uid: string | number;
  set_name: string;
}

/**
 * Dependencies injected into {@link ShortcutSetStorage}.
 */
export interface ShortcutSetStorageDeps {
  /** Loads a config set by machine name (the config-entity layer). */
  loadSet(id: string): ShortcutSetInterface | null;
  /**
   * Collects `hook_shortcut_default_set` suggestions for an account. Ports the
   * `module_handler->invokeAll('shortcut_default_set', [$account])` call.
   */
  invokeDefaultSetHook(account: AccountInterface): string[];
}

/**
 * In-memory port of `Drupal\shortcut\ShortcutSetStorage`.
 *
 * The original extends `ConfigEntityStorage` and persists the `shortcut_set` ->
 * user mapping in the `shortcut_set_users` database table. This slice keeps that
 * mapping in a `Map` so the unique shortcut behaviour (assign/unassign/default
 * resolution) is faithfully testable without a database.
 *
 * TODO(@drupaljs/database): back the `shortcut_set_users` mapping with the real
 * database connection once `@drupaljs/database` lands.
 */
export class ShortcutSetStorage implements ShortcutSetStorageInterface {
  /** uid -> set_name (the `shortcut_set_users` table). */
  private readonly assignments = new Map<string, SetUserRow>();

  constructor(private readonly deps: ShortcutSetStorageDeps) {}

  load(id: string): ShortcutSetInterface | null {
    return this.deps.loadSet(id);
  }

  deleteAssignedShortcutSets(entity: ShortcutSetInterface): void {
    for (const [uid, row] of this.assignments) {
      if (row.set_name === entity.id()) {
        this.assignments.delete(uid);
      }
    }
  }

  assignUser(shortcutSet: ShortcutSetInterface, account: AccountInterface): void {
    this.assignments.set(String(account.id()), {
      uid: account.id(),
      set_name: shortcutSet.id(),
    });
  }

  unassignUser(account: AccountInterface): boolean {
    return this.assignments.delete(String(account.id()));
  }

  getAssignedToUser(account: AccountInterface): string | null {
    return this.assignments.get(String(account.id()))?.set_name ?? null;
  }

  getDisplayedToUser(account: AccountInterface): ShortcutSetInterface {
    const setName = this.getAssignedToUser(account);
    if (setName) {
      const set = this.load(setName);
      if (set) {
        return set;
      }
    }
    const fallback = this.getDefaultSet(account);
    if (!fallback) {
      throw new Error('No shortcut set could be displayed to the user.');
    }
    return fallback;
  }

  countAssignedUsers(shortcutSet: ShortcutSetInterface): number {
    let count = 0;
    for (const row of this.assignments.values()) {
      if (row.set_name === shortcutSet.id()) {
        count++;
      }
    }
    return count;
  }

  getDefaultSet(account: AccountInterface): ShortcutSetInterface | null {
    // Allow modules to return a default set name; the last module to return a
    // valid result wins (hence reverse), falling back to 'default'.
    const suggestions = [...this.deps.invokeDefaultSetHook(account)].reverse();
    suggestions.push('default');
    for (const name of suggestions) {
      const set = this.load(name);
      if (set) {
        return set;
      }
    }
    return null;
  }
}
