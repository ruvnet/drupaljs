import { DataDefinition } from '@drupaljs/typed-data';
import type {
  ComplexDataDefinitionInterface,
  DataDefinitionInterface,
} from '@drupaljs/typed-data';
import type {
  FieldItemConstructor,
  FieldStorageDefinitionInterface,
} from '../contracts.js';

/**
 * A complex data definition describing a single field item's properties.
 *
 * Port of `Drupal\Core\Field\TypedData\FieldItemDataDefinition`. The property
 * definitions and main property are derived from the field type plugin's static
 * `propertyDefinitions()` / `mainPropertyName()`, evaluated against the field's
 * storage definition.
 *
 * @see \Drupal\Core\Field\TypedData\FieldItemDataDefinition
 */
export class FieldItemDataDefinition
  extends DataDefinition
  implements ComplexDataDefinitionInterface
{
  private propertyDefinitionsCache: Record<string, DataDefinitionInterface> | null = null;

  constructor(
    private readonly itemClass: FieldItemConstructor,
    private readonly storageDefinition: FieldStorageDefinitionInterface,
  ) {
    super({ type: `field_item:${storageDefinition.getType()}` });
  }

  getPropertyDefinitions(): Record<string, DataDefinitionInterface> {
    if (this.propertyDefinitionsCache === null) {
      this.propertyDefinitionsCache = this.itemClass.propertyDefinitions(this.storageDefinition);
    }
    return this.propertyDefinitionsCache;
  }

  getPropertyDefinition(name: string): DataDefinitionInterface | null {
    return this.getPropertyDefinitions()[name] ?? null;
  }

  getMainPropertyName(): string | null {
    return this.itemClass.mainPropertyName();
  }
}
