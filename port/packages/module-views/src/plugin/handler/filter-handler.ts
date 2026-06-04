import { HandlerBase, type HandlerOptions } from './handler-base.js';
import type { QueryPluginInterface } from '../query/query-plugin-interface.js';

/**
 * A filter handler: contributes a WHERE condition to the query.
 *
 * Ports the core of `Drupal\views\Plugin\views\filter\FilterPluginBase` (and the
 * `Standard` subclass): it holds an `operator` (default `=`) and a `value`, and
 * its `query()` adds them as a condition in the filter's group. Exposed filters,
 * grouped filters, and operator option forms are deferred.
 */
export class StandardFilter extends HandlerBase {
  /** Comparison operator (ports `$this->operator`, default `=`). */
  readonly operator: string;
  /** Filter value (ports `$this->value`). */
  readonly value: unknown;
  /** The WHERE group this filter joins (ports `$this->options['group']`). */
  readonly group: number;

  constructor(
    options: HandlerOptions & { operator?: string; value?: unknown; group?: number } = {},
  ) {
    super(options);
    this.operator = options.operator ?? '=';
    this.value = options.value;
    this.group = options.group ?? 0;
  }

  override query(query: QueryPluginInterface): void {
    query.addWhere(this.group, this.field, this.value, this.operator);
  }
}
