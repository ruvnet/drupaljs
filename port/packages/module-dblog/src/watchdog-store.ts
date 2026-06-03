/**
 * In-memory implementation of {@link WatchdogStore}.
 *
 * Stands in for the `watchdog` database table during the port. It implements
 * exactly the operations the dblog services need (insert, load, distinct types,
 * count, prune, clear) with the same semantics as the SQL the original module
 * runs against the table.
 *
 * TODO(@drupaljs/database): swap for a Connection-backed store once the query
 * builder can target the watchdog schema (dblog_schema()).
 */
import type { WatchdogEntry, WatchdogInsert, WatchdogStore } from './types.js';

export class InMemoryWatchdogStore implements WatchdogStore {
  private rows: WatchdogEntry[] = [];
  private nextWid = 1;

  insert(row: WatchdogInsert): number {
    const wid = this.nextWid++;
    this.rows.push({ ...row, wid });
    return wid;
  }

  load(wid: number): WatchdogEntry | undefined {
    return this.rows.find((r) => r.wid === wid);
  }

  all(): readonly WatchdogEntry[] {
    return this.rows;
  }

  distinctTypes(): string[] {
    // SELECT DISTINCT([type]) FROM {watchdog} ORDER BY [type]
    return [...new Set(this.rows.map((r) => r.type))].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
  }

  count(): number {
    return this.rows.length;
  }

  pruneToRowLimit(rowLimit: number): void {
    // Faithful to DblogHooks::cron(): for row limit n, find the wid of the nth
    // row in descending wid order, then delete everything older than it.
    if (rowLimit <= 0 || this.rows.length <= rowLimit) {
      return;
    }
    const byWidDesc = [...this.rows].sort((a, b) => b.wid - a.wid);
    // The nth most-recent row (1-indexed) is at array index rowLimit - 1.
    const minRow = byWidDesc[rowLimit - 1]!.wid;
    this.rows = this.rows.filter((r) => r.wid >= minRow);
  }

  clear(): void {
    this.rows = [];
  }
}
