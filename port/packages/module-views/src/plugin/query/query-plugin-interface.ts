import type { ResultRow } from '../../result-row.js';

/**
 * The slice of {@link ViewExecutable} a query plugin reads and writes during
 * `build()` / `execute()`. Kept narrow so query plugins can be unit-tested with
 * a lightweight stand-in (London-style), mirroring how Drupal's QueryPluginBase
 * only touches `$view->result`, `$view->total_rows`, etc.
 */
export interface ViewLike {
  /** The executed rows; the query plugin replaces this in `execute()`. */
  result: ResultRow[];
  /** Total matching rows before pager limit/offset. */
  total_rows?: number;
  /** Optional pager hook used by the full ViewExecutable. */
  setItemsPerPage?(items: number): void;
}

/** A WHERE condition within a group. Ports the `conditions` entry of Sql. */
export interface QueryCondition {
  field: string;
  value: unknown;
  operator: string;
}

/** A WHERE group: a set of conditions joined by `type` (AND/OR). */
export interface QueryWhereGroup {
  type: 'AND' | 'OR';
  conditions: QueryCondition[];
}

/** An ORDER BY clause. */
export interface QueryOrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Query plugin contract. Ports the public surface of
 * `Drupal\views\Plugin\views\query\QueryPluginBase` that the execution flow and
 * handlers rely on. SQL-specific members (DateSql, signatures, distinct, etc.)
 * are deferred — see the package barrel's "Deferred" note.
 */
export interface QueryPluginInterface {
  /** Adds a field to the SELECT; returns the alias used. */
  addField(table: string | null, field: string, alias?: string): string;
  /**
   * Adds a WHERE condition to a group (group 0 is the default). Ports
   * QueryPluginBase semantics: a `null` operator defaults based on value type.
   */
  addWhere(group: number, field: string, value?: unknown, operator?: string | null): void;
  /** Adds an ORDER BY clause. */
  addOrderBy(
    table: string | null,
    field: string | null,
    order?: 'ASC' | 'DESC',
    alias?: string,
  ): void;
  /** Sets the operator joining WHERE *groups* (AND/OR). */
  setGroupOperator(type?: 'AND' | 'OR'): void;
  /** Sets the operator within a single WHERE group. */
  setWhereGroup(type?: 'AND' | 'OR', group?: number): void;

  setLimit(limit: number | null): void;
  setOffset(offset: number | null): void;
  getLimit(): number | null;

  /** Builds the query from the accumulated clauses (ports build()). */
  build(view: ViewLike): void;
  /** Executes the query, populating `view.result` and `view.total_rows`. */
  execute(view: ViewLike): void;
}
