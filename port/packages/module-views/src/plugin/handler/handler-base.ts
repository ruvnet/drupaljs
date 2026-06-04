import type { QueryPluginInterface } from '../query/query-plugin-interface.js';

/**
 * Common options shared by views handlers, sourced from the view's display
 * configuration. Ports the relevant fields of a handler's `$options` /
 * `$definition` in `Drupal\views\Plugin\views\HandlerBase`.
 */
export interface HandlerOptions {
  /** The table the handler operates on (`$this->table`). */
  table?: string;
  /** The field the handler operates on (`$this->field` / `$this->realField`). */
  field?: string;
}

/**
 * Base for all views handlers (field / filter / sort / argument / relationship).
 *
 * Ports the shared surface of `Drupal\views\Plugin\views\HandlerBase`. Each
 * handler participates in `build()` by contributing to the query via
 * {@link query}. Concrete subclasses implement that interaction.
 */
export abstract class HandlerBase {
  /** The table this handler operates on. */
  readonly table: string;
  /** The field this handler operates on. */
  readonly field: string;

  constructor(options: HandlerOptions = {}) {
    this.table = options.table ?? '';
    this.field = options.field ?? '';
  }

  /**
   * Adds this handler's contribution to the query (ports HandlerBase::query()).
   * The base implementation does nothing; subclasses override.
   */
  query(_query: QueryPluginInterface): void {
    // No-op by default.
  }

  /** A human label for admin UIs (ports adminLabel()). */
  adminLabel(): string {
    return this.field;
  }
}
