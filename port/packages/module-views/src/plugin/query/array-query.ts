import { ResultRow } from '../../result-row.js';
import type {
  QueryOrderBy,
  QueryPluginInterface,
  QueryWhereGroup,
  ViewLike,
} from './query-plugin-interface.js';

/** A raw input record: a flat field -> value map. */
export type ArrayRecord = Record<string, unknown>;

/**
 * An in-memory query plugin.
 *
 * The real Drupal default query plugin is `Drupal\views\Plugin\views\query\Sql`,
 * which compiles clauses into a `Drupal\Core\Database\Query\Select` against a
 * relational database. That is deferred until `@drupaljs/database` lands.
 *
 * `ArrayQuery` is a faithful port of the **QueryPluginBase contract** — the same
 * `addField` / `addWhere` / `addOrderBy` / `setLimit` / `setOffset` /
 * group-operator API and the same `build()` -> `execute()` lifecycle (including
 * the `array_values` re-keying and per-row `index` assignment documented on
 * `QueryPluginBase::execute()`) — but it filters, sorts and slices an in-memory
 * array. This lets the views execution flow be exercised end-to-end without a
 * database, and `Sql` can later drop in behind the same interface.
 */
export class ArrayQuery implements QueryPluginInterface {
  private data: ArrayRecord[] = [];

  /** Field aliases to project into result rows. */
  private readonly fields: { field: string; alias: string }[] = [];

  /** WHERE groups keyed by group id. Group 0 always exists. */
  private readonly where = new Map<number, QueryWhereGroup>();

  /** Operator joining the WHERE groups together. */
  private groupOperator: 'AND' | 'OR' = 'AND';

  private readonly orderBy: QueryOrderBy[] = [];

  private limit: number | null = null;
  private offset = 0;

  constructor() {
    this.where.set(0, { type: 'AND', conditions: [] });
  }

  /** Loads the dataset this query runs against (the ArrayQuery analogue of a table). */
  setData(records: ArrayRecord[]): void {
    this.data = records;
  }

  addField(_table: string | null, field: string, alias = ''): string {
    const finalAlias = alias !== '' ? alias : field;
    if (!this.fields.some((f) => f.alias === finalAlias)) {
      this.fields.push({ field, alias: finalAlias });
    }
    return finalAlias;
  }

  addWhere(group: number, field: string, value?: unknown, operator: string | null = null): void {
    const op = operator ?? (Array.isArray(value) ? 'IN' : '=');
    const bucket = this.ensureGroup(group);
    bucket.conditions.push({ field, value, operator: op });
  }

  setWhereGroup(type: 'AND' | 'OR' = 'AND', group = 1): void {
    this.ensureGroup(group).type = type;
  }

  setGroupOperator(type: 'AND' | 'OR' = 'AND'): void {
    this.groupOperator = type;
  }

  addOrderBy(
    _table: string | null,
    field: string | null,
    order: 'ASC' | 'DESC' = 'ASC',
    alias = '',
  ): void {
    const key = alias !== '' ? alias : field;
    if (key === null) {
      return;
    }
    this.orderBy.push({ field: key, direction: order });
  }

  setLimit(limit: number | null): void {
    this.limit = limit;
  }

  setOffset(offset: number | null): void {
    this.offset = offset ?? 0;
  }

  getLimit(): number | null {
    return this.limit;
  }

  /**
   * Builds the query. For SQL this assembles a Select object; here there is
   * nothing to compile ahead of time, so build() is a no-op kept for contract
   * parity and future hookability.
   */
  build(_view: ViewLike): void {
    // No-op: filtering happens at execute() against the in-memory dataset.
  }

  execute(view: ViewLike): void {
    // 1. Filter.
    const matched = this.data.filter((record) => this.matches(record));

    // total_rows reflects all matches, before pager limit/offset (parity with
    // Sql, which runs a count query for the pager).
    view.total_rows = matched.length;

    // 2. Sort (stable across multiple ORDER BY clauses).
    const sorted = this.applyOrder(matched);

    // 3. Slice for limit/offset.
    const end = this.limit === null ? undefined : this.offset + this.limit;
    const sliced = sorted.slice(this.offset, end);

    // 4. Project selected fields into ResultRows, assigning index.
    const rows = sliced.map((record, i) => {
      const row = new ResultRow();
      const project = this.fields.length > 0 ? this.fields : this.allFields(record);
      for (const { field, alias } of project) {
        row.set(alias, record[field]);
      }
      row.index = i;
      return row;
    });

    // Enforce the contiguous-array-key rule from QueryPluginBase::execute().
    view.result = rows;
  }

  // -- internals -----------------------------------------------------------

  private ensureGroup(group: number): QueryWhereGroup {
    let bucket = this.where.get(group);
    if (bucket === undefined) {
      bucket = { type: 'AND', conditions: [] };
      this.where.set(group, bucket);
    }
    return bucket;
  }

  private matches(record: ArrayRecord): boolean {
    const groupResults: boolean[] = [];
    for (const bucket of this.where.values()) {
      if (bucket.conditions.length === 0) {
        continue;
      }
      const evals = bucket.conditions.map((c) => evalCondition(record[c.field], c.operator, c.value));
      const groupValue =
        bucket.type === 'AND' ? evals.every(Boolean) : evals.some(Boolean);
      groupResults.push(groupValue);
    }
    if (groupResults.length === 0) {
      return true;
    }
    return this.groupOperator === 'AND'
      ? groupResults.every(Boolean)
      : groupResults.some(Boolean);
  }

  private applyOrder(records: ArrayRecord[]): ArrayRecord[] {
    if (this.orderBy.length === 0) {
      return records;
    }
    // Decorate-sort-undecorate for a stable multi-key sort.
    return records
      .map((record, i) => ({ record, i }))
      .sort((a, b) => {
        for (const { field, direction } of this.orderBy) {
          const cmp = compareValues(a.record[field], b.record[field]);
          if (cmp !== 0) {
            return direction === 'DESC' ? -cmp : cmp;
          }
        }
        return a.i - b.i;
      })
      .map((d) => d.record);
  }

  private allFields(record: ArrayRecord): { field: string; alias: string }[] {
    return Object.keys(record).map((field) => ({ field, alias: field }));
  }
}

/** Evaluates a single condition. Ports the operator set used by Sql::addWhere. */
function evalCondition(left: unknown, operator: string, right: unknown): boolean {
  switch (operator.toUpperCase()) {
    case '=':
      return left === right;
    case '!=':
    case '<>':
      return left !== right;
    case '>':
      return compareValues(left, right) > 0;
    case '>=':
      return compareValues(left, right) >= 0;
    case '<':
      return compareValues(left, right) < 0;
    case '<=':
      return compareValues(left, right) <= 0;
    case 'IN':
      return Array.isArray(right) && right.includes(left);
    case 'NOT IN':
      return Array.isArray(right) && !right.includes(left);
    case 'CONTAINS':
      return typeof left === 'string' && typeof right === 'string' && left.includes(right);
    default:
      throw new Error(`ArrayQuery: unsupported operator "${operator}"`);
  }
}

/** Comparator usable for both sorting and ordered relational operators. */
function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return a < b ? -1 : 1;
  }
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}
