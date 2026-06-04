/**
 * DbLogFilters — builds the set of filters for the dblog overview page.
 *
 * Ports `Drupal\dblog\DbLogFilters`:
 *  - getMessageTypes(): distinct `type` values from watchdog, ascending.
 *  - filters(): a `type` filter (only when types exist) plus a `severity`
 *    filter populated from RfcLogLevel::getLevels().
 */
import {
  RFC_LOG_LEVELS,
  RfcLogLevel,
  type Translator,
  type WatchdogStore,
} from './types.js';
import { passthroughTranslator } from './types.js';

/** One filter definition (mirrors the PHP associative array shape). */
export interface DbLogFilter {
  /** Filter title. */
  readonly title: string;
  /** The query field the filter applies to (e.g. `w.type`, `w.severity`). */
  readonly field: string;
  /** Option id -> label map for the filter's select list. */
  readonly options: Record<string | number, string>;
}

export interface DbLogFilterSet {
  type?: DbLogFilter;
  severity: DbLogFilter;
}

export class DbLogFilters {
  constructor(
    private readonly connection: WatchdogStore,
    private readonly t: Translator = passthroughTranslator,
  ) {}

  /** Ports DbLogFilters::getMessageTypes(). */
  getMessageTypes(): string[] {
    return this.connection.distinctTypes();
  }

  /** Ports DbLogFilters::filters(). */
  filters(): DbLogFilterSet {
    const severityOptions: Record<number, string> = {};
    for (const level of Object.values(RfcLogLevel)) {
      if (typeof level === 'number') {
        severityOptions[level] = this.t(RFC_LOG_LEVELS[level as RfcLogLevel]);
      }
    }

    const set: DbLogFilterSet = {
      severity: {
        title: this.t('Severity'),
        field: 'w.severity',
        options: severityOptions,
      },
    };

    const types = this.getMessageTypes();
    if (types.length > 0) {
      const options: Record<string, string> = {};
      for (const type of types) {
        options[type] = this.t(type);
      }
      set.type = {
        title: this.t('Type'),
        field: 'w.type',
        options,
      };
    }

    return set;
  }
}
