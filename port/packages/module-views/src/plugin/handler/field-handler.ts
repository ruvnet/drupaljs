import { HandlerBase, type HandlerOptions } from './handler-base.js';
import type { QueryPluginInterface } from '../query/query-plugin-interface.js';
import type { ResultRow } from '../../result-row.js';

/**
 * A field handler: selects a column and renders its per-row value.
 *
 * Ports the core behaviour of `Drupal\views\Plugin\views\field\FieldPluginBase`
 * (and its `Standard` subclass): `query()` registers the field for selection
 * with an alias, `getValue()` reads the row's aliased value, and `render()`
 * produces output. Theming, click-sorting, tokens, and rewriting are deferred.
 */
export class StandardField extends HandlerBase {
  /** The alias under which the field's value lands in a ResultRow. */
  readonly alias: string;

  constructor(options: HandlerOptions & { alias?: string } = {}) {
    super(options);
    this.alias = options.alias ?? this.field;
  }

  override query(query: QueryPluginInterface): void {
    query.addField(this.table || null, this.field, this.alias);
  }

  /** Returns the raw value for this field from a result row (ports getValue()). */
  getValue(row: ResultRow): unknown {
    return row.get(this.alias);
  }

  /** Renders the field value to a string (ports the simplest render() path). */
  render(row: ResultRow): string {
    const value = this.getValue(row);
    return value === null || value === undefined ? '' : String(value);
  }
}
