/**
 * Port of the `datetime` field type.
 *
 * Ref: core/modules/datetime/src/Plugin/Field/FieldType/DateTimeItem.php
 *
 * The PHP plugin couples the field type to Drupal's TypedData / FieldItemBase
 * machinery. Here we expose the same *contract* — plugin metadata, storage
 * schema, property definitions, default settings, emptiness, sample generation,
 * and the computed `date` derivation — as plain, dependency-free values and a
 * small value object.
 */

import {
  DateTimeType,
  DATETIME_STORAGE_FORMAT,
  DATE_STORAGE_FORMAT,
} from './constants.js';
import { formatStorage, parseStorage } from './DateTimeStorageFormat.js';

/** Storage settings for the datetime field type. */
export interface DateTimeStorageSettings {
  datetime_type: DateTimeType;
}

/** A single column descriptor in a field storage schema. */
export interface ColumnSchema {
  description: string;
  type: 'varchar';
  length: number;
}

/** Field storage schema (columns + indexes). */
export interface FieldSchema {
  columns: Record<string, ColumnSchema>;
  indexes: Record<string, string[]>;
}

/** A computed/declared property definition. */
export interface PropertyDefinition {
  dataType: string;
  label: string;
  required?: boolean;
  computed?: boolean;
  description?: string;
  /** For computed properties: which raw column feeds the computation. */
  dateSource?: string;
}

/** The raw stored shape of a datetime field item. */
export interface DateTimeItemValue {
  value: string | null;
}

/**
 * Value object wrapping a stored datetime item.
 *
 * The `date` "property" of the PHP plugin is computed lazily from `value`; here
 * {@link getDate} performs that derivation.
 */
export class DateTimeItem {
  /** Plugin id. */
  static readonly id = 'datetime';
  /** Plugin category. */
  static readonly category = 'date_time';
  /** Default widget plugin id. */
  static readonly defaultWidget = 'datetime_default';
  /** Default formatter plugin id. */
  static readonly defaultFormatter = 'datetime_default';

  constructor(protected readonly raw: DateTimeItemValue) {}

  /** Default storage settings (DateTimeItem::defaultStorageSettings). */
  static defaultStorageSettings(): DateTimeStorageSettings {
    return { datetime_type: DateTimeType.DateTime };
  }

  /** Storage schema (DateTimeItem::schema). */
  static schema(): FieldSchema {
    return {
      columns: {
        value: {
          description: 'The date value.',
          type: 'varchar',
          length: 20,
        },
      },
      indexes: {
        value: ['value'],
      },
    };
  }

  /** Property definitions (DateTimeItem::propertyDefinitions). */
  static propertyDefinitions(): Record<string, PropertyDefinition> {
    return {
      value: {
        dataType: 'datetime_iso8601',
        label: 'Date value',
        required: true,
      },
      date: {
        dataType: 'any',
        label: 'Computed date',
        description: 'The computed DateTime object.',
        computed: true,
        dateSource: 'value',
      },
    };
  }

  /**
   * Generate a sample value (DateTimeItem::generateSampleValue).
   *
   * Picks a random instant within the past year, formatted for the given type.
   */
  static generateSampleValue(type: DateTimeType, now: Date = new Date()): DateTimeItemValue {
    const offsetSeconds = Math.floor(Math.random() * 86400 * 365);
    const sample = new Date(now.getTime() - offsetSeconds * 1000);
    return { value: formatStorage(sample, type) };
  }

  /** True when no value is stored (DateTimeItem::isEmpty). */
  isEmpty(): boolean {
    const value = this.raw.value;
    return value === null || value === '';
  }

  /** The raw stored value. */
  getValue(): DateTimeItemValue {
    return this.raw;
  }

  /**
   * The computed `date` property: parse the stored `value` for the given type.
   *
   * Returns null when empty or unparseable.
   */
  getDate(type: DateTimeType): Date | null {
    if (this.isEmpty()) {
      return null;
    }
    return parseStorage(this.raw.value as string, type);
  }
}

/** The storage format string for the given type (PHP date() pattern). */
export function storageFormatFor(type: DateTimeType): string {
  return type === DateTimeType.DateTime ? DATETIME_STORAGE_FORMAT : DATE_STORAGE_FORMAT;
}
