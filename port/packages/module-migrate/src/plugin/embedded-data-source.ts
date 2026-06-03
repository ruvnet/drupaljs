/**
 * `embedded_data` source plugin. Port of
 * `Drupal\migrate\Plugin\migrate\source\EmbeddedDataSource`.
 *
 * Injects fixed source data from the plugin configuration. Useful for small
 * reference datasets and for tests. Implements the iterator surface of
 * `SourcePluginBase` (rewind/valid/current/next) directly.
 */

import { Row } from '../row.js';
import type { FieldDefinitions, MigrateSourceInterface } from '../contracts.js';

export interface EmbeddedDataConfig {
  /** Each row is an associative array of values keyed by field name. */
  data_rows: Record<string, unknown>[];
  /** Unique-ID field definitions keyed by field name. */
  ids: FieldDefinitions;
}

export class EmbeddedDataSource implements MigrateSourceInterface {
  private readonly dataRows: Record<string, unknown>[];
  private readonly ids: FieldDefinitions;
  private cursor = 0;

  constructor(configuration: EmbeddedDataConfig) {
    this.dataRows = configuration.data_rows;
    this.ids = configuration.ids;
  }

  fields(): Record<string, string> {
    if (this.count() > 0) {
      const fieldNames = Object.keys(this.dataRows[0]!);
      return Object.fromEntries(fieldNames.map((name) => [name, name]));
    }
    return {};
  }

  getIds(): FieldDefinitions {
    return this.ids;
  }

  count(): number {
    return this.dataRows.length;
  }

  toString(): string {
    return 'Embedded data';
  }

  rewind(): void {
    this.cursor = 0;
  }

  valid(): boolean {
    return this.cursor < this.dataRows.length;
  }

  current(): Row | null {
    if (!this.valid()) {
      return null;
    }
    return new Row(this.dataRows[this.cursor]!, this.ids);
  }

  next(): void {
    this.cursor++;
  }
}
