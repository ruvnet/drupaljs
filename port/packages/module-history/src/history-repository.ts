/**
 * HistoryRepository — TS port of the history module's procedural read/write API.
 *
 * Ports the `history.module` functions `history_read()`,
 * `history_read_multiple()` and `history_write()`, plus the `HISTORY_READ_LIMIT`
 * constant and the `{history}` table shape from `history.install`.
 *
 * In Drupal these are global procedural functions backed by the database and a
 * per-request static cache (`drupal_static`). Here they become methods on a
 * class so the database collaborator can be injected and mocked (ADR-0016), and
 * the per-request static cache is an instance-level `Map` rather than a global.
 */

/** Seconds in 30 days; entities older than this are always considered read. */
export const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * A single `{history}` table row. Mirrors the schema in `history.install`
 * (composite primary key `[uid, nid]`).
 */
export interface HistoryRow {
  /** The user id that read the node. */
  readonly uid: number;
  /** The node id that was read. */
  readonly nid: number;
  /** Unix timestamp at which the read occurred. */
  readonly timestamp: number;
}

/**
 * The slice of the database the repository needs. Models the two `{history}`
 * operations the procedural functions perform: a keyed read of the latest
 * timestamps for a (uid, nid-set), and an upsert (Drupal's `merge`).
 *
 * TODO(@drupaljs/database): replace with the shared Connection/Select/Merge
 * query-builder types once the database package exposes them.
 */
export interface HistoryStorage {
  /**
   * Returns `{history}` rows for `uid` whose `nid` is in `nids`. Ports the
   * SELECT in history_read_multiple(). Missing nids simply have no row.
   */
  readTimestamps(uid: number, nids: readonly number[]): readonly HistoryRow[];
  /**
   * Upserts a `(uid, nid)` row with the given timestamp. Ports the `merge` in
   * history_write().
   */
  writeTimestamp(uid: number, nid: number, timestamp: number): void;
  /** Deletes all rows with `timestamp < before`. Ports hook_cron's cleanup. */
  deleteOlderThan(before: number): void;
  /** Deletes all rows for a node. Ports hook_node_delete. */
  deleteByNid(nid: number): void;
  /** Deletes all rows for a user. Ports hook_user_delete / user_cancel. */
  deleteByUid(uid: number): void;
}

/** Current-user collaborator (the slice AccountInterface exposes here). */
export interface HistoryAccount {
  /** The user id, or null for the anonymous user. */
  id(): number | null;
  /** Whether the account is authenticated (non-anonymous). */
  isAuthenticated(): boolean;
}

/** Time service collaborator. Ports `Drupal::time()->getRequestTime()`. */
export interface TimeService {
  /** The request time as a Unix timestamp (seconds). */
  getRequestTime(): number;
}

/**
 * Records and retrieves which users have read which nodes.
 *
 * Faithful port of the history module's procedural read/write helpers.
 */
export class HistoryRepository {
  /**
   * Per-request static cache: nid -> last-viewed timestamp for the current user.
   * Ports the `drupal_static('history_read_multiple')` cache.
   */
  private readonly staticCache = new Map<number, number>();

  constructor(
    private readonly storage: HistoryStorage,
    private readonly currentUser: HistoryAccount,
    private readonly time: TimeService,
  ) {}

  /**
   * The timestamp before which entities are always shown as read (30 days ago).
   * Ports the `HISTORY_READ_LIMIT` constant (computed from request time).
   */
  readLimit(): number {
    return this.time.getRequestTime() - THIRTY_DAYS_SECONDS;
  }

  /**
   * Ports history_read(): the current user's last-view timestamp for a node, or
   * 0 if never viewed.
   */
  read(nid: number): number {
    return this.readMultiple([nid])[nid] ?? 0;
  }

  /**
   * Ports history_read_multiple(): last-view timestamps keyed by nid (0 when a
   * node has not been viewed). Uses the per-request static cache and only
   * queries storage for uncached nids.
   */
  readMultiple(nids: readonly number[]): Record<number, number> {
    const result: Record<number, number> = {};
    const toRead: number[] = [];

    for (const nid of nids) {
      const cached = this.staticCache.get(nid);
      if (cached !== undefined) {
        result[nid] = cached;
      } else {
        // Initialise to 0 (not viewed) until storage says otherwise.
        toRead.push(nid);
        result[nid] = 0;
      }
    }

    if (toRead.length === 0) {
      return result;
    }

    const uid = this.currentUser.id() ?? 0;
    for (const row of this.storage.readTimestamps(uid, toRead)) {
      result[row.nid] = row.timestamp;
    }

    // Populate the static cache for every nid we just resolved.
    for (const nid of toRead) {
      this.staticCache.set(nid, result[nid] ?? 0);
    }

    return result;
  }

  /**
   * Ports history_write(): records that the given account (default current
   * user) viewed the node now. No-op for anonymous users.
   */
  write(nid: number, account: HistoryAccount = this.currentUser): void {
    if (!account.isAuthenticated()) {
      return;
    }
    const requestTime = this.time.getRequestTime();
    this.storage.writeTimestamp(account.id() ?? 0, nid, requestTime);
    this.staticCache.set(nid, requestTime);
  }

  /** Drops the per-request static cache (used in tests / request teardown). */
  resetCache(): void {
    this.staticCache.clear();
  }
}
