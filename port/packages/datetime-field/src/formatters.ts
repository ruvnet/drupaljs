/**
 * Port of the datetime / datetime_range field formatters.
 *
 * Ref:
 *  - core/modules/datetime/src/Plugin/Field/FieldFormatter/DateTimeFormatterBase.php
 *  - core/modules/datetime/src/Plugin/Field/FieldFormatter/DateTimePlainFormatter.php
 *  - core/modules/datetime/src/Plugin/Field/FieldFormatter/DateTimeCustomFormatter.php
 *  - core/modules/datetime_range/src/Plugin/Field/FieldFormatter/DateRangeDefaultFormatter.php
 *  - core/modules/datetime_range/src/DateTimeRangeTrait.php
 *
 * The PHP formatters return Drupal render arrays (`#theme => time`, ISO `<time>`
 * attributes, cache contexts). Here we expose the formatter *contract* and the
 * core text-rendering logic: each formatter has plugin metadata, default
 * settings, and a `viewElement(item)` that returns the rendered string (or
 * `null` when the item has no displayable value), reading UTC components.
 *
 * Timezone conversion (user/site tz, `timezone_override`) is intentionally not
 * applied in this pure value layer — values render in the storage timezone
 * (UTC). The `timezone_override` setting is preserved for contract parity.
 */

import {
  DateTimeType,
  DATETIME_STORAGE_FORMAT,
  DATE_STORAGE_FORMAT,
  DateTimeRangeDisplayOptions,
} from './constants.js';
import { phpDateFormat } from './phpDateFormat.js';
import { DateTimeItem } from './DateTimeItem.js';
import { DateRangeItem } from './DateRangeItem.js';

/** Settings shared by all datetime formatters (DateTimeFormatterBase). */
export interface DateTimeFormatterBaseSettings {
  /** Forced display timezone; empty means use the ambient timezone. */
  timezone_override: string;
}

/**
 * Base for datetime formatters: holds the field's `datetime_type` storage
 * setting and resolves the storage-format pattern used for plain rendering.
 */
abstract class DateTimeFormatterBase {
  protected constructor(protected readonly datetimeType: DateTimeType) {}

  static defaultSettings(): DateTimeFormatterBaseSettings {
    return { timezone_override: '' };
  }

  /** The storage-format pattern for this field's type. */
  protected storageFormat(): string {
    return this.datetimeType === DateTimeType.Date
      ? DATE_STORAGE_FORMAT
      : DATETIME_STORAGE_FORMAT;
  }
}

/** The 'Plain' formatter for datetime fields (`datetime_plain`). */
export class DateTimePlainFormatter extends DateTimeFormatterBase {
  static readonly id = 'datetime_plain';
  static readonly label = 'Plain';
  static readonly fieldTypes = ['datetime'] as const;

  constructor(datetimeType: DateTimeType) {
    super(datetimeType);
  }

  /** Render the item to a storage-format string, or null when empty. */
  viewElement(item: DateTimeItem): string | null {
    const date = item.getDate(this.datetimeType);
    if (date === null) {
      return null;
    }
    return phpDateFormat(date, this.storageFormat());
  }
}

/** Settings for the 'Custom' datetime formatter. */
export interface DateTimeCustomFormatterSettings extends DateTimeFormatterBaseSettings {
  /** PHP date-format pattern. */
  date_format: string;
}

/** The 'Custom' formatter for datetime fields (`datetime_custom`). */
export class DateTimeCustomFormatter extends DateTimeFormatterBase {
  static readonly id = 'datetime_custom';
  static readonly label = 'Custom';
  static readonly fieldTypes = ['datetime'] as const;

  private readonly dateFormat: string;

  constructor(datetimeType: DateTimeType, settings: Partial<DateTimeCustomFormatterSettings> = {}) {
    super(datetimeType);
    this.dateFormat = settings.date_format ?? DATETIME_STORAGE_FORMAT;
  }

  static override defaultSettings(): DateTimeCustomFormatterSettings {
    return {
      date_format: DATETIME_STORAGE_FORMAT,
      ...DateTimeFormatterBase.defaultSettings(),
    };
  }

  /** Render the item using the configured `date_format`, or null when empty. */
  viewElement(item: DateTimeItem): string | null {
    const date = item.getDate(this.datetimeType);
    if (date === null) {
      return null;
    }
    return phpDateFormat(date, this.dateFormat);
  }
}

/** Settings for the daterange formatters (adds from_to + separator). */
export interface DateRangeFormatterSettings extends DateTimeFormatterBaseSettings {
  from_to: DateTimeRangeDisplayOptions;
  separator: string;
}

/**
 * The 'Default' formatter for daterange fields (`daterange_default`).
 *
 * Honors the `from_to` setting (both / start only / end only) and joins the two
 * bounds with `separator` (surrounded by spaces, matching the PHP trait). When
 * both bounds are equal, a single date is rendered.
 */
export class DateRangeDefaultFormatter {
  static readonly id = 'daterange_default';
  static readonly label = 'Default';
  static readonly fieldTypes = ['daterange'] as const;

  private readonly fromTo: DateTimeRangeDisplayOptions;
  private readonly separator: string;

  constructor(
    private readonly datetimeType: DateTimeType,
    settings: Partial<DateRangeFormatterSettings> = {},
  ) {
    this.fromTo = settings.from_to ?? DateTimeRangeDisplayOptions.Both;
    this.separator = settings.separator ?? '-';
  }

  static defaultSettings(): DateRangeFormatterSettings {
    return {
      from_to: DateTimeRangeDisplayOptions.Both,
      separator: '-',
      ...DateTimeFormatterBase.defaultSettings(),
    };
  }

  private get showStart(): boolean {
    return (
      this.fromTo === DateTimeRangeDisplayOptions.Both ||
      this.fromTo === DateTimeRangeDisplayOptions.StartDate
    );
  }

  private get showEnd(): boolean {
    return (
      this.fromTo === DateTimeRangeDisplayOptions.Both ||
      this.fromTo === DateTimeRangeDisplayOptions.EndDate
    );
  }

  private format(date: Date): string {
    const pattern =
      this.datetimeType === DateTimeType.Date
        ? DATE_STORAGE_FORMAT
        : DATETIME_STORAGE_FORMAT;
    return phpDateFormat(date, pattern);
  }

  /**
   * Render the range to a string, or null when either bound is missing.
   *
   * Mirrors DateTimeRangeTrait::viewElements: requires both start and end to be
   * present; collapses to a single rendered date when the two instants match.
   */
  viewElement(item: DateRangeItem): string | null {
    const start = item.getStartDate(this.datetimeType);
    const end = item.getEndDate(this.datetimeType);
    if (start === null || end === null) {
      return null;
    }

    if (start.getTime() === end.getTime()) {
      return this.format(start);
    }

    const parts: string[] = [];
    if (this.showStart) {
      parts.push(this.format(start));
    }
    if (this.showEnd) {
      parts.push(this.format(end));
    }
    return parts.join(` ${this.separator} `);
  }
}
