/**
 * Port of the `daterange` field type (datetime_range module).
 *
 * Ref: core/modules/datetime_range/src/Plugin/Field/FieldType/DateRangeItem.php
 *
 * Extends the datetime contract with a second `end_value` storage column and
 * computed `start_date` / `end_date` properties. The `allday` storage type is
 * introduced here (stored as date-only values).
 */

import { DateTimeType } from './constants.js';
import { formatStorage, parseStorage } from './DateTimeStorageFormat.js';
import type { FieldSchema, PropertyDefinition } from './DateTimeItem.js';
import { DateTimeItem } from './DateTimeItem.js';

/** The raw stored shape of a daterange field item. */
export interface DateRangeItemValue {
  value: string | null;
  end_value: string | null;
}

/** Value object wrapping a stored daterange item. */
export class DateRangeItem {
  /** Plugin id. */
  static readonly id = 'daterange';
  /** Plugin category. */
  static readonly category = 'date_time';
  /** Default widget plugin id. */
  static readonly defaultWidget = 'daterange_default';
  /** Default formatter plugin id. */
  static readonly defaultFormatter = 'daterange_default';

  constructor(private readonly raw: DateRangeItemValue) {}

  /** Default storage settings — inherited from the datetime type. */
  static defaultStorageSettings(): { datetime_type: DateTimeType } {
    return DateTimeItem.defaultStorageSettings();
  }

  /** Storage schema (DateRangeItem::schema): start + end columns/indexes. */
  static schema(): FieldSchema {
    const base = DateTimeItem.schema();
    const valueColumn = { ...base.columns.value!, description: 'The start date value.' };
    return {
      columns: {
        value: valueColumn,
        end_value: { ...valueColumn, description: 'The end date value.' },
      },
      indexes: {
        value: ['value'],
        end_value: ['end_value'],
      },
    };
  }

  /** Property definitions (DateRangeItem::propertyDefinitions). */
  static propertyDefinitions(): Record<string, PropertyDefinition> {
    return {
      value: {
        dataType: 'datetime_iso8601',
        label: 'Start date value',
        required: true,
      },
      start_date: {
        dataType: 'any',
        label: 'Computed start date',
        description: 'The computed start DateTime object.',
        computed: true,
        dateSource: 'value',
      },
      end_value: {
        dataType: 'datetime_iso8601',
        label: 'End date value',
        required: true,
      },
      end_date: {
        dataType: 'any',
        label: 'Computed end date',
        description: 'The computed end DateTime object.',
        computed: true,
        dateSource: 'end_value',
      },
    };
  }

  /**
   * Generate a sample value (DateRangeItem::generateSampleValue).
   *
   * Produces a one-day range ending one day before "now" minus a random offset.
   */
  static generateSampleValue(type: DateTimeType, now: Date = new Date()): DateRangeItemValue {
    const offsetSeconds = Math.floor(Math.random() * 86400 * 365) + 86400;
    const start = new Date(now.getTime() - offsetSeconds * 1000);
    const end = new Date(start.getTime() + 86400 * 1000);
    return {
      value: formatStorage(start, type),
      end_value: formatStorage(end, type),
    };
  }

  /** True only when both start and end values are absent (DateRangeItem::isEmpty). */
  isEmpty(): boolean {
    const start = this.raw.value;
    const end = this.raw.end_value;
    const startEmpty = start === null || start === '';
    const endEmpty = end === null || end === '';
    return startEmpty && endEmpty;
  }

  /** The raw stored value. */
  getValue(): DateRangeItemValue {
    return this.raw;
  }

  /** Computed `start_date` property. */
  getStartDate(type: DateTimeType): Date | null {
    const start = this.raw.value;
    if (start === null || start === '') {
      return null;
    }
    return parseStorage(start, type);
  }

  /** Computed `end_date` property. */
  getEndDate(type: DateTimeType): Date | null {
    const end = this.raw.end_value;
    if (end === null || end === '') {
      return null;
    }
    return parseStorage(end, type);
  }
}
