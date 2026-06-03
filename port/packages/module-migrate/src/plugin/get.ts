/**
 * `get` process plugin. Port of
 * `Drupal\migrate\Plugin\migrate\process\Get`.
 *
 * Returns the value(s) of the configured `source` property/properties from the
 * row. Single-string sources yield a scalar (and set `multiple()` when the value
 * is itself an array); array sources yield a list. Empty source entries fall
 * back to the incoming pipeline value. Declared with `handle_multiples: true`.
 */

import { ProcessPluginBase } from './process-plugin-base.js';
import type { MigrateExecutableInterface } from '../contracts.js';
import type { Row } from '../row.js';

export class Get extends ProcessPluginBase {
  private multipleFlag = false;

  constructor(configuration: { source: string | string[] }) {
    super(configuration, 'get', { handle_multiples: true });
  }

  override transform(
    value: unknown,
    _exec: MigrateExecutableInterface,
    row: Row,
    _destinationProperty: string,
  ): unknown {
    const source = (this.configuration as { source: string | string[] }).source;
    const properties = typeof source === 'string' ? [source] : source;
    const result: unknown[] = [];
    for (const property of properties) {
      if (property || String(property) === '0') {
        result.push(row.get(property));
      } else {
        result.push(value);
      }
    }

    if (typeof source === 'string') {
      this.multipleFlag = Array.isArray(result[0]);
      return result[0];
    }
    return result;
  }

  override multiple(): boolean {
    return this.multipleFlag;
  }
}
