import { HandlerBase, type HandlerOptions } from './handler-base.js';
import type { QueryPluginInterface } from '../query/query-plugin-interface.js';

/**
 * A sort handler: contributes an ORDER BY clause to the query.
 *
 * Ports the core of `Drupal\views\Plugin\views\sort\SortPluginBase` (and the
 * `Standard` subclass): it holds an `order` direction (default `ASC`) and its
 * `query()` adds the order-by. Exposed sorting and grouping are deferred.
 */
export class StandardSort extends HandlerBase {
  /** Sort direction (ports `$this->options['order']`, default `ASC`). */
  readonly order: 'ASC' | 'DESC';

  constructor(options: HandlerOptions & { order?: 'ASC' | 'DESC' } = {}) {
    super(options);
    this.order = options.order ?? 'ASC';
  }

  override query(query: QueryPluginInterface): void {
    query.addOrderBy(this.table || null, this.field, this.order);
  }
}
