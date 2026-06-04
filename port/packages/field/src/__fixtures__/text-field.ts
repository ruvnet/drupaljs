import { DataDefinition } from '@drupaljs/typed-data';
import type { DataDefinitionInterface } from '@drupaljs/typed-data';
import { FieldItemBase } from '../field-type/field-item-base.js';
import { FormatterBase } from '../formatter/formatter-base.js';
import { WidgetBase } from '../widget/widget-base.js';
import type {
  FieldDefinitionInterface,
  FieldItemListInterface,
  FieldSchema,
  FieldStorageDefinitionInterface,
  RenderableArray,
} from '../contracts.js';

/**
 * A minimal "string" field type used across the field package tests. Mirrors
 * the shape of core's StringItem: a single 'value' property.
 */
export class StringItem extends FieldItemBase {
  static override propertyDefinitions(
    _fieldDefinition: FieldStorageDefinitionInterface,
  ): Record<string, DataDefinitionInterface> {
    return {
      value: DataDefinition.create('string').setLabel('Text value').setRequired(true),
    };
  }

  static override mainPropertyName(): string | null {
    return 'value';
  }

  static override schema(
    _fieldDefinition: FieldStorageDefinitionInterface,
  ): FieldSchema {
    return {
      columns: {
        value: { type: 'varchar', length: 255 },
      },
    };
  }

  static override defaultStorageSettings(): Record<string, unknown> {
    return { max_length: 255 };
  }

  static override defaultFieldSettings(): Record<string, unknown> {
    return { case_sensitive: false };
  }

  static override generateSampleValue(): Record<string, unknown> {
    return { value: 'sample' };
  }
}

/** A formatter that renders the text value as a plain string element. */
export class StringFormatter extends FormatterBase {
  static override defaultSettings(): Record<string, unknown> {
    return { trim_length: 0 };
  }

  override viewElements(items: FieldItemListInterface, _langcode: string): RenderableArray[] {
    const elements: RenderableArray[] = [];
    for (let delta = 0; delta < items.count(); delta++) {
      const item = items.get(delta);
      elements.push({ '#markup': item ? item.getString() : '' });
    }
    return elements;
  }
}

/** A widget that renders a single textfield element per delta. */
export class StringTextfieldWidget extends WidgetBase {
  static override defaultSettings(): Record<string, unknown> {
    return { size: 60 };
  }

  override formElement(
    items: FieldItemListInterface,
    delta: number,
    element: RenderableArray,
  ): RenderableArray {
    const item = items.get(delta);
    return {
      ...element,
      '#type': 'textfield',
      '#size': this.getSetting('size'),
      '#default_value': item ? item.get('value').getValue() : '',
    };
  }
}
