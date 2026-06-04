/**
 * Port of the data-building core of
 * Drupal\field_ui\FieldConfigListBuilder.
 *
 * The PHP list builder renders an admin table; the framework-agnostic part is
 * turning a set of field definitions into sorted, displayable rows and
 * filtering by display configurability. That logic is extracted here, free of
 * any render layer.
 *
 * @see drupal-core/core/modules/field_ui/src/FieldConfigListBuilder.php
 */

import type { DisplayContext, FieldDefinitionInterface } from './types.js';

/** A single displayable field row. */
export interface FieldRow {
  fieldName: string;
  type: string;
  label: string;
}

export class FieldConfigListBuilder {
  /**
   * Builds one row per field, sorted alphabetically by label
   * (case-insensitive) to match Drupal's manage-fields ordering.
   */
  buildRows(fields: FieldDefinitionInterface[]): FieldRow[] {
    return fields
      .map((field) => ({
        fieldName: field.getName(),
        type: field.getType(),
        label: field.getLabel(),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
      );
  }

  /** Keeps only fields whose display is configurable in the given context. */
  filterConfigurable(
    fields: FieldDefinitionInterface[],
    context: DisplayContext,
  ): FieldDefinitionInterface[] {
    return fields.filter((field) => field.isDisplayConfigurable(context));
  }
}
