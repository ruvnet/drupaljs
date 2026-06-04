/**
 * Constants and enums ported from Drupal's datetime / datetime_range modules.
 *
 * Ref:
 *  - core/modules/datetime/src/Plugin/Field/FieldType/DateTimeItemInterface.php
 *  - core/modules/datetime_range/src/DateTimeRangeDisplayOptions.php
 */

/**
 * Timezone that dates are stored in.
 *
 * Mirrors DateTimeItemInterface::STORAGE_TIMEZONE.
 */
export const STORAGE_TIMEZONE = 'UTC';

/**
 * Storage format for a date-and-time value (PHP: `Y-m-d\TH:i:s`).
 *
 * Mirrors DateTimeItemInterface::DATETIME_STORAGE_FORMAT.
 */
export const DATETIME_STORAGE_FORMAT = 'Y-m-d\\TH:i:s';

/**
 * Storage format for a date-only value (PHP: `Y-m-d`).
 *
 * Mirrors DateTimeItemInterface::DATE_STORAGE_FORMAT.
 */
export const DATE_STORAGE_FORMAT = 'Y-m-d';

/**
 * The `datetime_type` storage setting.
 *
 * - `date`     — store only a calendar date (DateTimeItem::DATETIME_TYPE_DATE).
 * - `datetime` — store a date and time (DateTimeItem::DATETIME_TYPE_DATETIME).
 * - `allday`   — daterange-only: an all-day range (DateRangeItem::DATETIME_TYPE_ALLDAY).
 */
export enum DateTimeType {
  Date = 'date',
  DateTime = 'datetime',
  AllDay = 'allday',
}

/**
 * Values for the daterange `from_to` formatter setting.
 *
 * Mirrors enum DateTimeRangeDisplayOptions.
 */
export enum DateTimeRangeDisplayOptions {
  Both = 'both',
  StartDate = 'start_date',
  EndDate = 'end_date',
}
